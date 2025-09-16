/**
 * CRM Integration Service for All My Circles
 * Provides unified interface for multiple CRM providers
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { devLog, devError } from '../utils/logger';
import type { 
  CRMConnection, 
  CRMProvider, 
  CRMPushRequest, 
  CRMPushResult,
  CRMSyncRequest,
  CRMSyncResult,
  CRMContact,
  CRMFieldMapping,
  SalesforceContact,
  HubSpotContact,
  PipedriveContact
} from '../types/crm';
import type { Contact } from '../types/contact';

const STORAGE_KEY = '@allmycircles_crm_connections';

class CRMService {
  private connections: Map<string, CRMConnection> = new Map();

  /**
   * Initialize CRM service with stored connections
   */
  async initialize(): Promise<void> {
    try {
      // Load saved CRM connections from storage
      const savedConnections = await this.loadConnectionsFromStorage();
      savedConnections.forEach(conn => {
        this.connections.set(conn.id, conn);
      });
      
      devLog(`CRM Service initialized with ${this.connections.size} connections`);
    } catch (error) {
      devError('Failed to initialize CRM service', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Add a new CRM connection
   */
  async addConnection(connection: Omit<CRMConnection, 'id' | 'createdAt'>, userId?: string): Promise<string> {
    const id = `crm_${connection.provider}_${userId || 'anonymous'}_${Date.now()}`;
    const fullConnection: CRMConnection = {
      ...connection,
      id,
      createdAt: new Date().toISOString(),
      // Store user association in the connection metadata
      metadata: {
        ...(connection.metadata || {}),
        userId: userId,
      }
    };

    // Test the connection before saving
    const isValid = await this.testConnection(fullConnection);
    if (!isValid) {
      throw new Error('CRM connection test failed. Please check your credentials.');
    }

    this.connections.set(id, fullConnection);
    await this.saveConnectionsToStorage();

    devLog(`Added CRM connection: ${connection.provider} - ${connection.name} for user: ${userId || 'anonymous'}`);
    return id;
  }

  /**
   * Get all CRM connections
   */
  getConnections(): CRMConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get active CRM connections
   */
  getActiveConnections(): CRMConnection[] {
    return this.getConnections().filter(conn => conn.isActive);
  }

  /**
   * Remove all connections (for testing)
   */
  async clearAllConnections(): Promise<void> {
    this.connections.clear();
    await this.saveConnectionsToStorage();
    devLog('All CRM connections cleared');
  }

  /**
   * Remove a specific connection
   */
  async removeConnection(connectionId: string): Promise<boolean> {
    const removed = this.connections.delete(connectionId);
    if (removed) {
      await this.saveConnectionsToStorage();
      devLog(`CRM connection removed: ${connectionId}`);
    }
    return removed;
  }

  /**
   * Test CRM connection
   */
  async testConnection(connection: CRMConnection): Promise<boolean> {
    try {
      switch (connection.provider) {
        case 'salesforce':
          return await this.testSalesforceConnection(connection);
        case 'hubspot':
          return await this.testHubSpotConnection(connection);
        case 'pipedrive':
          return await this.testPipedriveConnection(connection);
        case 'webhook':
          return await this.testWebhookConnection(connection);
        default:
          return false;
      }
    } catch (error) {
      devError(`CRM connection test failed for ${connection.provider}`, error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Push contacts to CRM
   */
  async pushContacts(request: CRMPushRequest): Promise<CRMPushResult> {
    const connection = this.connections.get(request.connectionId);
    if (!connection) {
      throw new Error('CRM connection not found');
    }

    if (!connection.isActive) {
      throw new Error('CRM connection is not active');
    }

    try {
      switch (connection.provider) {
        case 'salesforce':
          return await this.pushToSalesforce(request, connection);
        case 'hubspot':
          return await this.pushToHubSpot(request, connection);
        case 'pipedrive':
          return await this.pushToPipedrive(request, connection);
        case 'webhook':
          return await this.pushToWebhook(request, connection);
        default:
          throw new Error(`Unsupported CRM provider: ${connection.provider}`);
      }
    } catch (error) {
      devError(`Failed to push contacts to ${connection.provider}`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Transform contact data using field mappings
   */
  private transformContact(contact: Contact, mappings: CRMFieldMapping[]): CRMContact {
    const transformed: CRMContact = {};

    mappings.forEach(mapping => {
      const localValue = contact[mapping.localField];
      if (localValue !== undefined && localValue !== null) {
        let transformedValue = localValue;

        // Apply transformations
        if (mapping.transform && typeof localValue === 'string') {
          switch (mapping.transform) {
            case 'uppercase':
              transformedValue = localValue.toUpperCase();
              break;
            case 'lowercase':
              transformedValue = localValue.toLowerCase();
              break;
            case 'phone_format':
              transformedValue = this.formatPhoneNumber(localValue);
              break;
          }
        }

        (transformed as any)[mapping.crmField] = transformedValue;
      }
    });

    return transformed;
  }

  /**
   * Format phone number for CRM
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for US numbers
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone; // Return original if not standard US format
  }

  // Provider-specific implementations

  private async testSalesforceConnection(connection: CRMConnection): Promise<boolean> {
    // Mock implementation for testing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate connection success if credentials are provided
    const hasCredentials = connection.credentials.salesforceAccessToken && 
                          connection.credentials.salesforceInstanceUrl;
    
    devLog(`Testing Salesforce connection: ${hasCredentials ? 'Success' : 'Failed'}`);
    return Boolean(hasCredentials);
  }

  private async testHubSpotConnection(connection: CRMConnection): Promise<boolean> {
    // Mock implementation for testing
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate connection success if credentials are provided
    const hasCredentials = connection.credentials.hubspotAccessToken;
    
    devLog(`Testing HubSpot connection: ${hasCredentials ? 'Success' : 'Failed'}`);
    return Boolean(hasCredentials);
  }

  private async testPipedriveConnection(connection: CRMConnection): Promise<boolean> {
    // Mock implementation for testing
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Simulate connection success if credentials are provided
    const hasCredentials = connection.credentials.pipedriveApiToken && 
                          connection.credentials.pipedriveDomain;
    
    devLog(`Testing Pipedrive connection: ${hasCredentials ? 'Success' : 'Failed'}`);
    return Boolean(hasCredentials);
  }

  private async testWebhookConnection(connection: CRMConnection): Promise<boolean> {
    // Mock implementation for testing
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Simulate connection success if webhook URL is provided
    const hasCredentials = Boolean(connection.credentials.webhookUrl);
    
    devLog(`Testing Webhook connection: ${hasCredentials ? 'Success' : 'Failed'}`);
    return hasCredentials;
  }

  private async pushToSalesforce(request: CRMPushRequest, connection: CRMConnection): Promise<CRMPushResult> {
    // Mock implementation for testing
    const result: CRMPushResult = {
      success: true,
      totalContacts: request.contacts.length,
      successfulPushes: 0,
      failedPushes: 0,
      errors: [],
      crmContacts: [],
    };

    // Simulate processing with delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    for (const contact of request.contacts) {
      // Simulate 90% success rate
      const isSuccessful = Math.random() > 0.1;
      
      if (isSuccessful) {
        result.successfulPushes++;
        result.crmContacts.push({
          localId: contact.id,
          crmId: `sf_${Math.random().toString(36).substr(2, 9)}`,
          success: true,
          url: `https://mock-salesforce.com/contact/${contact.id}`,
        });
      } else {
        result.failedPushes++;
        result.errors.push({
          contactId: contact.id,
          error: 'Mock Salesforce error: Email already exists',
          code: 'DUPLICATE_VALUE',
        });
      }
    }

    result.success = result.errors.length === 0;
    devLog(`Salesforce mock push: ${result.successfulPushes}/${result.totalContacts} successful`);
    return result;
  }

  private async pushToHubSpot(request: CRMPushRequest, connection: CRMConnection): Promise<CRMPushResult> {
    // Mock implementation for testing (HubSpot Marketplace app will handle real integration)
    const result: CRMPushResult = {
      success: true,
      totalContacts: request.contacts.length,
      successfulPushes: 0,
      failedPushes: 0,
      errors: [],
      crmContacts: [],
    };

    // Simulate processing with realistic delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    for (const contact of request.contacts) {
      // Simulate 85% success rate (slightly lower than Salesforce to show variety)
      const isSuccessful = Math.random() > 0.15;
      
      if (isSuccessful) {
        result.successfulPushes++;
        result.crmContacts.push({
          localId: contact.id,
          crmId: `hs_${Math.random().toString(36).substr(2, 9)}`,
          success: true,
          url: `https://app.hubspot.com/contacts/mock-portal/contact/${contact.id}`,
        });
      } else {
        result.failedPushes++;
        result.errors.push({
          contactId: contact.id,
          error: 'Mock HubSpot error: Invalid email format',
          code: 'INVALID_EMAIL',
        });
      }
    }

    result.success = result.errors.length === 0;
    devLog(`HubSpot mock push: ${result.successfulPushes}/${result.totalContacts} successful`);
    return result;
  }

  private async pushToPipedrive(request: CRMPushRequest, connection: CRMConnection): Promise<CRMPushResult> {
    // Mock implementation for testing
    const result: CRMPushResult = {
      success: true,
      totalContacts: request.contacts.length,
      successfulPushes: 0,
      failedPushes: 0,
      errors: [],
      crmContacts: [],
    };

    // Simulate processing with delay
    await new Promise(resolve => setTimeout(resolve, 1800));

    for (const contact of request.contacts) {
      // Simulate 95% success rate (Pipedrive typically has fewer validation issues)
      const isSuccessful = Math.random() > 0.05;
      
      if (isSuccessful) {
        result.successfulPushes++;
        result.crmContacts.push({
          localId: contact.id,
          crmId: `pd_${Math.random().toString(36).substr(2, 9)}`,
          success: true,
          url: `https://mock-pipedrive.com/person/${contact.id}`,
        });
      } else {
        result.failedPushes++;
        result.errors.push({
          contactId: contact.id,
          error: 'Mock Pipedrive error: Required field missing',
          code: 'REQUIRED_FIELD',
        });
      }
    }

    result.success = result.errors.length === 0;
    devLog(`Pipedrive mock push: ${result.successfulPushes}/${result.totalContacts} successful`);
    return result;
  }

  private async pushToWebhook(request: CRMPushRequest, connection: CRMConnection): Promise<CRMPushResult> {
    // Mock implementation for testing
    const result: CRMPushResult = {
      success: true,
      totalContacts: request.contacts.length,
      successfulPushes: 0,
      failedPushes: 0,
      errors: [],
      crmContacts: [],
    };

    // Simulate webhook processing with delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    for (const contact of request.contacts) {
      // Simulate webhook success (depends on external system reliability)
      const isSuccessful = Math.random() > 0.2; // 80% success rate
      
      if (isSuccessful) {
        result.successfulPushes++;
        result.crmContacts.push({
          localId: contact.id,
          crmId: `wh_${Math.random().toString(36).substr(2, 9)}`,
          success: true,
          url: connection.credentials.webhookUrl,
        });
      } else {
        result.failedPushes++;
        result.errors.push({
          contactId: contact.id,
          error: 'Mock Webhook error: Timeout or server unavailable',
          code: 'WEBHOOK_TIMEOUT',
        });
      }
    }

    result.success = result.errors.length === 0;
    devLog(`Webhook mock push: ${result.successfulPushes}/${result.totalContacts} successful`);
    return result;
  }

  // Storage methods (implement with AsyncStorage or your storage service)

  private async loadConnectionsFromStorage(): Promise<CRMConnection[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const connections: CRMConnection[] = JSON.parse(stored);
        devLog(`Loaded ${connections.length} CRM connections from storage`);
        return connections;
      }
      return [];
    } catch (error) {
      devError('Failed to load CRM connections from storage', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  private async saveConnectionsToStorage(): Promise<void> {
    try {
      const connections = Array.from(this.connections.values());
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
      devLog(`Saved ${connections.length} CRM connections to storage`);
    } catch (error) {
      devError('Failed to save CRM connections', error instanceof Error ? error : new Error(String(error)));
    }
  }
}

export const crmService = new CRMService();