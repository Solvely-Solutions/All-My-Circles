import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse, createErrorResponse, supabase } from '../../../../lib/api-utils';

// POST /api/mobile/auth - Register new user with Supabase Auth
export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, deviceId } = await request.json();

    if (!email || !password || !deviceId) {
      return createErrorResponse('Email, password, and device ID are required', 400);
    }

    if (!firstName || !lastName) {
      return createErrorResponse('First name and last name are required', 400);
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for demo
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        device_id: deviceId
      }
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      if (authError.message.includes('already registered')) {
        return createErrorResponse('User already exists. Please sign in instead.', 409);
      }
      return createErrorResponse(authError.message || 'Failed to create user', 400);
    }

    if (!authData.user) {
      return createErrorResponse('Failed to create user', 500);
    }

    // Create organization for the user
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: `${firstName} ${lastName}'s Organization`
      })
      .select()
      .single();

    if (orgError) {
      console.error('Organization creation error:', orgError);
      return createErrorResponse('Failed to create organization', 500);
    }

    // Create user record in our custom users table
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        auth_user_id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        organization_id: newOrg.id,
        mobile_device_id: deviceId
      })
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      // Clean up auth user if we failed to create the profile
      await supabase.auth.admin.deleteUser(authData.user.id);
      return createErrorResponse('Failed to create user profile', 500);
    }

    return NextResponse.json({
      user: {
        id: newUser.id,
        authUserId: authData.user.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        organizationId: newUser.organization_id
      },
      organization: {
        id: newOrg.id,
        name: newOrg.name
      },
      message: 'User registered successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Mobile auth error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Authentication failed',
      500
    );
  }
}

// GET /api/mobile/auth - Verify authentication status
export async function GET(request: NextRequest) {
  const deviceId = request.headers.get('x-device-id');
  const sessionToken = request.headers.get('x-session-token');
  
  if (!deviceId) {
    return createErrorResponse('Device ID required', 401);
  }

  try {
    // Check if session is valid
    let user;
    
    if (sessionToken) {
      const { data: session } = await supabase
        .from('user_sessions')
        .select(`
          *,
          user:users(
            *,
            organization:organizations(*)
          )
        `)
        .eq('session_token', sessionToken)
        .eq('device_id', deviceId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (session) {
        user = session.user;
      }
    }

    if (!user) {
      // Fallback to device ID lookup
      const { data: deviceUser } = await supabase
        .from('users')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('mobile_device_id', deviceId)
        .eq('is_active', true)
        .single();

      user = deviceUser;
    }

    if (!user) {
      return createErrorResponse('Invalid authentication', 401);
    }

    // Update last active
    await supabase
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', user.id);

    return createApiResponse({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        organizationId: user.organization_id,
        role: user.role,
        lastActiveAt: new Date().toISOString()
      },
      organization: user.organization
    });

  } catch (error) {
    console.error('Auth verification error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Authentication verification failed',
      500
    );
  }
}