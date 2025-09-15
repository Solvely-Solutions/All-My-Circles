import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse } from '@/lib/api-utils';
import { supabase } from '@/lib/supabase';
import { hubspotService } from '@/lib/hubspot-service';

export async function POST(request: NextRequest) {
  try {
    const deviceId = request.headers.get('x-device-id');
    if (!deviceId) {
      return createApiResponse({ error: 'Device ID required' }, 400);
    }

    const body = await request.json();
    const { name, email, phone, company, title, notes, tags, groups } = body;

    if (!name) {
      return createApiResponse({ error: 'Name is required' }, 400);
    }

    // Get the user for this device
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('user_id')
      .eq('device_id', deviceId)
      .single();

    if (deviceError || !device) {
      return createApiResponse({ error: 'Device not found' }, 404);
    }

    // Create contact in Supabase
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        user_id: device.user_id,
        first_name: name.split(' ')[0] || '',
        last_name: name.split(' ').slice(1).join(' ') || '',
        email: email || null,
        phone: phone || null,
        company: company || null,
        job_title: title || null,
        notes: notes || null,
        tags: tags || [],
        contact_source: 'mobile_app'
      })
      .select()
      .single();

    if (contactError) {
      console.error('Contact creation error:', contactError);
      return createApiResponse({ error: 'Failed to create contact' }, 500);
    }

    // Try to sync to HubSpot
    try {
      const hubspotContact = await hubspotService.createContact({
        firstName: contact.first_name,
        lastName: contact.last_name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        jobTitle: contact.job_title,
        lifecyclestage: 'lead',
        lead_source: 'Mobile App'
      });

      if (hubspotContact?.id) {
        // Update contact with HubSpot ID
        await supabase
          .from('contacts')
          .update({ hubspot_contact_id: hubspotContact.id })
          .eq('id', contact.id);
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
        hubspotContactId: contact.hubspot_contact_id,
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

    // Get the user for this device
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('user_id')
      .eq('device_id', deviceId)
      .single();

    if (deviceError || !device) {
      return createApiResponse({ error: 'Device not found' }, 404);
    }

    // Get contacts for this user
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', device.user_id)
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