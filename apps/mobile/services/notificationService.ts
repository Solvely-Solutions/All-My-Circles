import { devLog, devError } from '../utils/logger';

export interface SyncNotification {
  type: 'contact_updated' | 'contact_created' | 'contact_deleted';
  contactId: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  timestamp: Date;
  source: 'hubspot' | 'mobile';
}

class NotificationService {
  private notifications: SyncNotification[] = [];
  private listeners: Array<(notification: SyncNotification) => void> = [];

  /**
   * Add a notification to the queue
   */
  addNotification(notification: SyncNotification) {
    devLog('Adding notification:', notification);
    this.notifications.push(notification);

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        devError('Notification listener error:', error instanceof Error ? error : new Error(String(error)));
      }
    });

    // Keep only the last 50 notifications to prevent memory issues
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(-50);
    }
  }

  /**
   * Subscribe to notification events
   */
  subscribe(listener: (notification: SyncNotification) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get recent notifications
   */
  getRecentNotifications(limit: number = 10): SyncNotification[] {
    return this.notifications.slice(-limit).reverse();
  }

  /**
   * Clear all notifications
   */
  clearNotifications() {
    this.notifications = [];
    devLog('Notifications cleared');
  }

  /**
   * Simulate a HubSpot webhook notification
   * In a real implementation, this would be triggered by a webhook or websocket
   */
  simulateHubSpotUpdate(contactId: string, field: string, oldValue: any, newValue: any) {
    this.addNotification({
      type: 'contact_updated',
      contactId,
      changes: [{
        field,
        oldValue,
        newValue
      }],
      timestamp: new Date(),
      source: 'hubspot'
    });
  }

  /**
   * Handle mobile app contact updates
   */
  notifyContactUpdated(contactId: string, changes: { field: string; oldValue: any; newValue: any }[]) {
    this.addNotification({
      type: 'contact_updated',
      contactId,
      changes,
      timestamp: new Date(),
      source: 'mobile'
    });
  }

  /**
   * Handle mobile app contact creation
   */
  notifyContactCreated(contactId: string) {
    this.addNotification({
      type: 'contact_created',
      contactId,
      timestamp: new Date(),
      source: 'mobile'
    });
  }

  /**
   * Handle mobile app contact deletion
   */
  notifyContactDeleted(contactId: string) {
    this.addNotification({
      type: 'contact_deleted',
      contactId,
      timestamp: new Date(),
      source: 'mobile'
    });
  }

  /**
   * Get a formatted message for a notification
   */
  getNotificationMessage(notification: SyncNotification): string {
    const timeStr = notification.timestamp.toLocaleTimeString();

    switch (notification.type) {
      case 'contact_created':
        return `Contact created from ${notification.source} at ${timeStr}`;

      case 'contact_deleted':
        return `Contact deleted from ${notification.source} at ${timeStr}`;

      case 'contact_updated':
        if (notification.changes && notification.changes.length > 0) {
          const fieldNames = notification.changes.map(c => c.field).join(', ');
          return `Contact updated from ${notification.source}: ${fieldNames} changed at ${timeStr}`;
        }
        return `Contact updated from ${notification.source} at ${timeStr}`;

      default:
        return `Unknown notification from ${notification.source} at ${timeStr}`;
    }
  }

  /**
   * Check if there are any unread notifications
   */
  hasUnreadNotifications(): boolean {
    // In a real implementation, you'd track read/unread status
    return this.notifications.length > 0;
  }

  /**
   * Get notification count by type
   */
  getNotificationCounts(): {
    total: number;
    updates: number;
    creates: number;
    deletes: number;
    hubspot: number;
    mobile: number;
  } {
    return {
      total: this.notifications.length,
      updates: this.notifications.filter(n => n.type === 'contact_updated').length,
      creates: this.notifications.filter(n => n.type === 'contact_created').length,
      deletes: this.notifications.filter(n => n.type === 'contact_deleted').length,
      hubspot: this.notifications.filter(n => n.source === 'hubspot').length,
      mobile: this.notifications.filter(n => n.source === 'mobile').length,
    };
  }
}

export const notificationService = new NotificationService();