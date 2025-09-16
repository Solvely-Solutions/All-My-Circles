import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse, createErrorResponse, supabase } from '../../../../../lib/api-utils';

// Helper function to refresh HubSpot access token
async function refreshHubSpotToken(userId: string): Promise<string | null> {
  try {
    console.log('🔄 Refreshing HubSpot token for user:', userId);

    // Get the refresh token
    const { data: connection, error } = await supabase
      .from('crm_connections')
      .select('refresh_token, access_token')
      .eq('user_id', userId)
      .eq('provider', 'hubspot')
      .eq('is_active', true)
      .single();

    if (error || !connection?.refresh_token) {
      console.error('No refresh token found:', error);
      return null;
    }

    // Refresh the token
    const refreshResponse = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.HUBSPOT_CLIENT_ID!,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
        refresh_token: connection.refresh_token,
      }),
    });

    if (!refreshResponse.ok) {
      console.error('Token refresh failed:', await refreshResponse.text());
      return null;
    }

    const tokens = await refreshResponse.json();

    // Update the token in the database
    await supabase
      .from('crm_connections')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('provider', 'hubspot');

    console.log('✅ HubSpot token refreshed successfully');
    return tokens.access_token;

  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

// Helper function to make HubSpot API calls with automatic token refresh
async function makeHubSpotApiCall(
  url: string,
  options: RequestInit,
  token: string,
  userId: string
): Promise<Response> {
  // Add authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  const response = await fetch(url, { ...options, headers });

  // If unauthorized, try refreshing the token and retry
  if (response.status === 401) {
    console.log('🔑 Access token expired, refreshing...');
    const newToken = await refreshHubSpotToken(userId);

    if (newToken) {
      console.log('🔄 Retrying API call with refreshed token...');
      const retryHeaders = {
        ...options.headers,
        'Authorization': `Bearer ${newToken}`,
      };
      return fetch(url, { ...options, headers: retryHeaders });
    }
  }

  return response;
}

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
        const tokenInfoResponse = await makeHubSpotApiCall(
          'https://api.hubapi.com/oauth/v1/access-tokens/' + hubspotToken,
          { method: 'GET' },
          hubspotToken,
          userData.id
        );

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

      // Always update the contact with any new information, regardless of ownership
      console.log('Contact exists, updating with new information');

      const updateData: any = {
        // Standard properties - only update if we have new data
        firstname: contactData.name?.split(' ')[0] || existingContact.properties.firstname,
        lastname: contactData.name?.split(' ').slice(1).join(' ') || existingContact.properties.lastname,
        email: contactData.email || existingContact.properties.email,
        phone: contactData.phone || existingContact.properties.phone,
        company: contactData.company || existingContact.properties.company,
        jobtitle: contactData.title || existingContact.properties.jobtitle,

        // Always update All My Circles properties with latest data
        amc_first_met_location: contactData.firstMetLocation || undefined,
        amc_first_met_date: contactData.firstMetDate || undefined,
        amc_networking_tags: Array.isArray(contactData.tags) ? contactData.tags.join(', ') : contactData.tags,
        amc_networking_notes: contactData.notes || undefined,
      };

      // If no current owner and we have a HubSpot user ID, set ownership
      if (!hasOwner && hubspotUserId) {
        updateData.hubspot_owner_id = hubspotUserId;
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      const updateResponse = await makeHubSpotApiCall(
        `https://api.hubapi.com/crm/v3/objects/contacts/${existingContact.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ properties: updateData }),
        },
        hubspotToken,
        userData.id
      );

      if (!updateResponse.ok) {
        const updateError = await updateResponse.json();
        return createErrorResponse(`Failed to update contact: ${updateError.message}`, updateResponse.status);
      }

      const updatedContact = await updateResponse.json();

      const actionType = !hasOwner && hubspotUserId ? 'claimed_and_updated' : 'updated';
      const message = !hasOwner && hubspotUserId
        ? 'Existing unassigned contact claimed and updated with latest information.'
        : 'Existing contact updated with latest information.';

      return createApiResponse({
        contactId: updatedContact.id,
        action: actionType,
        message: message,
        contact: updatedContact
      });
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

      const createResponse = await makeHubSpotApiCall(
        'https://api.hubapi.com/crm/v3/objects/contacts',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ properties: newContactData }),
        },
        hubspotToken,
        userData.id
      );

      if (!createResponse.ok) {
        const createError = await createResponse.json();

        // Check if this is a "contact already exists" error
        if (createError.message && createError.message.includes('already exists')) {
          console.log('Contact creation failed due to duplicate, attempting to find and update existing contact');

          // Try to find the existing contact by email again (maybe case sensitivity issue)
          if (contactData.email) {
            try {
              const fallbackSearchResponse = await makeHubSpotApiCall(
                `https://api.hubapi.com/crm/v3/objects/contacts/search`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    filterGroups: [{
                      filters: [{
                        propertyName: 'email',
                        operator: 'EQ',
                        value: contactData.email // Try exact case this time
                      }]
                    }],
                    properties: ['id', 'email', 'hubspot_owner_id', 'firstname', 'lastname'],
                    limit: 1
                  }),
                },
                hubspotToken,
                userData.id
              );

              if (fallbackSearchResponse.ok) {
                const fallbackResult = await fallbackSearchResponse.json();
                if (fallbackResult.results && fallbackResult.results.length > 0) {
                  const foundContact = fallbackResult.results[0];
                  console.log('Found existing contact on fallback search:', foundContact.id);

                  return createApiResponse({
                    contactId: foundContact.id,
                    action: 'found_existing',
                    message: 'Contact already exists in HubSpot.',
                    contact: foundContact
                  });
                }
              }
            } catch (fallbackError) {
              console.warn('Fallback search failed:', fallbackError);
            }
          }
        }

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