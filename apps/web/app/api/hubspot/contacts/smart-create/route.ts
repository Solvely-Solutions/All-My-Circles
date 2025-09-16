import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse, createErrorResponse, supabase } from '../../../../../lib/api-utils';

// Smart HubSpot contact creation with ownership logic
export async function POST(request: NextRequest) {
  try {
    const contactData = await request.json();
    const deviceId = request.headers.get('x-device-id');

    if (!deviceId) {
      return createErrorResponse('Device ID required', 401);
    }

    // Get user information and HubSpot user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        hubspot_user_id,
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
    const portalId = userData.crm_connections[0].portal_id;

    // Get HubSpot user ID if not stored
    let hubspotUserId = userData.hubspot_user_id;
    if (!hubspotUserId) {
      try {
        console.log('Getting HubSpot user info for owner assignment...');

        // First get the token info to get the user email
        const tokenInfoResponse = await fetch('https://api.hubapi.com/oauth/v1/access-tokens/' + hubspotToken);

        if (tokenInfoResponse.ok) {
          const tokenInfo = await tokenInfoResponse.json();
          console.log('Token info:', tokenInfo);

          // Now get the actual HubSpot users to find the matching user
          const usersResponse = await fetch('https://api.hubapi.com/crm/v3/owners/', {
            headers: {
              'Authorization': `Bearer ${hubspotToken}`,
            },
          });

          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            console.log('HubSpot users found:', usersData.results?.length || 0);

            // Find the current user by email or user_id
            const currentUser = usersData.results?.find((user: any) =>
              user.email === tokenInfo.user ||
              user.userId === tokenInfo.user_id ||
              user.id === tokenInfo.user_id
            );

            if (currentUser) {
              hubspotUserId = currentUser.id;
              console.log('Found matching HubSpot user:', currentUser);

              // Store for future use
              await supabase
                .from('users')
                .update({ hubspot_user_id: hubspotUserId })
                .eq('id', userData.id);

              console.log('Retrieved and stored HubSpot user ID:', hubspotUserId);
            } else {
              console.warn('Could not find matching HubSpot user, will skip owner assignment');
              console.log('Available users:', usersData.results?.map((u: any) => ({ id: u.id, email: u.email, userId: u.userId })));
            }
          } else {
            const errorText = await usersResponse.text();
            console.warn('Could not retrieve HubSpot users list:', usersResponse.status, errorText);
          }
        } else {
          console.warn('Could not retrieve token info');
        }
      } catch (userInfoError) {
        console.warn('Failed to get HubSpot user info:', userInfoError);
      }
    }

    // Step 1: Check if contact already exists by email
    let existingContact = null;
    if (contactData.email) {
      try {
        const searchResponse = await fetch(
          `https://api.hubapi.com/crm/v3/objects/contacts/search`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${hubspotToken}`,
            },
            body: JSON.stringify({
              filterGroups: [{
                filters: [{
                  propertyName: 'email',
                  operator: 'EQ',
                  value: contactData.email.toLowerCase()
                }]
              }],
              properties: ['id', 'email', 'hubspot_owner_id', 'firstname', 'lastname'],
              limit: 1
            }),
          }
        );

        if (searchResponse.ok) {
          const searchResult = await searchResponse.json();
          if (searchResult.results && searchResult.results.length > 0) {
            existingContact = searchResult.results[0];
            console.log('Found existing contact:', existingContact.id);
          }
        }
      } catch (searchError) {
        console.warn('Contact search failed:', searchError);
      }
    }

    // Step 2: Handle existing vs new contact
    if (existingContact) {
      // Contact exists - check ownership
      const hasOwner = existingContact.properties.hubspot_owner_id;

      if (hasOwner) {
        // Contact has owner - add networking note instead of changing ownership
        console.log('Contact has owner, adding networking note');

        const networkingNote = `Additional networking contact made by ${userData.first_name} ${userData.last_name} (${userData.email})`;
        const noteDetails = [];

        if (contactData.firstMetLocation) noteDetails.push(`Location: ${contactData.firstMetLocation}`);
        if (contactData.firstMetDate) noteDetails.push(`Date: ${contactData.firstMetDate}`);
        if (contactData.notes) noteDetails.push(`Notes: ${contactData.notes}`);
        if (contactData.tags) noteDetails.push(`Tags: ${Array.isArray(contactData.tags) ? contactData.tags.join(', ') : contactData.tags}`);

        const fullNote = noteDetails.length > 0
          ? `${networkingNote}\n\n${noteDetails.join('\n')}`
          : networkingNote;

        // Add engagement/note
        try {
          await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${hubspotToken}`,
            },
            body: JSON.stringify({
              properties: {
                hs_note_body: fullNote,
                hs_timestamp: new Date().toISOString(),
                hubspot_owner_id: hasOwner
              },
              associations: [{
                to: { id: existingContact.id },
                types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }]
              }]
            }),
          });
        } catch (noteError) {
          console.warn('Failed to add networking note:', noteError);
        }

        return createApiResponse({
          contactId: existingContact.id,
          action: 'note_added',
          message: 'Contact already exists with owner. Networking information added as note.',
          existingOwner: hasOwner
        });
      } else {
        // Contact exists but no owner - claim it and update properties
        console.log('Contact exists but no owner, claiming and updating');

        const updateData: any = {
          firstname: contactData.name?.split(' ')[0] || undefined,
          lastname: contactData.name?.split(' ').slice(1).join(' ') || undefined,
          email: contactData.email || undefined,
          phone: contactData.phone || undefined,
          company: contactData.company || undefined,
          jobtitle: contactData.title || undefined,
          amc_first_met_location: contactData.firstMetLocation || undefined,
          amc_first_met_date: contactData.firstMetDate || undefined,
          amc_networking_tags: Array.isArray(contactData.tags) ? contactData.tags.join(', ') : contactData.tags,
          amc_networking_notes: contactData.notes || undefined,
        };

        // Only set owner if we have the HubSpot user ID
        if (hubspotUserId) {
          updateData.hubspot_owner_id = hubspotUserId;
        }

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
          if (updateData[key as keyof typeof updateData] === undefined) {
            delete updateData[key as keyof typeof updateData];
          }
        });

        const updateResponse = await fetch(
          `https://api.hubapi.com/crm/v3/objects/contacts/${existingContact.id}`,
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
          return createErrorResponse(`Failed to update contact: ${updateError.message}`, updateResponse.status);
        }

        const updatedContact = await updateResponse.json();
        return createApiResponse({
          contactId: updatedContact.id,
          action: 'claimed_and_updated',
          message: 'Existing unassigned contact claimed and updated with networking data.',
          contact: updatedContact
        });
      }
    } else {
      // Step 3: Create new contact with user as owner
      console.log('Creating new contact with user as owner');

      const newContactData = {
        firstname: contactData.name?.split(' ')[0] || contactData.firstName,
        lastname: contactData.name?.split(' ').slice(1).join(' ') || contactData.lastName,
        email: contactData.email || undefined,
        phone: contactData.phone || undefined,
        company: contactData.company || undefined,
        jobtitle: contactData.title || undefined,
        hubspot_owner_id: hubspotUserId, // Set HubSpot user as owner
        amc_first_met_location: contactData.firstMetLocation || undefined,
        amc_first_met_date: contactData.firstMetDate || undefined,
        amc_networking_tags: Array.isArray(contactData.tags) ? contactData.tags.join(', ') : contactData.tags,
        amc_networking_notes: contactData.notes || undefined,
      };

      // Remove undefined values
      Object.keys(newContactData).forEach(key => {
        if (newContactData[key as keyof typeof newContactData] === undefined) {
          delete newContactData[key as keyof typeof newContactData];
        }
      });

      const createResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${hubspotToken}`,
        },
        body: JSON.stringify({ properties: newContactData }),
      });

      if (!createResponse.ok) {
        const createError = await createResponse.json();
        return createErrorResponse(`Failed to create contact: ${createError.message}`, createResponse.status);
      }

      const newContact = await createResponse.json();
      return createApiResponse({
        contactId: newContact.id,
        action: 'created',
        message: 'New contact created with user as owner.',
        contact: newContact
      });
    }

  } catch (error) {
    console.error('Smart contact creation error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Smart contact creation failed',
      500
    );
  }
}