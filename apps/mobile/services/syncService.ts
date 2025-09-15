import { offlineStorage, OfflineQueueItem } from './offlineStorage';
import { Contact, ContactGroup } from '../types/contact';
import { apiService } from './apiService';

export interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}

class SyncService {
  private isProcessing = false;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  async processOfflineQueue(): Promise<SyncResult> {
    if (this.isProcessing) {
      return { success: false, processed: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    this.isProcessing = true;
    const result: SyncResult = { success: true, processed: 0, failed: 0, errors: [] };

    try {
      const queue = await offlineStorage.getOfflineQueue();
      const pendingItems = queue.filter(item => item.status === 'pending' || item.status === 'failed');

      for (const item of pendingItems) {
        try {
          await this.processQueueItem(item);
          await offlineStorage.removeFromOfflineQueue(item.id);
          result.processed++;
        } catch (error) {
          result.failed++;
          result.errors.push(`Failed to process ${item.type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          
          const retryCount = (item.retryCount || 0) + 1;
          if (retryCount >= this.MAX_RETRIES) {
            // Mark as failed after max retries
            await offlineStorage.updateQueueItemStatus(item.id, 'failed', retryCount);
          } else {
            // Update retry count and keep as pending
            await offlineStorage.updateQueueItemStatus(item.id, 'pending', retryCount);
          }
        }
      }

      if (result.processed > 0) {
        await offlineStorage.setLastSyncTime(Date.now());
      }

      result.success = result.failed === 0;
    } catch (error) {
      result.success = false;
      result.errors.push(`Sync process failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isProcessing = false;
    }

    return result;
  }

  private async processQueueItem(item: OfflineQueueItem): Promise<void> {
    // Update status to syncing
    await offlineStorage.updateQueueItemStatus(item.id, 'syncing');

    // Add a small delay to simulate network operation
    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));

    switch (item.type) {
      case 'add_contact':
        await this.processAddContact(item.payload);
        break;
      case 'edit_contact':
        await this.processEditContact(item.payload);
        break;
      case 'delete_contact':
        await this.processDeleteContact(item.payload);
        break;
      case 'add_group':
        await this.processAddGroup(item.payload);
        break;
      case 'edit_group':
        await this.processEditGroup(item.payload);
        break;
      case 'delete_group':
        await this.processDeleteGroup(item.payload);
        break;
      default:
        throw new Error(`Unknown queue item type: ${item.type}`);
    }
  }

  private async processAddContact(payload: Contact): Promise<void> {
    console.log('Processing add contact:', payload);

    try {
      await apiService.createContact(payload);
      console.log('Successfully synced contact to backend and HubSpot');
    } catch (error) {
      console.error('Failed to sync contact:', error);
      throw new Error(`Failed to add contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processEditContact(payload: any): Promise<void> {
    console.log('Processing edit contact:', payload);
    
    if (Math.random() < 0.1) {
      throw new Error('Network timeout while editing contact');
    }
    
    // Real implementation would update the contact on the server
  }

  private async processDeleteContact(payload: any): Promise<void> {
    console.log('Processing delete contact:', payload);
    
    if (Math.random() < 0.1) {
      throw new Error('Network timeout while deleting contact');
    }
    
    // Real implementation would delete the contact on the server
  }

  private async processAddGroup(payload: any): Promise<void> {
    console.log('Processing add group:', payload);
    
    if (Math.random() < 0.1) {
      throw new Error('Network timeout while adding group');
    }
  }

  private async processEditGroup(payload: any): Promise<void> {
    console.log('Processing edit group:', payload);
    
    if (Math.random() < 0.1) {
      throw new Error('Network timeout while editing group');
    }
  }

  private async processDeleteGroup(payload: any): Promise<void> {
    console.log('Processing delete group:', payload);
    
    if (Math.random() < 0.1) {
      throw new Error('Network timeout while deleting group');
    }
  }

  async isOnline(): Promise<boolean> {
    try {
      // Simple connectivity check - in a real app you might use NetInfo
      // For now, we'll simulate network availability
      return Math.random() > 0.2; // 80% chance of being "online"
    } catch {
      return false;
    }
  }

  async startAutoSync(intervalMs: number = 30000): Promise<void> {
    const sync = async () => {
      if (await this.isOnline()) {
        const result = await this.processOfflineQueue();
        if (result.processed > 0) {
          console.log(`Auto-sync completed: ${result.processed} items processed, ${result.failed} failed`);
        }
        if (result.errors.length > 0) {
          console.warn('Auto-sync errors:', result.errors);
        }
      }
    };

    // Run initial sync
    await sync();

    // Set up periodic sync
    setInterval(sync, intervalMs);
  }

  async getQueueStatus(): Promise<{
    pending: number;
    syncing: number;
    failed: number;
    total: number;
  }> {
    try {
      const queue = await offlineStorage.getOfflineQueue();
      return {
        pending: queue.filter(item => item.status === 'pending').length,
        syncing: queue.filter(item => item.status === 'syncing').length,
        failed: queue.filter(item => item.status === 'failed').length,
        total: queue.length,
      };
    } catch (error) {
      console.error('Failed to get queue status:', error);
      return { pending: 0, syncing: 0, failed: 0, total: 0 };
    }
  }

  // Public method to immediately sync a contact to backend
  async syncContact(contact: Contact): Promise<void> {
    console.log('Syncing contact immediately:', contact);
    await this.processAddContact(contact);
  }
}

export const syncService = new SyncService();