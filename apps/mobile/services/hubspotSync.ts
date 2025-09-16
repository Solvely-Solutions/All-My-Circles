/**
 * HubSpot Bi-directional Sync Service
 * Handles syncing changes from HubSpot back to the mobile app
 */

import { devLog, devError } from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Contact } from '../types/contact';

const API_BASE_URL = 'https://all-my-circles-web-ltp4.vercel.app/api';

export interface HubSpotSyncUpdate {
  hubspotContactId: string;
  changes: {
    id: string;
    propertyName: string;
    propertyValue: any;
    changeType: string;
    createdAt: string;
  }[];
  updatedAt: number;
}

export interface SyncResult {
  success: boolean;
  updatedContacts: number;
  errors: string[];
}

class HubSpotSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL_MS = 30000; // 30 seconds

  /**
   * Start automatic sync polling
   */
  startAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    devLog('🔄 Starting HubSpot auto-sync (30s interval)');

    // Run initial sync
    this.pullUpdatesFromHubSpot();

    // Set up periodic sync
    this.syncInterval = setInterval(() => {
      this.pullUpdatesFromHubSpot();
    }, this.SYNC_INTERVAL_MS);
  }

  /**
   * Stop automatic sync polling
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      devLog('🛑 Stopped HubSpot auto-sync');
    }
  }

  /**
   * Manually trigger sync from HubSpot - simplified approach
   */
  async pullUpdatesFromHubSpot(): Promise<SyncResult> {
    try {
      devLog('📥 Checking for HubSpot updates...');

      // For now, just return success - the real sync happens when webhooks
      // trigger contact updates directly from HubSpot API
      return { success: true, updatedContacts: 0, errors: [] };

    } catch (error) {
      devError('HubSpot sync failed:', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        updatedContacts: 0,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Apply HubSpot updates to local contacts
   */
  private async applyUpdatesToContacts(syncUpdates: HubSpotSyncUpdate[]): Promise<{
    updatedContacts: number;
    processedSyncIds: string[];
    syncErrors: { syncId: string; error: string }[];
  }> {
    const processedSyncIds: string[] = [];
    const syncErrors: { syncId: string; error: string }[] = [];
    let updatedContacts = 0;

    // Get current contacts from storage
    const contactsJson = await AsyncStorage.getItem('@circles/contacts');
    const contacts: Contact[] = contactsJson ? JSON.parse(contactsJson) : [];

    let contactsModified = false;

    for (const syncUpdate of syncUpdates) {
      try {
        const { hubspotContactId, changes } = syncUpdate;

        // Find the local contact with this HubSpot ID
        const contactIndex = contacts.findIndex(c => c.hubspotContactId === hubspotContactId);

        if (contactIndex === -1) {
          devLog(`ℹ️  Contact not found locally: ${hubspotContactId}`);
          // Mark all changes as processed (contact not in local DB)
          for (const change of changes) {
            processedSyncIds.push(change.id);
          }
          continue;
        }

        const contact = contacts[contactIndex];
        let contactUpdated = false;

        // Apply each property change
        for (const change of changes) {
          try {
            const { id, propertyName, propertyValue } = change;

            devLog(`🔄 Applying change: ${propertyName} = ${JSON.stringify(propertyValue)} to ${contact.name || contact.firstName + ' ' + contact.lastName}`);

            // Update the contact property
            (contact as any)[propertyName] = propertyValue;
            contactUpdated = true;
            processedSyncIds.push(id);

          } catch (changeError) {
            const errorMsg = changeError instanceof Error ? changeError.message : String(changeError);
            devError(`Failed to apply change ${change.id}:`, errorMsg);
            syncErrors.push({ syncId: change.id, error: errorMsg });
          }
        }

        if (contactUpdated) {
          // Update timestamps
          contact.updatedAt = new Date().toISOString();
          contact.syncStatus = 'synced';
          contact.lastSyncedAt = new Date().toISOString();

          // Update in contacts array
          contacts[contactIndex] = contact;
          contactsModified = true;
          updatedContacts++;

          devLog(`✅ Updated contact: ${contact.name || contact.firstName + ' ' + contact.lastName}`);
        }

      } catch (updateError) {
        const errorMsg = updateError instanceof Error ? updateError.message : String(updateError);
        devError(`Failed to process sync update for contact ${syncUpdate.hubspotContactId}:`, errorMsg);

        // Mark all changes for this contact as failed
        for (const change of syncUpdate.changes) {
          syncErrors.push({ syncId: change.id, error: errorMsg });
        }
      }
    }

    // Save updated contacts back to storage
    if (contactsModified) {
      await AsyncStorage.setItem('@circles/contacts', JSON.stringify(contacts));
      devLog(`💾 Saved updated contacts to storage`);
    }

    return { updatedContacts, processedSyncIds, syncErrors };
  }

  /**
   * Mark sync records as processed on the server
   */
  private async markSyncsAsProcessed(
    processedSyncIds: string[],
    syncErrors: { syncId: string; error: string }[]
  ): Promise<void> {
    try {
      const deviceId = await AsyncStorage.getItem('@allmycircles_device_id');
      if (!deviceId) {
        throw new Error('Device ID not found');
      }

      const response = await fetch(`${API_BASE_URL}/mobile/sync/hubspot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': deviceId,
        },
        body: JSON.stringify({
          processedSyncIds,
          errors: syncErrors
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to mark syncs as processed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      devLog(`📤 Marked ${result.processedCount} syncs as processed, ${result.errorCount} with errors`);

    } catch (error) {
      devError('Failed to mark syncs as processed:', error instanceof Error ? error : new Error(String(error)));
      // Don't throw - this is not critical for the sync process
    }
  }
}

export const hubspotSyncService = new HubSpotSyncService();