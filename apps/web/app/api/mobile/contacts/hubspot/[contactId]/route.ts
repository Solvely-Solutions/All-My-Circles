import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse, createErrorResponse, supabase } from '../../../../../../lib/api-utils';
import { Client } from '@hubspot/api-client';

// GET /api/mobile/contacts/hubspot/[contactId] - Fetch a specific contact from HubSpot
export async function GET(
  request: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const deviceId = request.headers.get('x-device-id');
    const { contactId } = params;

    if (!deviceId) {
      return createErrorResponse('Device ID required', 401);
    }

    if (!contactId) {
      return createErrorResponse('Contact ID required', 400);
    }

    console.log('📱 Fetching HubSpot contact for device:', deviceId, 'contactId:', contactId);

    // Get the user's HubSpot connection
    const { data: connections, error: connectionError } = await supabase
      .from('crm_connections')
      .select(`
        user_id,
        portal_id,
        access_token,
        users!inner(mobile_device_id, email)
      `)
      .eq('provider', 'hubspot')
      .eq('users.mobile_device_id', deviceId)
      .eq('is_active', true)
      .single();

    if (connectionError || !connections) {
      console.warn('❌ No active HubSpot connection found for device:', deviceId);
      return createErrorResponse('HubSpot connection not found', 404);
    }

    // Fetch the contact from HubSpot with error handling
    const hubspotClient = new Client({ accessToken: connections.access_token });

    let hubspotContact;
    try {
      hubspotContact = await hubspotClient.crm.contacts.basicApi.getById(
        contactId,
        [
          'firstname', 'lastname', 'email', 'phone', 'company', 'jobtitle', 'hs_linkedin_url',
          'amc_first_met_location', 'amc_first_met_date', 'amc_networking_tags', 'amc_networking_notes',
          'hs_lastmodifieddate'
        ]
      );
    } catch (hubspotError: any) {
      console.error('HubSpot API error:', {
        contactId,
        status: hubspotError.code || hubspotError.status,
        message: hubspotError.message,
        body: hubspotError.body
      });
      throw hubspotError;
    }

    const props = hubspotContact.properties;

    // Convert to mobile app format
    const contact = {
      hubspotContactId: contactId,
      firstName: props.firstname || '',
      lastName: props.lastname || '',
      email: props.email || null,
      phone: props.phone || null,
      company: props.company || null,
      title: props.jobtitle || null,
      linkedinUrl: props.hs_linkedin_url || null,
      firstMetLocation: props.amc_first_met_location || null,
      firstMetDate: props.amc_first_met_date || null,
      notes: props.amc_networking_notes || null,
      tags: props.amc_networking_tags ?
        props.amc_networking_tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) :
        [],
      updatedAt: props.hs_lastmodifieddate || new Date().toISOString(),
    };

    return createApiResponse({
      contact,
      message: 'Contact fetched successfully'
    });

  } catch (error) {
    console.error('❌ Failed to fetch HubSpot contact:', {
      contactId,
      deviceId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    // Handle HubSpot API errors
    if (error instanceof Error && error.message.includes('404')) {
      return createErrorResponse('Contact not found in HubSpot', 404);
    }

    // Handle token expiration
    if (error instanceof Error && (error.message.includes('401') || error.message.includes('EXPIRED_AUTHENTICATION'))) {
      return createErrorResponse('HubSpot token expired', 401);
    }

    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch contact',
      500
    );
  }
}