import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createApiResponse, createErrorResponse, supabase } from '../../../../lib/api-utils';

// GET /api/mobile/events - List all events for the organization
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const deviceId = request.headers.get('x-device-id');
  
  if (!authHeader && !deviceId) {
    return createErrorResponse('Authentication required', 401);
  }

  try {
    let organizationId;

    if (deviceId) {
      // Mobile app authentication via device ID
      const { data: user } = await supabase
        .from('users')
        .select('organization_id')
        .eq('mobile_device_id', deviceId)
        .single();
      
      if (!user) {
        return createErrorResponse('Device not authorized', 401);
      }
      organizationId = user.organization_id;
    } else {
      // Web authentication via cookies or token
      const portalId = request.cookies.get('hubspot_portal_id')?.value;
      if (!portalId) {
        return createErrorResponse('Portal ID not found', 401);
      }

      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('hubspot_portal_id', parseInt(portalId))
        .single();
      
      if (!org) {
        return createErrorResponse('Organization not found', 401);
      }
      organizationId = org.id;
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id,
        name,
        location,
        date,
        description,
        event_type,
        created_at,
        updated_at
      `)
      .eq('organization_id', organizationId)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return createErrorResponse('Failed to fetch events', 500);
    }

    return createApiResponse({
      events,
      pagination: {
        page,
        limit,
        hasMore: events.length === limit
      }
    });

  } catch (error) {
    console.error('Mobile events API error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}

// POST /api/mobile/events - Create a new event
export async function POST(request: NextRequest) {
  const deviceId = request.headers.get('x-device-id');
  
  if (!deviceId) {
    return createErrorResponse('Device ID required for mobile authentication', 401);
  }

  try {
    const { data: user } = await supabase
      .from('users')
      .select('organization_id')
      .eq('mobile_device_id', deviceId)
      .single();
    
    if (!user) {
      return createErrorResponse('Device not authorized', 401);
    }

    const eventData = await request.json();

    // Validate required fields
    if (!eventData.name || !eventData.date) {
      return createErrorResponse('Event name and date are required', 400);
    }

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        organization_id: user.organization_id,
        name: eventData.name,
        location: eventData.location,
        date: eventData.date,
        description: eventData.description,
        event_type: eventData.event_type || 'conference'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return createErrorResponse('Failed to create event', 500);
    }

    return createApiResponse(event, { status: 201 });

  } catch (error) {
    console.error('Create event error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}