import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createApiResponse, createErrorResponse, supabase } from '../../../../lib/api-utils';

// POST /api/mobile/sync - Bulk sync mobile data (contacts, events, interactions)
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

    const syncData = await request.json();
    const { contacts = [], events = [], interactions = [], lastSyncTimestamp } = syncData;

    let results = {
      contacts: { created: 0, updated: 0, failed: 0 },
      events: { created: 0, updated: 0, failed: 0 },
      interactions: { created: 0, updated: 0, failed: 0 },
      errors: [] as string[]
    };

    // Sync Events first (contacts may reference them)
    for (const eventData of events) {
      try {
        if (eventData.id && eventData.id !== 'temp') {
          // Update existing event
          const { error } = await supabase
            .from('events')
            .update({
              name: eventData.name,
              location: eventData.location,
              date: eventData.date,
              description: eventData.description,
              event_type: eventData.event_type,
              updated_at: new Date().toISOString()
            })
            .eq('id', eventData.id)
            .eq('organization_id', user.organization_id);

          if (error) throw error;
          results.events.updated++;
        } else {
          // Create new event
          const { data: newEvent, error } = await supabase
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

          if (error) throw error;
          results.events.created++;
        }
      } catch (error) {
        results.events.failed++;
        results.errors.push(`Event sync error: ${error}`);
      }
    }

    // Sync Contacts
    for (const contactData of contacts) {
      try {
        if (contactData.id && contactData.id !== 'temp') {
          // Update existing contact
          const { error } = await supabase
            .from('contacts')
            .update({
              first_name: contactData.first_name,
              last_name: contactData.last_name,
              email: contactData.email,
              phone: contactData.phone,
              company: contactData.company,
              job_title: contactData.job_title,
              connection_strength: contactData.connection_strength,
              contact_value: contactData.contact_value,
              first_met_location: contactData.first_met_location,
              first_met_date: contactData.first_met_date,
              last_interaction_date: contactData.last_interaction_date,
              next_followup_date: contactData.next_followup_date,
              total_interactions: contactData.total_interactions,
              tags: contactData.tags,
              notes: contactData.notes,
              hubspot_sync_needed: true,
              mobile_sync_needed: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', contactData.id)
            .eq('organization_id', user.organization_id);

          if (error) throw error;
          results.contacts.updated++;
        } else {
          // Create new contact
          const { data: newContact, error } = await supabase
            .from('contacts')
            .insert({
              organization_id: user.organization_id,
              first_name: contactData.first_name,
              last_name: contactData.last_name,
              email: contactData.email,
              phone: contactData.phone,
              company: contactData.company,
              job_title: contactData.job_title,
              connection_strength: contactData.connection_strength,
              contact_value: contactData.contact_value,
              first_met_location: contactData.first_met_location,
              first_met_date: contactData.first_met_date,
              last_interaction_date: contactData.last_interaction_date,
              next_followup_date: contactData.next_followup_date,
              total_interactions: contactData.total_interactions,
              tags: contactData.tags,
              notes: contactData.notes,
              hubspot_sync_needed: true,
              mobile_sync_needed: false
            })
            .select()
            .single();

          if (error) throw error;
          results.contacts.created++;
        }
      } catch (error) {
        results.contacts.failed++;
        results.errors.push(`Contact sync error: ${error}`);
      }
    }

    // Sync Interactions
    for (const interactionData of interactions) {
      try {
        if (interactionData.id && interactionData.id !== 'temp') {
          // Update existing interaction
          const { error } = await supabase
            .from('interactions')
            .update({
              interaction_type: interactionData.interaction_type,
              date: interactionData.date,
              notes: interactionData.notes,
              location: interactionData.location,
              updated_at: new Date().toISOString()
            })
            .eq('id', interactionData.id)
            .eq('organization_id', user.organization_id);

          if (error) throw error;
          results.interactions.updated++;
        } else {
          // Create new interaction
          const { data: newInteraction, error } = await supabase
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
            .select()
            .single();

          if (error) throw error;
          results.interactions.created++;
        }
      } catch (error) {
        results.interactions.failed++;
        results.errors.push(`Interaction sync error: ${error}`);
      }
    }

    // Update user's last sync timestamp
    await supabase
      .from('users')
      .update({
        last_mobile_sync_at: new Date().toISOString()
      })
      .eq('mobile_device_id', deviceId);

    return createApiResponse({
      message: 'Mobile sync completed',
      results,
      syncedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Mobile sync error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}

// GET /api/mobile/sync - Get sync status and pending changes
export async function GET(request: NextRequest) {
  const deviceId = request.headers.get('x-device-id');
  
  if (!deviceId) {
    return createErrorResponse('Device ID required for mobile authentication', 401);
  }

  try {
    const { data: user } = await supabase
      .from('users')
      .select('organization_id, last_mobile_sync_at')
      .eq('mobile_device_id', deviceId)
      .single();
    
    if (!user) {
      return createErrorResponse('Device not authorized', 401);
    }

    const searchParams = request.nextUrl.searchParams;
    const since = searchParams.get('since') || user.last_mobile_sync_at;

    // Get counts of items that need sync
    const { data: syncStats } = await supabase
      .from('contacts')
      .select('mobile_sync_needed')
      .eq('organization_id', user.organization_id);

    const pendingSyncCount = syncStats?.filter(c => c.mobile_sync_needed).length || 0;

    // Get recent changes since last sync
    let recentChanges: {
      contacts: any[];
      events: any[];
      interactions: any[];
    } = {
      contacts: [],
      events: [],
      interactions: []
    };

    if (since) {
      const sinceDate = new Date(since).toISOString();

      // Get contacts updated since last sync
      const { data: updatedContacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', user.organization_id)
        .gte('updated_at', sinceDate)
        .limit(100);

      // Get events updated since last sync
      const { data: updatedEvents } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', user.organization_id)
        .gte('updated_at', sinceDate)
        .limit(100);

      // Get interactions updated since last sync
      const { data: updatedInteractions } = await supabase
        .from('interactions')
        .select(`
          *,
          contact:contacts(id, first_name, last_name),
          event:events(id, name)
        `)
        .eq('organization_id', user.organization_id)
        .gte('updated_at', sinceDate)
        .limit(100);

      recentChanges = {
        contacts: updatedContacts || [],
        events: updatedEvents || [],
        interactions: updatedInteractions || []
      };
    }

    return createApiResponse({
      lastSyncAt: user.last_mobile_sync_at,
      pendingSyncCount,
      recentChanges,
      serverTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get sync status error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}