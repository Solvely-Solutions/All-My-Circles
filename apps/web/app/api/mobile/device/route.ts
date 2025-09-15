import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse, createErrorResponse, supabase } from '../../../../lib/api-utils';

// POST /api/mobile/device - Register a new mobile device
export async function POST(request: NextRequest) {
  try {
    const { deviceId, deviceInfo, email } = await request.json();

    if (!deviceId || !deviceInfo) {
      return createErrorResponse('Device ID and device info are required', 400);
    }

    // Check if device is already registered
    const { data: existingDevice } = await supabase
      .from('users')
      .select('*')
      .eq('mobile_device_id', deviceId)
      .single();

    if (existingDevice) {
      // Update existing device info
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          device_info: deviceInfo,
          last_active_at: new Date().toISOString()
        })
        .eq('mobile_device_id', deviceId)
        .select()
        .single();

      if (error) {
        console.error('Device update error:', error);
        return createErrorResponse('Failed to update device', 500);
      }

      return createApiResponse({
        message: 'Device updated successfully',
        deviceId,
        registered: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          organizationId: updatedUser.organization_id
        }
      });
    }

    if (!email) {
      return createErrorResponse('Email is required for new device registration', 400);
    }

    // Register new device - this will be completed when user authenticates via email
    return createApiResponse({
      message: 'Device registered for authentication',
      deviceId,
      registered: false,
      requiresAuthentication: true,
      nextStep: 'authenticate_with_email'
    }, 201);

  } catch (error) {
    console.error('Device registration error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Device registration failed',
      500
    );
  }
}

// GET /api/mobile/device - Get device status
export async function GET(request: NextRequest) {
  const deviceId = request.headers.get('x-device-id');
  
  if (!deviceId) {
    return createErrorResponse('Device ID required', 400);
  }

  try {
    const { data: user } = await supabase
      .from('users')
      .select(`
        id,
        email,
        organization_id,
        role,
        is_active,
        device_info,
        last_active_at,
        last_mobile_sync_at,
        organization:organizations(id, name, plan, settings)
      `)
      .eq('mobile_device_id', deviceId)
      .single();

    if (!user) {
      return createApiResponse({
        registered: false,
        deviceId,
        message: 'Device not found'
      });
    }

    return createApiResponse({
      registered: true,
      deviceId,
      user: {
        id: user.id,
        email: user.email,
        organizationId: user.organization_id,
        role: user.role,
        isActive: user.is_active,
        lastActiveAt: user.last_active_at,
        lastSyncAt: user.last_mobile_sync_at
      },
      organization: user.organization,
      deviceInfo: user.device_info
    });

  } catch (error) {
    console.error('Device status error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to get device status',
      500
    );
  }
}