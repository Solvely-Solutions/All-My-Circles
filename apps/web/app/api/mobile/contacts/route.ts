import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse, supabase, getValidHubSpotClient, getAuthContext } from '../../../../lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const deviceId = request.headers.get('x-device-id');
    if (!deviceId) {
      return createApiResponse({ error: 'Device ID required' }, 400);
    }

    const body = await request.json();
    const {
      name, email, phone, company, title, notes, tags, groups,
      // All My Circles specific fields
      connectionStrength, contactValue, firstMetLocation, firstMetDate,
      lastInteractionDate, nextFollowupDate, totalInteractions
    } = body;

    if (!name) {
      return createApiResponse({ error: 'Name is required' }, 400);
    }

    // Get authentication context
    const authContext = await getAuthContext(request);
    const { organization, user } = authContext;

    if (!user) {
      return createApiResponse({ error: 'User not found' }, 404);
    }

    // Create contact in Supabase
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        organization_id: organization.id,
        first_name: name.split(' ')[0] || '',
        last_name: name.split(' ').slice(1).join(' ') || '',
        email: email || null,
        phone: phone || null,
        company: company || null,
        job_title: title || null,
        notes: notes || null,
        tags: tags || [],
        // All My Circles specific fields
        connection_strength: connectionStrength || null,
        contact_value: contactValue || null,
        first_met_location: firstMetLocation || null,
        first_met_date: firstMetDate || null,
        last_interaction_date: lastInteractionDate || null,
        next_followup_date: nextFollowupDate || null,
        total_interactions: totalInteractions || 0
      })
      .select()
      .single();

    if (contactError) {
      console.error('Contact creation error:', contactError);
      return createApiResponse({ error: 'Failed to create contact' }, 500);
    }

    // Try to sync to HubSpot
    try {
      const hubspotClient = await getValidHubSpotClient(organization);

      const hubspotContact = await hubspotClient.crm.contacts.basicApi.create({
        properties: {
          // Standard HubSpot properties
          firstname: contact.first_name,
          lastname: contact.last_name,
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
          jobtitle: contact.job_title,
          lifecyclestage: 'lead',
          lead_source: 'Mobile App',

          // All My Circles custom properties
          amc_connection_strength: contact.connection_strength,
          amc_contact_value: contact.contact_value,
          amc_first_met_location: contact.first_met_location,
          amc_first_met_date: contact.first_met_date,
          amc_networking_tags: tags && tags.length > 0 ? tags.join(', ') : null,
          amc_networking_notes: contact.notes,
          amc_last_interaction_date: contact.last_interaction_date,
          amc_next_followup_date: contact.next_followup_date,
          amc_total_interactions: (contact.total_interactions || 0).toString(),
          amc_contact_id: contact.id, // Store the Supabase contact ID
        },
        associations: []
      });

      if (hubspotContact?.id) {
        // Update contact with HubSpot ID
        await supabase
          .from('contacts')
          .update({ hubspot_contact_id: hubspotContact.id })
          .eq('id', contact.id);

        // Update our local contact object to include the new HubSpot ID
        contact.hubspot_contact_id = hubspotContact.id;
      }

      console.log('Contact synced to HubSpot:', hubspotContact?.id);
    } catch (hubspotError) {
      console.error('HubSpot sync failed:', hubspotError);
      // Continue without failing - contact is still created locally
    }

    return createApiResponse({
      success: true,
      contact: {
        id: contact.id,
        name: `${contact.first_name} ${contact.last_name}`.trim(),
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        title: contact.job_title,
        notes: contact.notes,
        tags: contact.tags,
        hubspotContactId: contact.hubspot_contact_id, // This will now include the newly assigned HubSpot ID
        createdAt: contact.created_at
      }
    });

  } catch (error) {
    console.error('Mobile contacts API error:', error);
    return createApiResponse({ error: 'Internal server error' }, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const deviceId = request.headers.get('x-device-id');
    if (!deviceId) {
      return createApiResponse({ error: 'Device ID required' }, 400);
    }

    // Get authentication context
    const authContext = await getAuthContext(request);
    const { organization, user } = authContext;

    if (!user) {
      return createApiResponse({ error: 'User not found' }, 404);
    }

    // Get contacts for this organization
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false });

    if (contactsError) {
      console.error('Contacts fetch error:', contactsError);
      return createApiResponse({ error: 'Failed to fetch contacts' }, 500);
    }

    const formattedContacts = contacts.map(contact => ({
      id: contact.id,
      name: `${contact.first_name} ${contact.last_name}`.trim(),
      firstName: contact.first_name,
      lastName: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      jobTitle: contact.job_title,
      notes: contact.notes,
      tags: contact.tags || [],
      // All My Circles specific fields
      connection_strength: contact.connection_strength,
      contact_value: contact.contact_value,
      first_met_location: contact.first_met_location,
      first_met_date: contact.first_met_date,
      last_interaction_date: contact.last_interaction_date,
      next_followup_date: contact.next_followup_date,
      total_interactions: contact.total_interactions || 0,
      hubspotContactId: contact.hubspot_contact_id,
      createdAt: contact.created_at,
      updatedAt: contact.updated_at
    }));

    return createApiResponse({
      success: true,
      contacts: formattedContacts
    });

  } catch (error) {
    console.error('Mobile contacts GET API error:', error);
    return createApiResponse({ error: 'Internal server error' }, 500);
  }
}