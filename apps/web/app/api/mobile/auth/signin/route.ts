import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse, createErrorResponse, supabase } from '../../../../../lib/api-utils';
import { randomBytes } from 'crypto';

// POST /api/mobile/auth/signin - Sign in existing user
export async function POST(request: NextRequest) {
  try {
    const { email, deviceId, deviceInfo } = await request.json();

    if (!email || !deviceId) {
      return createErrorResponse('Email and device ID are required', 400);
    }

    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !existingUser) {
      return createErrorResponse('No user found with this email. Please sign up first.', 404);
    }

    // Get organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', existingUser.organization_id)
      .single();

    if (orgError || !organization) {
      return createErrorResponse('Organization not found', 404);
    }

    // Deactivate any existing sessions for this device
    await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', existingUser.id)
      .eq('device_id', deviceId);

    // Generate a new session token
    const sessionToken = randomBytes(32).toString('hex');

    // Create new session
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: existingUser.id,
        session_token: sessionToken,
        device_id: deviceId,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        is_active: true
      });

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return createErrorResponse('Failed to create session', 500);
    }

    // Update user last active timestamp
    await supabase
      .from('users')
      .update({
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', existingUser.id);

    return createApiResponse({
      user: {
        id: existingUser.id,
        email: existingUser.email,
        firstName: existingUser.first_name,
        lastName: existingUser.last_name,
        organizationId: existingUser.organization_id
      },
      organization: {
        id: organization.id,
        name: organization.name
      },
      authentication: {
        deviceId,
        sessionToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    }, 200);

  } catch (error) {
    console.error('Mobile signin error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Sign in failed',
      500
    );
  }
}