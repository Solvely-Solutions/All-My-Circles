import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@hubspot/api-client';
import { supabase } from '../../../../lib/api-utils';

async function getOrganizationFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const deviceId = request.headers.get('x-device-id');
  
  if (!authHeader && !deviceId) {
    throw new Error('Authentication required');
  }

  let organizationId;

  if (deviceId) {
    const { data: user } = await supabase
      .from('users')
      .select('organization_id')
      .eq('mobile_device_id', deviceId)
      .single();
    
    if (!user) throw new Error('Device not authorized');
    organizationId = user.organization_id;
  } else {
    const portalId = request.cookies.get('hubspot_portal_id')?.value;
    if (!portalId) throw new Error('Portal ID not found');

    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('hubspot_portal_id', parseInt(portalId))
      .single();
    
    if (!org) throw new Error('Organization not found');
    organizationId = org.id;
  }

  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single();

  if (!organization) throw new Error('Organization not found');
  return organization;
}

// GET /api/contacts/[id] - Get contact details with interaction history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organization = await getOrganizationFromRequest(request);
    const contactId = params.id;

    const { data: contact, error } = await supabase
      .from('contacts')
      .select(`
        *,
        first_met_at:events(id, name, location, start_date),
        interactions(
          id, interaction_type, date, location, notes, 
          duration_minutes, follow_up_needed, created_at
        )
      `)
      .eq('id', contactId)
      .eq('organization_id', organization.id)
      .single();

    if (error || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json(contact);

  } catch (error) {
    console.error('Get contact error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/contacts/[id] - Update contact
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organization = await getOrganizationFromRequest(request);
    const contactId = params.id;
    const updateData = await request.json();

    // Get current contact
    const { data: currentContact } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .eq('organization_id', organization.id)
      .single();

    if (!currentContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Update contact in Supabase
    const { data: contact, error: dbError } = await supabase
      .from('contacts')
      .update({
        ...updateData,
        hubspot_sync_needed: true,
        mobile_sync_needed: true,
      })
      .eq('id', contactId)
      .eq('organization_id', organization.id)
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
    }

    // Sync to HubSpot if tokens are available and contact has HubSpot ID
    if (organization.hubspot_access_token && currentContact.hubspot_contact_id) {
      try {
        const hubspotClient = new Client({ accessToken: organization.hubspot_access_token });
        
        const hubspotProperties: any = {};
        
        // Map fields to HubSpot properties
        if (updateData.first_name !== undefined) hubspotProperties.firstname = updateData.first_name;
        if (updateData.last_name !== undefined) hubspotProperties.lastname = updateData.last_name;
        if (updateData.email !== undefined) hubspotProperties.email = updateData.email;
        if (updateData.phone !== undefined) hubspotProperties.phone = updateData.phone;
        if (updateData.company !== undefined) hubspotProperties.company = updateData.company;
        if (updateData.job_title !== undefined) hubspotProperties.jobtitle = updateData.job_title;
        
        // All My Circles custom networking properties
        if (updateData.connection_strength !== undefined) hubspotProperties.amc_connection_strength = updateData.connection_strength;
        if (updateData.contact_value !== undefined) hubspotProperties.amc_contact_value = updateData.contact_value;
        if (updateData.first_met_location !== undefined) hubspotProperties.amc_first_met_location = updateData.first_met_location;
        if (updateData.first_met_date !== undefined) hubspotProperties.amc_first_met_date = updateData.first_met_date;
        if (updateData.tags !== undefined) hubspotProperties.amc_networking_tags = updateData.tags?.join(', ');
        if (updateData.notes !== undefined) hubspotProperties.amc_networking_notes = updateData.notes;
        if (updateData.last_interaction_date !== undefined) hubspotProperties.amc_last_interaction_date = updateData.last_interaction_date;
        if (updateData.next_followup_date !== undefined) hubspotProperties.amc_next_followup_date = updateData.next_followup_date;
        if (updateData.total_interactions !== undefined) hubspotProperties.amc_total_interactions = updateData.total_interactions?.toString();

        await hubspotClient.crm.contacts.basicApi.update(
          currentContact.hubspot_contact_id.toString(),
          { properties: hubspotProperties }
        );
        
        // Update sync status
        await supabase
          .from('contacts')
          .update({
            hubspot_sync_needed: false,
            last_synced_at: new Date().toISOString(),
          })
          .eq('id', contactId);

      } catch (hubspotError) {
        console.error('HubSpot sync error:', hubspotError);
      }
    }

    return NextResponse.json(contact);

  } catch (error) {
    console.error('Update contact error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/[id] - Delete contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organization = await getOrganizationFromRequest(request);
    const contactId = params.id;

    // Get contact to check HubSpot ID
    const { data: contact } = await supabase
      .from('contacts')
      .select('hubspot_contact_id')
      .eq('id', contactId)
      .eq('organization_id', organization.id)
      .single();

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Delete from HubSpot first if it exists there
    if (organization.hubspot_access_token && contact.hubspot_contact_id) {
      try {
        const hubspotClient = new Client({ accessToken: organization.hubspot_access_token });
        await hubspotClient.crm.contacts.basicApi.archive(contact.hubspot_contact_id.toString());
      } catch (hubspotError) {
        console.error('HubSpot delete error:', hubspotError);
        // Continue with local deletion even if HubSpot fails
      }
    }

    // Delete from Supabase (this will cascade delete interactions)
    const { error: dbError } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId)
      .eq('organization_id', organization.id);

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Contact deleted successfully' });

  } catch (error) {
    console.error('Delete contact error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}