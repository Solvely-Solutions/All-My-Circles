import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
      console.error('HubSpot token exchange failed:', errorData);
      return NextResponse.json(
        { error: 'Failed to exchange authorization code' },
        { status: 400 }
      );
    }

    const tokens = await tokenResponse.json();

    // Get account info to get portal ID
    const accountResponse = await fetch('https://api.hubapi.com/account-info/v3/api-usage/daily', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    let portalId = 'unknown';
    if (accountResponse.ok) {
      const accountData = await accountResponse.json();
      portalId = accountData.portalId?.toString() || 'unknown';
    }

    // Find user by deviceId
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, organizationId')
      .eq('mobile_device_id', deviceId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Store the connection in Supabase
    const { error: insertError } = await supabase
      .from('crm_connections')
      .upsert({
        user_id: userData.id,
        organization_id: userData.organizationId,
        provider: 'hubspot',
        portal_id: portalId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        is_active: true,
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