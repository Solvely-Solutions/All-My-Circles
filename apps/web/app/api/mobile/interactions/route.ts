import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createApiResponse, createErrorResponse, supabase } from '../../../../lib/api-utils';

// GET /api/mobile/interactions - List interactions for a contact or all interactions
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const contactId = searchParams.get('contact_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('interactions')
      .select(`
        id,
        contact_id,
        interaction_type,
        date,
        notes,
        location,
        created_at,
        updated_at,
        contact:contacts(id, first_name, last_name, email),
        event:events(id, name, location, date)
      `)
      .eq('organization_id', user.organization_id)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (contactId) {
      query = query.eq('contact_id', contactId);
    }

    const { data: interactions, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return createErrorResponse('Failed to fetch interactions', 500);
    }

    return createApiResponse({
      interactions,
      pagination: {
        page,
        limit,
        hasMore: interactions.length === limit
      }
    });

  } catch (error) {
    console.error('Mobile interactions API error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}

// POST /api/mobile/interactions - Create a new interaction
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

    const interactionData = await request.json();

    // Validate required fields
    if (!interactionData.contact_id || !interactionData.interaction_type || !interactionData.date) {
      return createErrorResponse('contact_id, interaction_type, and date are required', 400);
    }

    // Verify contact exists and belongs to the organization
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', interactionData.contact_id)
      .eq('organization_id', user.organization_id)
      .single();

    if (!contact) {
      return createErrorResponse('Contact not found or access denied', 404);
    }

    const { data: interaction, error } = await supabase
      .from('interactions')
      .insert({
        organization_id: user.organization_id,
        contact_id: interactionData.contact_id,
        interaction_type: interactionData.interaction_type,
        date: interactionData.date,
        notes: interactionData.notes,
        location: interactionData.location,
        event_id: interactionData.event_id
      })
      .select(`
        id,
        contact_id,
        interaction_type,
        date,
        notes,
        location,
        created_at,
        updated_at,
        contact:contacts(id, first_name, last_name, email),
        event:events(id, name, location, date)
      `)
      .single();

    if (error) {
      console.error('Database error:', error);
      return createErrorResponse('Failed to create interaction', 500);
    }

    // Update contact's interaction counts and dates
    const { data: interactionCounts } = await supabase
      .from('interactions')
      .select('id, date')
      .eq('contact_id', interactionData.contact_id)
      .eq('organization_id', user.organization_id)
      .order('date', { ascending: false });

    if (interactionCounts && interactionCounts.length > 0) {
      await supabase
        .from('contacts')
        .update({
          total_interactions: interactionCounts.length,
          last_interaction_date: interactionCounts[0].date,
          hubspot_sync_needed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', interactionData.contact_id);
    }

    return createApiResponse(interaction, 201);

  } catch (error) {
    console.error('Create interaction error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}