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
   * Manually trigger sync from HubSpot by checking for contact updates
   */
  async pullUpdatesFromHubSpot(): Promise<SyncResult> {
    try {
      devLog('📥 Checking for HubSpot contact updates...');

      // Get local contacts that have HubSpot IDs
      const contactsJson = await AsyncStorage.getItem('@circles/contacts');
      const localContacts: Contact[] = contactsJson ? JSON.parse(contactsJson) : [];

      devLog(`📱 Found ${localContacts.length} total local contacts`);

      const hubspotContacts = localContacts.filter(c => c.hubspotContactId);

      devLog(`🔗 Contacts with HubSpot IDs:`, hubspotContacts.map(c => ({
        name: c.name,
        hubspotContactId: c.hubspotContactId
      })));

      if (hubspotContacts.length === 0) {
        devLog('ℹ️  No HubSpot-synced contacts found locally');
        return { success: true, updatedContacts: 0, errors: [] };
      }

      devLog(`🔍 Checking ${hubspotContacts.length} HubSpot contacts for updates...`);

      let updatedCount = 0;
      const errors: string[] = [];

      // Check each contact for updates
      for (const localContact of hubspotContacts) {
        try {
          const wasUpdated = await this.checkAndUpdateContact(localContact, localContacts);
          if (wasUpdated) {
            updatedCount++;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          devError(`Failed to check contact ${localContact.name}:`, errorMsg);
          errors.push(`${localContact.name}: ${errorMsg}`);
        }
      }

      // Save updated contacts if any were changed
      if (updatedCount > 0) {
        await AsyncStorage.setItem('@circles/contacts', JSON.stringify(localContacts));
        devLog(`💾 Saved ${updatedCount} updated contacts to storage`);
      }

      devLog(`✅ HubSpot sync completed: ${updatedCount} contacts updated`);
      return { success: true, updatedContacts: updatedCount, errors };

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
   * Check if a local contact needs updating from HubSpot and update it
   */
  private async checkAndUpdateContact(localContact: Contact, allContacts: Contact[]): Promise<boolean> {
    if (!localContact.hubspotContactId) {
      return false;
    }

    try {
      const deviceId = await AsyncStorage.getItem('@allmycircles_device_id') || '';
      devLog(`🔄 Checking contact ${localContact.name} (HubSpot ID: ${localContact.hubspotContactId})`);
      devLog(`📱 Using device ID: ${deviceId.substring(0, 8)}...`);

      const apiUrl = `${API_BASE_URL}/mobile/contacts/hubspot/${localContact.hubspotContactId}`;
      devLog(`🌐 API URL: ${apiUrl}`);

      // Fetch fresh contact data from HubSpot
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'x-device-id': deviceId,
        },
      });

      devLog(`📡 API Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        if (response.status === 404) {
          devLog(`ℹ️  Contact ${localContact.name} not found in HubSpot (may have been deleted)`);
          return false;
        }
        throw new Error(`Failed to fetch contact: ${response.status}`);
      }

      const hubspotData = await response.json();
      const hubspotContact = hubspotData.contact;

      // Check if HubSpot contact was modified more recently than local
      const hubspotModified = new Date(hubspotContact.updatedAt || 0).getTime();
      const localModified = new Date(localContact.updatedAt || 0).getTime();

      if (hubspotModified <= localModified) {
        // Local contact is up to date
        return false;
      }

      devLog(`🔄 Updating ${localContact.name} from HubSpot (${new Date(hubspotModified).toISOString()})`);

      // Update local contact with HubSpot data
      const contactIndex = allContacts.findIndex(c => c.id === localContact.id);
      if (contactIndex !== -1) {
        // Preserve local-only fields and update from HubSpot
        allContacts[contactIndex] = {
          ...localContact,
          firstName: hubspotContact.firstName || localContact.firstName,
          lastName: hubspotContact.lastName || localContact.lastName,
          email: hubspotContact.email || localContact.email,
          phone: hubspotContact.phone || localContact.phone,
          company: hubspotContact.company || localContact.company,
          title: hubspotContact.title || localContact.title,
          linkedinUrl: hubspotContact.linkedinUrl || localContact.linkedinUrl,
          firstMetLocation: hubspotContact.firstMetLocation || localContact.firstMetLocation,
          firstMetDate: hubspotContact.firstMetDate || localContact.firstMetDate,
          notes: hubspotContact.notes || localContact.notes,
          tags: hubspotContact.tags || localContact.tags,
          updatedAt: new Date().toISOString(),
          syncStatus: 'synced',
          lastSyncedAt: new Date().toISOString(),
        };

        return true;
      }

      return false;
    } catch (error) {
      throw error;
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