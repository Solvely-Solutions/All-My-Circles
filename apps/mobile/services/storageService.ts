/**
 * Local data persistence service using AsyncStorage
 * Handles saving and loading of app data with error handling and validation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Contact, ContactGroup, EnrichmentSuggestion, ContactFilters } from '../types/contact';
import { devLog, devError } from '../utils/config';

// Storage keys
const STORAGE_KEYS = {
  CONTACTS: '@circles/contacts',
  GROUPS: '@circles/groups',
  SUGGESTIONS: '@circles/suggestions',
  FILTERS: '@circles/filters',
  APP_STATE: '@circles/app_state',
  USER_PREFERENCES: '@circles/user_preferences',
  OFFLINE_QUEUE: '@circles/offline_queue',
  LAST_SYNC: '@circles/last_sync',
} as const;

// App state data structure for persistence
interface PersistedAppState {
  contacts: Contact[];
  groups: ContactGroup[];
  suggestions: EnrichmentSuggestion[];
  filters: ContactFilters;
  lastUpdated: number;
  version: string;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultView: string;
  notifications: boolean;
  lastUpdated: number;
}

interface OfflineQueueItem {
  id: string;
  type: "add_contact" | "edit_contact" | "delete_contact" | "add_group" | "edit_group" | "delete_group";
  payload: any;
  timestamp: number;
  status: "pending" | "syncing" | "failed";
  retryCount?: number;
}

/**
 * Validates that data structure matches expected format
 */
function validateContacts(data: any): data is Contact[] {
  if (!Array.isArray(data)) return false;
  return data.every(contact => 
    contact &&
    typeof contact === 'object' &&
    typeof contact.id === 'string' &&
    typeof contact.name === 'string' &&
    Array.isArray(contact.identifiers) &&
    Array.isArray(contact.groups) &&
    Array.isArray(contact.tags) &&
    typeof contact.starred === 'boolean'
  );
}

function validateGroups(data: any): data is ContactGroup[] {
  if (!Array.isArray(data)) return false;
  return data.every(group =>
    group &&
    typeof group === 'object' &&
    typeof group.id === 'string' &&
    typeof group.name === 'string' &&
    typeof group.type === 'string' &&
    Array.isArray(group.members)
  );
}

function validateSuggestions(data: any): data is EnrichmentSuggestion[] {
  if (!Array.isArray(data)) return false;
  return data.every(suggestion =>
    suggestion &&
    typeof suggestion === 'object' &&
    typeof suggestion.id === 'string' &&
    typeof suggestion.contactId === 'string' &&
    typeof suggestion.field === 'string' &&
    typeof suggestion.proposed === 'string'
  );
}

/**
 * Generic storage operations with error handling
 */
