import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@hubspot/api-client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function getOrganizationFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const deviceId = request.headers.get('x-device-id');
  
  if (!authHeader && !deviceId) {
    throw new Error('Authentication required');
  }

  let organizationId;

  if (deviceId) {
    // Mobile app authentication via device ID
    const { data: user } = await supabase
      .from('users')
      .select('organization_id')
      .eq('mobile_device_id', deviceId)
      .single();
    
    if (!user) throw new Error('Device not authorized');
    organizationId = user.organization_id;
  } else {
    // Web authentication via cookies or token
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

// GET /api/contacts - List contacts with networking data
export async function GET(request: NextRequest) {
  try {
    const organization = await getOrganizationFromRequest(request);
    const searchParams = request.nextUrl.searchParams;
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;
    
    const searchTerm = searchParams.get('search');
    const eventId = searchParams.get('event_id');
    const connectionStrength = searchParams.get('connection_strength');
    const tags = searchParams.get('tags')?.split(',');

    let query = supabase
      .from('contacts')
      .select(`
        *,
        first_met_at:events(id, name),
        recent_interactions:interactions(
          id, interaction_type, date, notes
        )
      `)
      .eq('organization_id', organization.id)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (searchTerm) {
      query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`);
    }

    if (eventId) {
      query = query.eq('first_met_at', eventId);
    }

    if (connectionStrength) {
      query = query.eq('connection_strength', connectionStrength);
    }

    if (tags && tags.length > 0) {
      query = query.overlaps('tags', tags);
    }

    const { data: contacts, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }

    return NextResponse.json({
      contacts,
      pagination: {
        page,
        limit,
        hasMore: contacts.length === limit
      }
    });

  } catch (error) {
    console.error('Contacts API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Create new contact
export async function POST(request: NextRequest) {
  try {
    const organization = await getOrganizationFromRequest(request);
    const contactData = await request.json();

    // Validate required fields
    if (!contactData.first_name && !contactData.last_name && !contactData.email) {
      return NextResponse.json(
        { error: 'At least one of first_name, last_name, or email is required' },
        { status: 400 }
      );
    }

    // Create contact in Supabase
    const { data: contact, error: dbError } = await supabase
      .from('contacts')
      .insert({
        organization_id: organization.id,
        ...contactData,
        hubspot_sync_needed: true,
        mobile_sync_needed: true,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
    }

    // Sync to HubSpot if tokens are available
    if (organization.hubspot_access_token) {
      try {
        const hubspotClient = new Client({ accessToken: organization.hubspot_access_token });
        
        const hubspotContact = {
          properties: {
            firstname: contactData.first_name,
            lastname: contactData.last_name,
            email: contactData.email,
            phone: contactData.phone,
            company: contactData.company,
            jobtitle: contactData.job_title,
            // All My Circles custom networking properties
            amc_connection_strength: contactData.connection_strength,
            amc_contact_value: contactData.contact_value,
            amc_first_met_location: contactData.first_met_location,
            amc_first_met_date: contactData.first_met_date,
            amc_networking_tags: contactData.tags?.join(', '),
            amc_networking_notes: contactData.notes,
            amc_last_interaction_date: contactData.last_interaction_date,
            amc_next_followup_date: contactData.next_followup_date,
            amc_total_interactions: contactData.total_interactions?.toString(),
            amc_contact_id: contact.id,
          }
        };

        const hubspotResponse = await hubspotClient.crm.contacts.basicApi.create(hubspotContact);
        
        // Update contact with HubSpot ID
        await supabase
          .from('contacts')
          .update({
            hubspot_contact_id: parseInt(hubspotResponse.id),
            hubspot_sync_needed: false,
            last_synced_at: new Date().toISOString(),
          })
          .eq('id', contact.id);

        contact.hubspot_contact_id = parseInt(hubspotResponse.id);

      } catch (hubspotError) {
        console.error('HubSpot sync error:', hubspotError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json(contact, { status: 201 });

  } catch (error) {
    console.error('Create contact error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}