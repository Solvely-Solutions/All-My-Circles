import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { deviceId } = await request.json();

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }

    // Find user by deviceId with debugging
    console.log('Refresh endpoint called with deviceId:', deviceId);

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, organization_id, mobile_device_id')
      .eq('mobile_device_id', deviceId)
      .single();

    console.log('User lookup result:', { userData, userError });

    if (userError || !userData) {
      // Try to find any users with device IDs for debugging
      const { data: allUsers } = await supabase
        .from('users')
        .select('id, mobile_device_id')
        .not('mobile_device_id', 'is', null)
        .limit(5);

      console.log('Available users with device IDs:', allUsers);

      return NextResponse.json(
        { error: 'User not found', debug: { deviceId, userError, availableDeviceIds: allUsers?.map(u => u.mobile_device_id) } },
        { status: 404 }
      );
    }

    // Get HubSpot connection
    const { data: connectionData, error: connectionError } = await supabase
      .from('crm_connections')
      .select('refresh_token, expires_at')
      .eq('user_id', userData.id)
      .eq('provider', 'hubspot')
      .eq('is_active', true)
      .single();

    if (connectionError || !connectionData) {
      return NextResponse.json(
        { error: 'No active HubSpot connection found' },
        { status: 404 }
      );
    }

    if (!connectionData.refresh_token) {
      return NextResponse.json(
        { error: 'No refresh token available' },
        { status: 400 }
      );
    }

    // Check if token actually needs refreshing (expired or expires within next 5 minutes)
    const expiresAt = new Date(connectionData.expires_at);
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    const now = new Date();

    // Note: We'll force refresh anyway if requested since there might be a mismatch
    // between stored expiration and actual token expiration
    const shouldRefresh = expiresAt <= fiveMinutesFromNow;
    const forceRefresh = request.headers.get('x-force-refresh') === 'true';

    if (!shouldRefresh && !forceRefresh) {
      // For debugging, still validate the token even if we think it's valid
      try {
        const validateResponse = await fetch(`https://api.hubapi.com/oauth/v1/refresh-tokens/${connectionData.refresh_token}`);
        const validateData = await validateResponse.json();
        console.log('Token validation for "valid" token:', validateResponse.status, validateData);
      } catch (validateError) {
        console.log('Token validation error:', validateError);
      }

      return NextResponse.json({
        message: 'Token is still valid, no refresh needed',
        expiresAt: connectionData.expires_at,
        actualExpirationCheck: 'Use x-force-refresh header to force refresh'
      });
    }

    console.log('Token refresh needed:', {
      expiresAt: connectionData.expires_at,
      now: now.toISOString(),
      isExpired: expiresAt < now
    });

    // First, validate the refresh token
    try {
      const validateResponse = await fetch(`https://api.hubapi.com/oauth/v1/refresh-tokens/${connectionData.refresh_token}`);
      const validateData = await validateResponse.json();
      console.log('Refresh token validation:', validateResponse.status, validateData);
    } catch (validateError) {
      console.log('Refresh token validation failed:', validateError);
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
        refresh_token: connectionData.refresh_token,
      }),
    });

    if (!refreshResponse.ok) {
      const errorData = await refreshResponse.text();
      console.error('HubSpot token refresh failed:', {
        status: refreshResponse.status,
        statusText: refreshResponse.statusText,
        error: errorData
      });
      return NextResponse.json(
        {
          error: 'Failed to refresh token',
          details: errorData,
          status: refreshResponse.status
        },
        { status: 400 }
      );
    }

    const tokens = await refreshResponse.json();

    // Update the connection with new tokens
    const { error: updateError } = await supabase
      .from('crm_connections')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userData.id)
      .eq('provider', 'hubspot');

    if (updateError) {
      console.error('Failed to update connection:', updateError);
      return NextResponse.json(
        { error: 'Failed to update connection' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      accessToken: tokens.access_token,
      expiresIn: tokens.expires_in,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}