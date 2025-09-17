import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse, createErrorResponse, supabase } from '../../../../../lib/api-utils';

// GET /api/mobile/auth/profile - Get user profile from auth token
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const deviceId = request.headers.get('x-device-id');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse('Authorization token required', 401);
    }

    if (!deviceId) {
      return createErrorResponse('Device ID required', 400);
    }

    const accessToken = authHeader.replace('Bearer ', '');

    // Verify the token with Supabase
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !authUser) {
      console.error('Auth verification error:', authError);
      return createErrorResponse('Invalid or expired token', 401);
    }

    // Get user record from our custom users table
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .single();

    if (userError || !userRecord) {
      console.error('User lookup error:', userError);
      return createErrorResponse('User profile not found', 404);
    }

    // Update user's device ID and last active timestamp
    await supabase
      .from('users')
      .update({
        mobile_device_id: deviceId,
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userRecord.id);

    // Get organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', userRecord.organization_id)
      .single();

    if (orgError || !organization) {
      return createErrorResponse('Organization not found', 404);
    }

    return createApiResponse({
      user: {
        id: userRecord.id,
        authUserId: authUser.id,
        email: userRecord.email,
        firstName: userRecord.first_name,
        lastName: userRecord.last_name,
        organizationId: userRecord.organization_id
      },
      organization: {
        id: organization.id,
        name: organization.name
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch profile',
      500
    );
  }
}