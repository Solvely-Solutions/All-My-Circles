import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse, createErrorResponse, supabase } from '../../../../lib/api-utils';
import { Client } from '@hubspot/api-client';

// POST /api/hubspot/webhooks - Handle HubSpot webhook notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate webhook signature (HubSpot sends this for security)
    const signature = request.headers.get('x-hubspot-signature-v3');
    const timestamp = request.headers.get('x-hubspot-request-timestamp');

    // TODO: Implement proper webhook signature validation
    // For now, we'll log the webhook data for debugging
    console.log('HubSpot webhook received:', {
      signature,
      timestamp,
      body: JSON.stringify(body, null, 2)
    });

    // Process each event in the webhook
    for (const event of body) {
      try {
        await processWebhookEvent(event);
      } catch (eventError) {
        console.error('Failed to process webhook event:', event, eventError);
        // Continue processing other events even if one fails
      }
    }

    return createApiResponse({
      message: 'Webhook processed successfully',
      eventsProcessed: body.length
    });

  } catch (error) {
    console.error('HubSpot webhook processing error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to process webhook',
      500
    );
  }
}

async function processWebhookEvent(event: any) {
  const { subscriptionType, objectType, objectId, portalId, changeFlag, propertyName, propertyValue } = event;

  console.log('Processing webhook event:', { subscriptionType, objectType, objectId, portalId, propertyName });

  // We're primarily interested in contact events
  if (objectType !== 'contact') {
    console.log('Ignoring non-contact event:', objectType);
    return;
  }

  // Handle different subscription types (new format)
  switch (subscriptionType) {
    case 'object.propertyChange':
      await handleContactPropertyChange(event);
      break;
    case 'object.creation':
      await handleContactCreation(event);
      break;
    case 'object.deletion':
      await handleContactDeletion(event);
      break;
    default:
      console.log('Unhandled subscription type:', subscriptionType);
  }
}

async function handleContactPropertyChange(event: any) {
  const { objectId, portalId, propertyName, propertyValue } = event;

  console.log('📝 Contact property changed:', { objectId, propertyName, propertyValue });

  // Process both AMC properties and standard HubSpot properties for bi-directional sync
  const importantProperties = [
    'firstname', 'lastname', 'email', 'phone', 'company', 'jobtitle',
    'amc_first_met_location', 'amc_first_met_date', 'amc_networking_tags', 'amc_networking_notes'
  ];

  if (!importantProperties.includes(propertyName)) {
    console.log('ℹ️  Ignoring property change:', propertyName);
    return;
  }

  try {
    // Find all users connected to this HubSpot portal
    const { data: connections, error: connectionError } = await supabase
      .from('crm_connections')
      .select(`
        user_id,
        portal_id,
        access_token,
        users!inner(mobile_device_id, email)
      `)
      .eq('provider', 'hubspot')
      .eq('portal_id', portalId.toString())
      .eq('is_active', true);

    if (connectionError || !connections?.length) {
      console.warn('❌ No active HubSpot connections found for portal:', portalId);
      return;
    }

    console.log(`✅ Found ${connections.length} connected users for portal ${portalId}`);

    // For each connected user, update the contact directly in the contacts table
    for (const connection of connections) {
      await updateContactDirectly(connection, objectId.toString(), propertyName, propertyValue);
    }

  } catch (error) {
    console.error('❌ Failed to handle contact property change:', error);
    throw error;
  }
}

async function updateContactDirectly(connection: any, hubspotContactId: string, propertyName: string, propertyValue: any) {
  try {
    console.log(`🔄 Updating contact directly for user ${connection.users.email}`);

    // Find the contact in the contacts table
    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', connection.user_id)
      .eq('hubspot_contact_id', hubspotContactId);

    if (contactError) {
      console.error('❌ Error finding contact:', contactError);
      return;
    }

    if (!contacts || contacts.length === 0) {
      console.log('ℹ️  Contact not found locally:', hubspotContactId);
      return;
    }

    const contact = contacts[0];

    // Map HubSpot properties to contact table fields
    const propertyMapping: { [key: string]: string } = {
      'firstname': 'first_name',
      'lastname': 'last_name',
      'email': 'email',
      'phone': 'phone',
      'company': 'company',
      'jobtitle': 'job_title',
      'amc_first_met_location': 'first_met_location',
      'amc_first_met_date': 'first_met_date',
      'amc_networking_tags': 'tags',
      'amc_networking_notes': 'notes',
    };

    const dbField = propertyMapping[propertyName];
    if (!dbField) {
      console.log('ℹ️  No database field mapping for:', propertyName);
      return;
    }

    // Process the value
    let processedValue = propertyValue;
    if (propertyName === 'amc_networking_tags' && typeof propertyValue === 'string') {
      // Convert comma-separated string to array
      processedValue = propertyValue.split(',').map((tag: string) => tag.trim()).filter(Boolean);
    }

    // Update the contact
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        [dbField]: processedValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', contact.id);

    if (updateError) {
      console.error('❌ Failed to update contact:', updateError);
      return;
    }

    console.log(`✅ Updated contact ${contact.first_name} ${contact.last_name}: ${dbField} = ${JSON.stringify(processedValue)}`);

  } catch (error) {
    console.error('❌ Failed to update contact directly:', error);
  }
}

