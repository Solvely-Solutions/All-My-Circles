import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }

    // Find user by deviceId
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('mobile_device_id', deviceId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ isAuthenticated: false });
    }

    // Check for active HubSpot connection
    const { data: connectionData, error: connectionError } = await supabase
      .from('crm_connections')
      .select('portal_id, is_active, expires_at')
      .eq('user_id', userData.id)
      .eq('provider', 'hubspot')
      .eq('is_active', true)
      .single();

    if (connectionError || !connectionData) {
      return NextResponse.json({ isAuthenticated: false });
    }

    // Check if token is still valid
    const expiresAt = new Date(connectionData.expires_at);
    const isExpired = expiresAt <= new Date();

    return NextResponse.json({
      isAuthenticated: !isExpired,
      portalId: connectionData.portal_id,
      expiresAt: connectionData.expires_at,
    });

  } catch (error) {
    console.error('Auth status check error:', error);
    return NextResponse.json({ isAuthenticated: false });
  }
}