import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse, createErrorResponse, supabase } from '../../../../../lib/api-utils';

// GET /api/mobile/sync/hubspot - Fetch pending HubSpot sync updates for mobile app
export async function GET(request: NextRequest) {
  try {
    const deviceId = request.headers.get('x-device-id');

    if (!deviceId) {
      return createErrorResponse('Device ID required', 401);
    }

    console.log('📱 Fetching pending HubSpot syncs for device:', deviceId);

    // Get all pending sync records for this device
    const { data: pendingSyncs, error: syncError } = await supabase
      .from('hubspot_sync_queue')
      .select('*')
      .eq('device_id', deviceId)
      .eq('processed', false)
      .order('created_at', { ascending: true });

    if (syncError) {
      // If table doesn't exist yet, return empty array
      if (syncError.code === '42P01') {
        return createApiResponse({
          syncs: [],
          message: 'No pending syncs (sync queue not initialized)'
        });
      }
      throw syncError;
    }

    console.log(`📋 Found ${pendingSyncs?.length || 0} pending syncs for device ${deviceId}`);

    // Group syncs by contact for efficient processing
    const contactSyncs: { [contactId: string]: any[] } = {};

    for (const sync of pendingSyncs || []) {
      const contactId = sync.hubspot_contact_id;
      if (!contactSyncs[contactId]) {
        contactSyncs[contactId] = [];
      }
      contactSyncs[contactId].push({
        id: sync.id,
        propertyName: sync.property_name,
        propertyValue: JSON.parse(sync.property_value),
        changeType: sync.change_type,
        createdAt: sync.created_at
      });
    }

    // Convert to array format expected by mobile app
    const syncUpdates = Object.entries(contactSyncs).map(([hubspotContactId, changes]) => ({
      hubspotContactId,
      changes,
      updatedAt: Math.max(...changes.map(c => new Date(c.createdAt).getTime()))
    }));

    return createApiResponse({
      syncs: syncUpdates,
      totalPending: pendingSyncs?.length || 0,
      contactsAffected: Object.keys(contactSyncs).length
    });

  } catch (error) {
    console.error('❌ Failed to fetch pending syncs:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch pending syncs',
      500
    );
  }
}

// POST /api/mobile/sync/hubspot - Mark sync records as processed
export async function POST(request: NextRequest) {
  try {
    const deviceId = request.headers.get('x-device-id');
    const { processedSyncIds, errors } = await request.json();

    if (!deviceId) {
      return createErrorResponse('Device ID required', 401);
    }

    console.log('📱 Processing sync completion for device:', deviceId);
    console.log('✅ Processed sync IDs:', processedSyncIds);
    console.log('❌ Failed sync IDs:', errors?.length || 0);

    // Mark successful syncs as processed
    if (processedSyncIds && processedSyncIds.length > 0) {
      const { error: updateError } = await supabase
        .from('hubspot_sync_queue')
        .update({
          processed: true,
          processed_at: new Date().toISOString()
        })
        .in('id', processedSyncIds)
        .eq('device_id', deviceId);

      if (updateError) {
        throw updateError;
      }

      console.log(`✅ Marked ${processedSyncIds.length} syncs as processed`);
    }

    // Mark failed syncs with error messages
    if (errors && errors.length > 0) {
      for (const errorRecord of errors) {
        const { syncId, error: errorMessage } = errorRecord;

        const { error: errorUpdateError } = await supabase
          .from('hubspot_sync_queue')
          .update({
            error_message: errorMessage,
            processed_at: new Date().toISOString()
          })
          .eq('id', syncId)
          .eq('device_id', deviceId);

        if (errorUpdateError) {
          console.error('❌ Failed to update error for sync:', syncId, errorUpdateError);
        }
      }

      console.log(`❌ Recorded errors for ${errors.length} failed syncs`);
    }

    // Get remaining pending count
    const { count } = await supabase
      .from('hubspot_sync_queue')
      .select('*', { count: 'exact', head: true })
      .eq('device_id', deviceId)
      .eq('processed', false);

    return createApiResponse({
      message: 'Sync status updated successfully',
      processedCount: processedSyncIds?.length || 0,
      errorCount: errors?.length || 0,
      remainingPending: count || 0
    });

  } catch (error) {
    console.error('❌ Failed to update sync status:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to update sync status',
      500
    );
  }
}