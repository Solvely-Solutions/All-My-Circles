import AsyncStorage from '@react-native-async-storage/async-storage';
import { Contact, ContactGroup } from '../types/contact';

export interface OfflineQueueItem {
  id: string;
  type: "add_contact" | "edit_contact" | "delete_contact" | "add_group" | "edit_group" | "delete_group";
  payload: any;
  timestamp: number;
  status: "pending" | "syncing" | "failed";
  retryCount?: number;
}

const STORAGE_KEYS = {
  OFFLINE_QUEUE: '@circles_offline_queue',
  CONTACTS: '@circles_contacts',
  GROUPS: '@circles_groups',
  LAST_SYNC: '@circles_last_sync',
} as const;

class OfflineStorageService {
  
  // Offline Queue Management
  async getOfflineQueue(): Promise<OfflineQueueItem[]> {
    try {
      const queueJson = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      console.error('Failed to get offline queue:', error);
      return [];
    }
  }

  async addToOfflineQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp'>): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      const newItem: OfflineQueueItem = {
        ...item,
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
      };
      
      queue.push(newItem);
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to add to offline queue:', error);
      throw error;
    }
  }

  async updateQueueItemStatus(
    itemId: string, 
    status: OfflineQueueItem['status'], 
    retryCount?: number
  ): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      const itemIndex = queue.findIndex(item => item.id === itemId);
      
      if (itemIndex !== -1) {
        queue[itemIndex].status = status;
        if (retryCount !== undefined) {
          queue[itemIndex].retryCount = retryCount;
        }
        await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
      }
    } catch (error) {
      console.error('Failed to update queue item status:', error);
      throw error;
    }
  }

  async removeFromOfflineQueue(itemId: string): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      const filteredQueue = queue.filter(item => item.id !== itemId);
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(filteredQueue));
    } catch (error) {
      console.error('Failed to remove from offline queue:', error);
      throw error;
    }
  }

  async clearOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
    } catch (error) {
      console.error('Failed to clear offline queue:', error);
      throw error;
    }
  }

  // Data Persistence
  async saveContacts(contacts: Contact[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
    } catch (error) {
      console.error('Failed to save contacts:', error);
      throw error;
    }
  }

  async getContacts(): Promise<Contact[]> {
    try {
      const contactsJson = await AsyncStorage.getItem(STORAGE_KEYS.CONTACTS);
      return contactsJson ? JSON.parse(contactsJson) : [];
    } catch (error) {
      console.error('Failed to get contacts:', error);
      return [];
    }
  }

  async saveGroups(groups: ContactGroup[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
    } catch (error) {
      console.error('Failed to save groups:', error);
      throw error;
    }
  }

  async getGroups(): Promise<ContactGroup[]> {
    try {
      const groupsJson = await AsyncStorage.getItem(STORAGE_KEYS.GROUPS);
      return groupsJson ? JSON.parse(groupsJson) : [];
    } catch (error) {
      console.error('Failed to get groups:', error);
      return [];
    }
  }

  // Sync Management
  async setLastSyncTime(timestamp: number): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp.toString());
    } catch (error) {
      console.error('Failed to set last sync time:', error);
      throw error;
    }
  }

  async getLastSyncTime(): Promise<number | null> {
    try {
      const timestampStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return timestampStr ? parseInt(timestampStr, 10) : null;
    } catch (error) {
      console.error('Failed to get last sync time:', error);
      return null;
    }
  }

  // Utility Methods
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw error;
    }
  }

  async getStorageInfo(): Promise<{ 
    queueSize: number; 
    contactsCount: number; 
    groupsCount: number; 
    lastSync: number | null;
  }> {
    try {
      const [queue, contacts, groups, lastSync] = await Promise.all([
        this.getOfflineQueue(),
        this.getContacts(),
        this.getGroups(),
        this.getLastSyncTime(),
      ]);

      return {
        queueSize: queue.length,
        contactsCount: contacts.length,
        groupsCount: groups.length,
        lastSync,
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { queueSize: 0, contactsCount: 0, groupsCount: 0, lastSync: null };
    }
  }
}

export const offlineStorage = new OfflineStorageService();