import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse, createErrorResponse, supabase } from '../../../../lib/api-utils';
import { randomBytes } from 'crypto';

// POST /api/mobile/auth - Register/authenticate mobile device
export async function POST(request: NextRequest) {
  try {
    const { email, deviceId, deviceInfo, firstName, lastName } = await request.json();

    if (!email || !deviceId) {
      return createErrorResponse('Email and device ID are required', 400);
    }

    // Check if user exists
    let { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    let organization;

    if (!existingUser) {
      // Create new organization and user
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: `${email.split('@')[0]}'s Organization`
        })
        .select()
        .single();

      if (orgError) {
        console.error('Organization creation error:', orgError);
        return createErrorResponse('Failed to create organization', 500);
      }

      organization = newOrg;

      // Create user
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email,
          first_name: firstName,
          last_name: lastName,
          organization_id: organization.id
        })
        .select()
        .single();

      if (userError) {
        console.error('User creation error:', userError);
        return createErrorResponse('Failed to create user', 500);
      }

      existingUser = newUser;
    } else {
      // Update existing user's device info
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('User update error:', updateError);
        return createErrorResponse('Failed to update user', 500);
      }

      existingUser = updatedUser;

      // Get organization
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', existingUser.organization_id)
        .single();

      organization = org;
    }

    // Generate a session token for API access (simple random string for demo)
    const sessionToken = randomBytes(32).toString('hex');

    // Store session (in a real app, you'd use a proper session store)
    await supabase
      .from('user_sessions')
      .insert({
        user_id: existingUser.id,
        session_token: sessionToken,
        device_id: deviceId,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        is_active: true
      });

    return createApiResponse({
      user: {
        id: existingUser.id,
        email: existingUser.email,
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
    }, 201);

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