import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse, createErrorResponse, supabase } from '../../../../../lib/api-utils';

// Update existing HubSpot contact with new data from mobile app
export async function PATCH(request: NextRequest) {
  try {
    const { contactId, contactData } = await request.json();
    const deviceId = request.headers.get('x-device-id');

    if (!deviceId) {
      return createErrorResponse('Device ID required', 401);
    }

    if (!contactId) {
      return createErrorResponse('Contact ID required', 400);
    }

    // Get user's HubSpot connection
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        crm_connections!inner(access_token, portal_id)
      `)
      .eq('mobile_device_id', deviceId)
      .eq('crm_connections.provider', 'hubspot')
      .eq('crm_connections.is_active', true)
      .single();

    if (userError || !userData) {
      return createErrorResponse('User or HubSpot connection not found', 404);
    }

    const hubspotToken = userData.crm_connections[0].access_token;

    // Prepare update data with only the 4 essential properties
    const updateData: any = {};

    // Standard HubSpot properties
    if (contactData.name) {
      updateData.firstname = contactData.name.split(' ')[0];
      updateData.lastname = contactData.name.split(' ').slice(1).join(' ');
    }
    if (contactData.firstName) updateData.firstname = contactData.firstName;
    if (contactData.lastName) updateData.lastname = contactData.lastName;
    if (contactData.email) updateData.email = contactData.email;
    if (contactData.phone) updateData.phone = contactData.phone;
    if (contactData.company) updateData.company = contactData.company;
    if (contactData.title) updateData.jobtitle = contactData.title;

    // All My Circles networking properties
    if (contactData.firstMetLocation) updateData.amc_first_met_location = contactData.firstMetLocation;
    if (contactData.firstMetDate) updateData.amc_first_met_date = contactData.firstMetDate;
    if (contactData.tags) {
      updateData.amc_networking_tags = Array.isArray(contactData.tags)
        ? contactData.tags.join(', ')
        : contactData.tags;
    }
    if (contactData.notes) updateData.amc_networking_notes = contactData.notes;

    // Only send properties that have values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === null || updateData[key] === '') {
        delete updateData[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return createApiResponse({
        contactId,
        message: 'No updates needed - all fields empty or unchanged',
        updated: false
      });
    }

    console.log(`Updating HubSpot contact ${contactId} with data:`, updateData);

    // Update the contact in HubSpot
    const updateResponse = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${hubspotToken}`,
        },
        body: JSON.stringify({ properties: updateData }),
      }
    );

    if (!updateResponse.ok) {
      const updateError = await updateResponse.json();
      console.error('HubSpot contact update failed:', updateError);
      return createErrorResponse(
        `Failed to update contact: ${updateError.message}`,
        updateResponse.status
      );
    }

    const updatedContact = await updateResponse.json();

    // Add a timeline note about the update
    try {
      const updateNote = `Contact updated from All My Circles app by ${userData.first_name} ${userData.last_name} (${userData.email})`;
      const updatedFields = Object.keys(updateData);
      const noteBody = `${updateNote}\n\nUpdated fields: ${updatedFields.join(', ')}`;

      await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${hubspotToken}`,
        },
        body: JSON.stringify({
          properties: {
            hs_note_body: noteBody,
            hs_timestamp: new Date().toISOString(),
          },
          associations: [{
            to: { id: contactId },
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }]
          }]
        }),
      });
    } catch (noteError) {
      console.warn('Failed to add update note:', noteError);
    }

    console.log(`Successfully updated HubSpot contact ${contactId}`);

    return createApiResponse({
      contactId,
      message: 'Contact updated successfully',
      updated: true,
      updatedFields: Object.keys(updateData),
      contact: updatedContact
    });

  } catch (error) {
    console.error('Contact update error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Contact update failed',
      500
    );
  }
}

// Get contact details for sync verification
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const contactId = url.searchParams.get('contactId');
    const deviceId = request.headers.get('x-device-id');

    if (!deviceId) {
      return createErrorResponse('Device ID required', 401);
    }

    if (!contactId) {
      return createErrorResponse('Contact ID required', 400);
    }

    // Get user's HubSpot connection
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        crm_connections!inner(access_token)
      `)
      .eq('mobile_device_id', deviceId)
      .eq('crm_connections.provider', 'hubspot')
      .eq('crm_connections.is_active', true)
      .single();

    if (userError || !userData) {
      return createErrorResponse('User or HubSpot connection not found', 404);
    }

    const hubspotToken = userData.crm_connections[0].access_token;

    // Get contact from HubSpot
    const contactResponse = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=firstname,lastname,email,phone,company,jobtitle,amc_first_met_location,amc_first_met_date,amc_networking_tags,amc_networking_notes,hubspot_owner_id`,
      {
        headers: {
          'Authorization': `Bearer ${hubspotToken}`,
        },
      }
    );

    if (!contactResponse.ok) {
      const contactError = await contactResponse.json();
      return createErrorResponse(
        `Failed to get contact: ${contactError.message}`,
        contactResponse.status
      );
    }

    const contact = await contactResponse.json();

    return createApiResponse({
      contactId,
      contact: contact.properties,
      lastModified: contact.updatedAt
    });

  } catch (error) {
    console.error('Contact get error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to get contact',
      500
    );
  }
}