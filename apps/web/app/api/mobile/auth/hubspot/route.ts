import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { deviceId, redirectUrl } = await request.json();

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }

    // Create state parameter with device info
    const state = Buffer.from(JSON.stringify({
      deviceId,
      redirectUrl: redirectUrl || '/dashboard',
      timestamp: Date.now(),
    })).toString('base64');

    // Build HubSpot OAuth URL
    const params = new URLSearchParams({
      client_id: process.env.HUBSPOT_CLIENT_ID!,
      redirect_uri: process.env.HUBSPOT_REDIRECT_URI!,
      scope: [
        'crm.objects.contacts.read',
        'crm.objects.contacts.write',
        'crm.objects.companies.read',
        'crm.objects.companies.write',
        'crm.objects.deals.read',
        'crm.objects.deals.write',
        'crm.schemas.custom.read',
        'crm.schemas.custom.write',
        'integration-sync'
      ].join(' '),
      state,
      response_type: 'code',
    });

    const authUrl = `https://app.hubspot.com/oauth/authorize?${params.toString()}`;

    return NextResponse.json({
      authUrl,
      state,
      message: 'Open this URL in a browser to authenticate with HubSpot'
    });

  } catch (error) {
    console.error('Mobile auth error:', error);
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const deviceId = searchParams.get('deviceId');

  if (!deviceId) {
    return NextResponse.json(
      { error: 'Device ID is required' },
      { status: 400 }
    );
  }

  // Create state parameter with device info
  const state = Buffer.from(JSON.stringify({
    deviceId,
    redirectUrl: '/mobile-auth-success',
    timestamp: Date.now(),
  })).toString('base64');

  // Build HubSpot OAuth URL
  const params = new URLSearchParams({
    client_id: process.env.HUBSPOT_CLIENT_ID!,
    redirect_uri: process.env.HUBSPOT_REDIRECT_URI!,
    scope: [
      'crm.objects.contacts.read',
      'crm.objects.contacts.write',
      'crm.objects.companies.read',
      'crm.objects.companies.write',
      'crm.objects.deals.read',
      'crm.objects.deals.write',
      'crm.schemas.custom.read',
      'crm.schemas.custom.write',
      'integration-sync'
    ].join(' '),
    state,
    response_type: 'code',
  });

  const authUrl = `https://app.hubspot.com/oauth/authorize?${params.toString()}`;

  // Redirect directly to HubSpot OAuth
  return NextResponse.redirect(authUrl);
}