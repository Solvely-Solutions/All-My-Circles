import { NextRequest, NextResponse } from 'next/server';
import { validateHubSpotConfig, testHubSpotConnectivity } from '../../../lib/hubspot-config-validator';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const deviceId = searchParams.get('deviceId');

    // Validate basic configuration
    const configValidation = await validateHubSpotConfig();

    const response: any = {
      configValidation,
      timestamp: new Date().toISOString()
    };

    // If deviceId is provided, also check connection status
    if (deviceId) {
      try {
        // Find user by deviceId
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('mobile_device_id', deviceId)
          .single();

        if (userData && !userError) {
          // Check for active HubSpot connection
          const { data: connectionData, error: connectionError } = await supabase
            .from('crm_connections')
            .select('access_token, portal_id, scopes, expires_at, is_active')
            .eq('user_id', userData.id)
            .eq('provider', 'hubspot')
            .eq('is_active', true)
            .single();

          if (connectionData && !connectionError) {
            // Test the connection
            const connectivityTest = await testHubSpotConnectivity(connectionData.access_token);

            response.connectionStatus = {
              hasConnection: true,
              portalId: connectionData.portal_id,
              scopes: connectionData.scopes,
              expiresAt: connectionData.expires_at,
              isActive: connectionData.is_active,
              connectivityTest
            };
          } else {
            response.connectionStatus = {
              hasConnection: false,
              error: 'No active HubSpot connection found'
            };
          }
        } else {
          response.connectionStatus = {
            hasConnection: false,
            error: 'User not found'
          };
        }
      } catch (connectionCheckError) {
        response.connectionStatus = {
          hasConnection: false,
          error: 'Failed to check connection status'
        };
      }
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Config validation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to validate configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    const connectivityTest = await testHubSpotConnectivity(accessToken);

    return NextResponse.json({
      connectivityTest,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Connectivity test error:', error);
    return NextResponse.json(
      {
        error: 'Failed to test connectivity',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}