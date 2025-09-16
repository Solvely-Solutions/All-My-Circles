import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { code, state, deviceId } = await request.json();

    if (!code || !state || !deviceId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify state parameter
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      if (stateData.deviceId !== deviceId) {
        throw new Error('Device ID mismatch');
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.HUBSPOT_CLIENT_ID!,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
        redirect_uri: process.env.HUBSPOT_REDIRECT_URI!,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('HubSpot token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData,
        deviceId,
        timestamp: new Date().toISOString()
      });

      // Parse error response to provide more specific error messages
      let errorMessage = 'Failed to exchange authorization code';
      try {
        const parsedError = JSON.parse(errorData);
        if (parsedError.error === 'invalid_grant') {
          errorMessage = 'Authorization code has expired or is invalid. Please try again.';
        } else if (parsedError.error === 'invalid_client') {
          errorMessage = 'Invalid client configuration. Please contact support.';
        } else if (parsedError.error_description) {
          errorMessage = parsedError.error_description;
        }
      } catch (parseError) {
        // Use default error message if parsing fails
      }

      return NextResponse.json(
        {
          error: errorMessage,
          code: 'TOKEN_EXCHANGE_FAILED',
          details: process.env.NODE_ENV === 'development' ? errorData : undefined
        },
        { status: 400 }
      );
    }

    const tokens = await tokenResponse.json();

    // Validate that we received the expected scopes
    const requiredScopes = [
      'crm.objects.contacts.read',
      'crm.objects.contacts.write',
      'crm.objects.companies.read',
      'crm.objects.companies.write',
      'crm.objects.deals.read',
      'crm.objects.deals.write',
      'crm.schemas.custom.read',
      'crm.schemas.custom.write',
      'integration-sync'
    ];

    const grantedScopes = tokens.scope ? tokens.scope.split(' ') : [];
    const missingScopes = requiredScopes.filter(scope => !grantedScopes.includes(scope));

    if (missingScopes.length > 0) {
      console.warn('Missing required scopes:', missingScopes);
      // Continue but log the warning - some scopes might be optional depending on use case
    }

    // Get portal ID from multiple sources for reliability
    let portalId = 'unknown';

    // First try: Get from token response (hub_id)
    if (tokens.hub_id) {
      portalId = tokens.hub_id.toString();
    } else {
      // Second try: Use account info API
      try {
        const accountResponse = await fetch('https://api.hubapi.com/account-info/v3/details', {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
          },
        });

        if (accountResponse.ok) {
          const accountData = await accountResponse.json();
          portalId = accountData.portalId?.toString() || accountData.hubId?.toString() || 'unknown';
        }
      } catch (accountError) {
        console.warn('Failed to retrieve portal ID from account API:', accountError);

        // Third try: Use integrations API as fallback
        try {
          const integrationsResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
            headers: {
              'Authorization': `Bearer ${tokens.access_token}`,
            },
          });

          if (integrationsResponse.ok) {
            // Extract portal ID from response headers or URL patterns if available
            const responseText = await integrationsResponse.text();
            const portalMatch = responseText.match(/"portalId":\s*(\d+)/);
            if (portalMatch) {
              portalId = portalMatch[1];
            }
          }
        } catch (integrationsError) {
          console.warn('Failed to retrieve portal ID from integrations API:', integrationsError);
        }
      }
    }

    console.log('Retrieved portal ID:', portalId);

    // Find user by deviceId with debugging
    console.log('OAuth exchange called with deviceId:', deviceId);

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, organization_id, mobile_device_id, email')
      .eq('mobile_device_id', deviceId)
      .limit(1)
      .maybeSingle();

    console.log('User lookup result:', { userData, userError });

    if (userError || !userData) {
      // Try to find any users with device IDs for debugging
      const { data: allUsers } = await supabase
        .from('users')
        .select('id, mobile_device_id, email')
        .not('mobile_device_id', 'is', null)
        .limit(5);

      console.log('Available users with device IDs:', allUsers);

      return NextResponse.json(
        { error: 'User not found', debug: { deviceId, userError, availableDeviceIds: allUsers?.map(u => ({ id: u.id, deviceId: u.mobile_device_id, email: u.email })) } },
        { status: 404 }
      );
    }

    // Store the connection in Supabase
    const { error: insertError } = await supabase
      .from('crm_connections')
      .upsert({
        user_id: userData.id,
        organization_id: userData.organization_id,
        provider: 'hubspot',
        portal_id: portalId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        scopes: grantedScopes,
        is_active: true,
        connection_name: 'HubSpot OAuth Connection',
        metadata: {
          token_type: tokens.token_type || 'Bearer',
          granted_scopes: grantedScopes,
          missing_scopes: missingScopes,
          hub_domain: tokens.hub_domain,
          hub_id: tokens.hub_id
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider',
      });

    if (insertError) {
      console.error('Failed to store CRM connection:', insertError);
      return NextResponse.json(
        { error: 'Failed to store connection' },
        { status: 500 }
      );
    }

    console.log('Successfully stored CRM connection, now creating custom properties...');

    // Create custom properties directly via HubSpot API
    try {
      // First create the property group
      try {
        const groupResponse = await fetch('https://api.hubapi.com/crm/v3/properties/contacts/groups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokens.access_token}`,
          },
          body: JSON.stringify({
            name: 'allmycircles',
            label: 'All My Circles',
            displayOrder: -1
          }),
        });

        if (groupResponse.ok) {
          console.log('Property group "All My Circles" created successfully');
        } else {
          const groupError = await groupResponse.json();
          if (groupError.category === 'VALIDATION_ERROR' && groupError.message?.includes('already exists')) {
            console.log('Property group "All My Circles" already exists');
          } else {
            console.warn('Property group creation warning:', groupError);
          }
        }
      } catch (groupError) {
        console.warn('Property group creation error (non-fatal):', groupError);
      }

      // Create the essential properties
      const properties = [
        {
          name: 'amc_networking_notes',
          label: 'Networking Notes',
          description: 'Notes about networking interactions and relationship context',
          groupName: 'allmycircles',
          type: 'string',
          fieldType: 'textarea'
        },
        {
          name: 'amc_total_interactions',
          label: 'Total Interactions',
          description: 'Total number of interactions with this contact',
          groupName: 'allmycircles',
          type: 'number',
          fieldType: 'number'
        }
      ];

      let propertiesCreated = 0;
      for (const property of properties) {
        try {
          const propResponse = await fetch('https://api.hubapi.com/crm/v3/properties/contacts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tokens.access_token}`,
            },
            body: JSON.stringify(property),
          });

          if (propResponse.ok) {
            console.log(`✅ Property "${property.name}" created successfully`);
            propertiesCreated++;
          } else {
            const propError = await propResponse.json();
            if (propError.category === 'VALIDATION_ERROR' && propError.message?.includes('already exists')) {
              console.log(`✅ Property "${property.name}" already exists`);
              propertiesCreated++;
            } else {
              console.warn(`❌ Property "${property.name}" creation failed:`, propError);
            }
          }
        } catch (propError) {
          console.warn(`❌ Property "${property.name}" error:`, propError);
        }
      }

      console.log(`Custom properties setup complete: ${propertiesCreated}/${properties.length} properties ready`);
    } catch (propertiesError) {
      console.warn('Property creation failed (non-fatal):', propertiesError);
    }

    return NextResponse.json({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      portalId,
      message: 'HubSpot connection established successfully'
    });

  } catch (error) {
    console.error('OAuth exchange error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}