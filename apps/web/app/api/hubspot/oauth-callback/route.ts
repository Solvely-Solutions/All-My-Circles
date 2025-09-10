import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@hubspot/api-client';
import { supabase } from '../../../../lib/api-utils';

const hubspotClient = new Client({ accessToken: '' });

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.json(
      { error: 'Authorization code not provided' },
      { status: 400 }
    );
  }

  try {
    // Exchange code for tokens
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
        code: code,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('HubSpot OAuth error:', tokens);
      return NextResponse.json(
        { error: 'Failed to exchange code for tokens', details: tokens },
        { status: 400 }
      );
    }

    // Get portal info
    const hubspotClientWithToken = new Client({ accessToken: tokens.access_token });
    const accountInfo = await hubspotClientWithToken.oauth.accessTokensApi.get(tokens.access_token);

    // Store organization and tokens in Supabase
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .upsert(
        {
          hubspot_portal_id: accountInfo.hubId,
          name: accountInfo.hubDomain || `HubSpot Portal ${accountInfo.hubId}`,
          hubspot_access_token: tokens.access_token,
          hubspot_refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          app_installation_id: accountInfo.appId?.toString(),
        },
        { onConflict: 'hubspot_portal_id' }
      )
      .select()
      .single();

    if (orgError) {
      console.error('Database error:', orgError);
      return NextResponse.json(
        { error: 'Failed to store organization data' },
        { status: 500 }
      );
    }

    // Parse state to get mobile device info if present
    let deviceId = null;
    let redirectUrl = '/dashboard';

    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        deviceId = stateData.deviceId;
        redirectUrl = stateData.redirectUrl || redirectUrl;
      } catch (e) {
        console.log('Could not parse state parameter');
      }
    }

    // If mobile device ID is present, create/update user record
    if (deviceId) {
      const { error: userError } = await supabase
        .from('users')
        .upsert(
          {
            organization_id: organization.id,
            email: accountInfo.user || 'unknown@hubspot.com',
            mobile_device_id: deviceId,
            hubspot_user_id: accountInfo.userId,
          },
          { onConflict: 'organization_id,email' }
        );

      if (userError) {
        console.error('User creation error:', userError);
      }
    }

    // Success redirect
    const response = NextResponse.redirect(new URL(redirectUrl, request.url));
    
    // Set secure cookies for web authentication
    response.cookies.set('hubspot_portal_id', accountInfo.hubId.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    response.cookies.set('organization_id', organization.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      { error: 'Internal server error during OAuth callback' },
      { status: 500 }
    );
  }
}