async function handleContactCreation(event: any) {
  const { objectId, portalId } = event;

  console.log('New contact created in HubSpot:', { objectId, portalId });

  try {
    // Find the organization for this portal
    const { data: organization } = await supabase
      .from('organizations')
      .select('*')
      .eq('hubspot_portal_id', portalId.toString())
      .single();

    if (!organization || !organization.hubspot_access_token) {
      console.warn('Organization not found or no access token for portal:', portalId);
      return;
    }

    // Fetch the contact details from HubSpot
    const hubspotClient = new Client({ accessToken: organization.hubspot_access_token });

    const hubspotContact = await hubspotClient.crm.contacts.basicApi.getById(
      objectId.toString(),
      [
        'firstname', 'lastname', 'email', 'phone', 'company', 'jobtitle',
        'amc_connection_strength', 'amc_contact_value', 'amc_first_met_location',
        'amc_first_met_date', 'amc_networking_tags', 'amc_networking_notes',
        'amc_last_interaction_date', 'amc_next_followup_date', 'amc_total_interactions',
        'amc_contact_id'
      ]
    );

    const props = hubspotContact.properties;

    // Check if this contact already exists in our database
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', organization.id)
      .eq('hubspot_contact_id', objectId.toString())
      .single();

    if (existingContact) {
      console.log('Contact already exists in database, skipping creation');
      return;
    }

    // Only create the contact if it has All My Circles data (amc_contact_id or custom properties)
    const hasAmcData = props.amc_contact_id || props.amc_connection_strength || props.amc_first_met_location;

    if (!hasAmcData) {
      console.log('Contact has no All My Circles data, skipping import');
      return;
    }

    // Create the contact in our database
    const { error: createError } = await supabase
      .from('contacts')
      .insert({
        organization_id: organization.id,
        first_name: props.firstname || '',
        last_name: props.lastname || '',
        email: props.email || null,
        phone: props.phone || null,
        company: props.company || null,
        job_title: props.jobtitle || null,
        notes: props.amc_networking_notes || null,
        connection_strength: props.amc_connection_strength || null,
        contact_value: props.amc_contact_value || null,
        first_met_location: props.amc_first_met_location || null,
        first_met_date: props.amc_first_met_date || null,
        last_interaction_date: props.amc_last_interaction_date || null,
        next_followup_date: props.amc_next_followup_date || null,
        total_interactions: parseInt(props.amc_total_interactions || '0'),
        tags: props.amc_networking_tags ? props.amc_networking_tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [],
        hubspot_contact_id: objectId.toString(),
      });

    if (createError) {
      throw createError;
    }

    console.log('Contact created successfully from HubSpot webhook:', objectId);

  } catch (error) {
    console.error('Failed to handle contact creation:', error);
    throw error;
  }
}

async function handleContactDeletion(event: any) {
  const { objectId, portalId } = event;

  console.log('Contact deleted in HubSpot:', { objectId, portalId });

  try {
    // Find the organization for this portal
    const { data: organization } = await supabase
      .from('organizations')
      .select('*')
      .eq('hubspot_portal_id', portalId.toString())
      .single();

    if (!organization) {
      console.warn('Organization not found for portal:', portalId);
      return;
    }

    // Find and soft-delete the contact in our database
    const { error: deleteError } = await supabase
      .from('contacts')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', organization.id)
      .eq('hubspot_contact_id', objectId.toString());

    if (deleteError) {
      throw deleteError;
    }

    console.log('Contact soft-deleted successfully:', objectId);

  } catch (error) {
    console.error('Failed to handle contact deletion:', error);
    throw error;
  }
}

// GET /api/hubspot/webhooks - Webhook verification endpoint (required by HubSpot)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');

  if (challenge) {
    // HubSpot webhook verification
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  return createApiResponse({
    message: 'HubSpot webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}