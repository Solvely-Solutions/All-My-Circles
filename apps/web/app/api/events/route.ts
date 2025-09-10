import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createApiResponse, createErrorResponse, supabase, getPaginationParams, createPaginationResponse } from '@/lib/api-utils';

// GET /api/events - List networking events
export async function GET(request: NextRequest) {
  return withAuth(request, async ({ organization }) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const { page, limit, offset } = getPaginationParams(request);
      
      const searchTerm = searchParams.get('search');
      const eventType = searchParams.get('type');
      const startDate = searchParams.get('start_date');
      const endDate = searchParams.get('end_date');

      let query = supabase
        .from('events')
        .select(`
          *,
          contact_count:contacts(count)
        `)
        .eq('organization_id', organization.id)
        .order('start_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (eventType) {
        query = query.eq('event_type', eventType);
      }

      if (startDate) {
        query = query.gte('start_date', startDate);
      }

      if (endDate) {
        query = query.lte('end_date', endDate);
      }

      const { data: events, error } = await query;

      if (error) {
        console.error('Database error:', error);
        return createErrorResponse('Failed to fetch events', 500);
      }

      return createApiResponse(createPaginationResponse(events, { page, limit, offset }, events.length === limit));

    } catch (error) {
      console.error('Events API error:', error);
      return createErrorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
    }
  });
}

// POST /api/events - Create new networking event
export async function POST(request: NextRequest) {
  return withAuth(request, async ({ organization }) => {
    try {
      const eventData = await request.json();

      // Validate required fields
      if (!eventData.name) {
        return createErrorResponse('Event name is required', 400);
      }

      const { data: event, error } = await supabase
        .from('events')
        .insert({
          organization_id: organization.id,
          ...eventData,
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return createErrorResponse('Failed to create event', 500);
      }

      return createApiResponse(event, 201);

    } catch (error) {
      console.error('Create event error:', error);
      return createErrorResponse(error instanceof Error ? error.message : 'Internal server error', 500);
    }
  });
}