class StorageService {
  /**
   * Safely store data in AsyncStorage
   */
  private async setItem<T>(key: string, data: T): Promise<boolean> {
    try {
      const jsonString = JSON.stringify(data);
      await AsyncStorage.setItem(key, jsonString);
      devLog(`Successfully saved data to ${key}`, { dataSize: jsonString.length });
      return true;
    } catch (error) {
      devError(`Failed to save data to ${key}`, error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Safely retrieve and parse data from AsyncStorage
   */
  private async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonString = await AsyncStorage.getItem(key);
      if (jsonString === null) {
        devLog(`No data found for ${key}`);
        return null;
      }

      const data = JSON.parse(jsonString) as T;
      devLog(`Successfully loaded data from ${key}`, { dataSize: jsonString.length });
      return data;
    } catch (error) {
      devError(`Failed to load data from ${key}`, error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * Remove data from AsyncStorage
   */
  private async removeItem(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      devLog(`Successfully removed data from ${key}`);
      return true;
    } catch (error) {
      devError(`Failed to remove data from ${key}`, error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Save contacts to local storage
   */
  async saveContacts(contacts: Contact[]): Promise<boolean> {
    if (!validateContacts(contacts)) {
      devError('Invalid contacts data format', new Error('Contacts validation failed'));
      return false;
    }
    return this.setItem(STORAGE_KEYS.CONTACTS, contacts);
  }

  /**
   * Load contacts from local storage
   */
  async loadContacts(): Promise<Contact[] | null> {
    const data = await this.getItem<Contact[]>(STORAGE_KEYS.CONTACTS);
    if (data && validateContacts(data)) {
      return data;
    }
    if (data) {
      devError('Loaded contacts data is invalid', new Error('Contacts validation failed'));
    }
    return null;
  }

  /**
   * Save contact groups to local storage
   */
  async saveGroups(groups: ContactGroup[]): Promise<boolean> {
    if (!validateGroups(groups)) {
      devError('Invalid groups data format', new Error('Groups validation failed'));
      return false;
    }
    return this.setItem(STORAGE_KEYS.GROUPS, groups);
  }

  /**
   * Load contact groups from local storage
   */
  async loadGroups(): Promise<ContactGroup[] | null> {
    const data = await this.getItem<ContactGroup[]>(STORAGE_KEYS.GROUPS);
    if (data && validateGroups(data)) {
      return data;
    }
    if (data) {
      devError('Loaded groups data is invalid', new Error('Groups validation failed'));
    }
    return null;
  }

  /**
   * Save enrichment suggestions to local storage
   */
  async saveSuggestions(suggestions: EnrichmentSuggestion[]): Promise<boolean> {
    if (!validateSuggestions(suggestions)) {
      devError('Invalid suggestions data format', new Error('Suggestions validation failed'));
      return false;
    }
    return this.setItem(STORAGE_KEYS.SUGGESTIONS, suggestions);
  }

  /**
   * Load enrichment suggestions from local storage
   */
  async loadSuggestions(): Promise<EnrichmentSuggestion[] | null> {
    const data = await this.getItem<EnrichmentSuggestion[]>(STORAGE_KEYS.SUGGESTIONS);
    if (data && validateSuggestions(data)) {
      return data;
    }
    if (data) {
      devError('Loaded suggestions data is invalid', new Error('Suggestions validation failed'));
    }
    return null;
  }

  /**
   * Save current filter settings
   */
  async saveFilters(filters: ContactFilters): Promise<boolean> {
    return this.setItem(STORAGE_KEYS.FILTERS, filters);
  }

  /**
   * Load filter settings
   */
  async loadFilters(): Promise<ContactFilters | null> {
    return this.getItem<ContactFilters>(STORAGE_KEYS.FILTERS);
  }

  /**
   * Save complete app state in one operation
   */
  async saveAppState(state: {
    contacts: Contact[];
    groups: ContactGroup[];
    suggestions: EnrichmentSuggestion[];
    filters: ContactFilters;
  }): Promise<boolean> {
    const persistedState: PersistedAppState = {
      ...state,
      lastUpdated: Date.now(),
      version: '1.0.0', // App version for future migrations
    };

    return this.setItem(STORAGE_KEYS.APP_STATE, persistedState);
  }

  /**
   * Load complete app state
   */
  async loadAppState(): Promise<PersistedAppState | null> {
    const data = await this.getItem<PersistedAppState>(STORAGE_KEYS.APP_STATE);
    
    if (data) {
      // Validate data integrity
      const isValid = 
        validateContacts(data.contacts) &&
        validateGroups(data.groups) &&
        validateSuggestions(data.suggestions) &&
        data.filters &&
        typeof data.lastUpdated === 'number';

      if (isValid) {
        return data;
      } else {
        devError('Loaded app state is invalid', new Error('App state validation failed'));
      }
    }
    
    return null;
  }

  /**
   * Save user preferences
   */
  async saveUserPreferences(preferences: Partial<UserPreferences>): Promise<boolean> {
    const current = await this.loadUserPreferences();
    const updated: UserPreferences = {
      theme: 'system',
      defaultView: 'home',
      notifications: true,
      lastUpdated: Date.now(),
      ...current,
      ...preferences,
    };

    return this.setItem(STORAGE_KEYS.USER_PREFERENCES, updated);
  }

  /**
   * Load user preferences
   */
  async loadUserPreferences(): Promise<UserPreferences | null> {
    return this.getItem<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES);
  }

  /**
   * Clear all app data (for logout or reset)
   */
  async clearAllData(): Promise<boolean> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await Promise.all(keys.map(key => this.removeItem(key)));
      devLog('Successfully cleared all app data');
      return true;
    } catch (error) {
      devError('Failed to clear all app data', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageInfo(): Promise<{
    keys: string[];
    totalSize: number;
    itemSizes: Record<string, number>;
  } | null> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(key => key.startsWith('@circles/'));
      
      const itemSizes: Record<string, number> = {};
      let totalSize = 0;

      for (const key of appKeys) {
        const value = await AsyncStorage.getItem(key);
        const size = value ? value.length : 0;
        itemSizes[key] = size;
        totalSize += size;
      }

      return {
        keys: appKeys,
        totalSize,
        itemSizes,
      };
    } catch (error) {
      devError('Failed to get storage info', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * Backup data to a JSON string (for export)
   */
  async exportData(): Promise<string | null> {
    try {
      const appState = await this.loadAppState();
      const userPreferences = await this.loadUserPreferences();
      
      if (!appState) {
        return null;
      }

      const backup = {
        appState,
        userPreferences,
        exportedAt: Date.now(),
        version: '1.0.0',
      };

      return JSON.stringify(backup, null, 2);
    } catch (error) {
      devError('Failed to export data', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * Restore data from a JSON string (for import)
   */
  async importData(jsonString: string): Promise<boolean> {
    try {
      const backup = JSON.parse(jsonString);
      
      if (!backup.appState || !backup.version) {
        devError('Invalid backup format', new Error('Backup validation failed'));
        return false;
      }

      // Save the imported data
      const success = await this.saveAppState(backup.appState);
      
      if (success && backup.userPreferences) {
        await this.saveUserPreferences(backup.userPreferences);
      }

      if (success) {
        devLog('Successfully imported data', { 
          contacts: backup.appState.contacts.length,
          groups: backup.appState.groups.length 
        });
      }

      return success;
    } catch (error) {
      devError('Failed to import data', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  // ============ OFFLINE QUEUE METHODS ============

  /**
   * Get all items from the offline queue
   */
  async getOfflineQueue(): Promise<OfflineQueueItem[]> {
    const data = await this.getItem<OfflineQueueItem[]>(STORAGE_KEYS.OFFLINE_QUEUE);
    return data || [];
  }

  /**
   * Add an item to the offline queue
   */
  async addToOfflineQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp'>): Promise<boolean> {
    try {
      const queue = await this.getOfflineQueue();
      const newItem: OfflineQueueItem = {
        ...item,
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
      };
      
      queue.push(newItem);
      const success = await this.setItem(STORAGE_KEYS.OFFLINE_QUEUE, queue);
      
      if (success) {
        devLog('Added item to offline queue', { type: item.type, queueSize: queue.length });
      }
      
      return success;
    } catch (error) {
      devError('Failed to add to offline queue', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Update the status of a queue item
   */
  async updateQueueItemStatus(
    itemId: string, 
    status: OfflineQueueItem['status'], 
    retryCount?: number
  ): Promise<boolean> {
    try {
      const queue = await this.getOfflineQueue();
      const itemIndex = queue.findIndex(item => item.id === itemId);
      
      if (itemIndex !== -1) {
        queue[itemIndex].status = status;
        if (retryCount !== undefined) {
          queue[itemIndex].retryCount = retryCount;
        }
        
        const success = await this.setItem(STORAGE_KEYS.OFFLINE_QUEUE, queue);
        
        if (success) {
          devLog('Updated queue item status', { itemId, status, retryCount });
        }
        
        return success;
      }
      
      return false;
    } catch (error) {
      devError('Failed to update queue item status', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Remove an item from the offline queue
   */
  async removeFromOfflineQueue(itemId: string): Promise<boolean> {
    try {
      const queue = await this.getOfflineQueue();
      const filteredQueue = queue.filter(item => item.id !== itemId);
      
      const success = await this.setItem(STORAGE_KEYS.OFFLINE_QUEUE, filteredQueue);
      
      if (success) {
        devLog('Removed item from offline queue', { itemId, queueSize: filteredQueue.length });
      }
      
      return success;
    } catch (error) {
      devError('Failed to remove from offline queue', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Clear the entire offline queue
   */
  async clearOfflineQueue(): Promise<boolean> {
    const success = await this.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
    
    if (success) {
      devLog('Cleared offline queue');
    }
    
    return success;
  }

  /**
   * Get offline queue statistics
   */
  async getQueueStatus(): Promise<{
    pending: number;
    syncing: number;
    failed: number;
    total: number;
  }> {
    try {
      const queue = await this.getOfflineQueue();
      return {
        pending: queue.filter(item => item.status === 'pending').length,
        syncing: queue.filter(item => item.status === 'syncing').length,
        failed: queue.filter(item => item.status === 'failed').length,
        total: queue.length,
      };
    } catch (error) {
      devError('Failed to get queue status', error instanceof Error ? error : new Error(String(error)));
      return { pending: 0, syncing: 0, failed: 0, total: 0 };
    }
  }

  /**
   * Set the last sync timestamp
   */
  async setLastSyncTime(timestamp: number): Promise<boolean> {
    return this.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
  }

  /**
   * Get the last sync timestamp
   */
  async getLastSyncTime(): Promise<number | null> {
    return this.getItem<number>(STORAGE_KEYS.LAST_SYNC);
  }
}

// Export singleton instance
export const storageService = new StorageService();

// Export types for use in other modules
export type { PersistedAppState, UserPreferences, OfflineQueueItem };