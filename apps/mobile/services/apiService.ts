/**
 * API Service for All My Circles Mobile App
 * Connects to the production backend with HubSpot integration
 */

import { devLog, devError } from '../utils/logger';
import type { Contact } from '../types/contact';

const API_BASE_URL = 'https://all-my-circles-web-ltp4.vercel.app/api';

export class ApiService {
  private deviceId: string | null = null;

  /**
   * Get the base URL for API requests
   */
  get baseUrl(): string {
    return API_BASE_URL.replace('/api', '');
  }

  /**
   * Initialize API service with device ID
   */
  async initialize(deviceId: string): Promise<void> {
    devLog('API Service initialize called with:', deviceId);
    this.deviceId = deviceId;
    devLog('API Service initialized, this.deviceId is now:', this.deviceId);
  }

  /**
   * Register mobile device
   */
  async registerDevice(email: string, deviceInfo: any): Promise<any> {
    try {
      devLog('API Service registerDevice called');
      devLog('this.deviceId value:', this.deviceId);
      devLog('typeof this.deviceId:', typeof this.deviceId);
      devLog('Attempting device registration with:', { email, deviceId: this.deviceId, deviceInfo });
      
      const response = await fetch(`${API_BASE_URL}/mobile/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          deviceId: this.deviceId,
          deviceInfo,
          firstName: deviceInfo.firstName,
          lastName: deviceInfo.lastName,
        }),
      });

      devLog('API Response status:', response.status, response.statusText);
      
      // Check if response has content
      const responseText = await response.text();
      devLog('API Response text:', responseText);
      
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        devError('JSON Parse error:', parseError instanceof Error ? parseError : new Error(String(parseError)));
        throw new Error(`Invalid response from server: ${responseText}`);
      }
      
      if (!response.ok) {
        throw new Error(data.error || `Device registration failed: ${response.status} ${response.statusText}`);
      }

      devLog('Device registered successfully:', data);
      return data;
    } catch (error) {
      devError('Device registration failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get device status
   */
  async getDeviceStatus(): Promise<any> {
    if (!this.deviceId) {
      throw new Error('Device ID not set');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/mobile/device`, {
        headers: {
          'x-device-id': this.deviceId,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get device status');
      }

      return data;
    } catch (error) {
      devError('Get device status failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Create contact and sync to backend/HubSpot
   */
  async createContact(contact: any): Promise<any> {
    if (!this.deviceId) {
      throw new Error('Device ID not set');
    }

    // Extract first name and last name from the contact
    const name = contact.name || '';
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Extract email and phone from identifiers
    const email = contact.identifiers?.find((id: any) => id.type === 'email')?.value || '';
    const phone = contact.identifiers?.find((id: any) => id.type === 'phone')?.value || '';

    try {
      const response = await fetch(`${API_BASE_URL}/mobile/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': this.deviceId,
        },
        body: JSON.stringify({
          name: contact.name,
          email: email,
          phone: phone,
          company: contact.company,
          title: contact.title,
          notes: contact.note,
          tags: contact.tags,
          groups: contact.groups,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create contact');
      }

      devLog('Contact created successfully:', data);
      return data;
    } catch (error) {
      devError('Create contact failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Add contact to mobile database (legacy method)
   */
  async addContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    if (!this.deviceId) {
      throw new Error('Device ID not set');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': this.deviceId,
        },
        body: JSON.stringify({
          first_name: contact.firstName,
          last_name: contact.lastName,
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
          job_title: contact.jobTitle,
          connection_strength: contact.connectionStrength,
          contact_value: contact.contactValue,
          first_met_location: contact.firstMetLocation,
          first_met_date: contact.firstMetDate,
          tags: contact.tags,
          notes: contact.notes,
          next_followup_date: contact.nextFollowupDate,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add contact');
      }

      devLog('Contact added successfully:', data);
      
      // Transform response to Contact type
      return {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        jobTitle: data.job_title,
        connectionStrength: data.connection_strength,
        contactValue: data.contact_value,
        firstMetLocation: data.first_met_location,
        firstMetDate: data.first_met_date,
        tags: data.tags || [],
        notes: data.notes,
        nextFollowupDate: data.next_followup_date,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        hubspotContactId: data.hubspot_contact_id,
      };
    } catch (error) {
      devError('Add contact failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get contacts for device
   */
  async getContacts(): Promise<Contact[]> {
    if (!this.deviceId) {
      throw new Error('Device ID not set');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/contacts`, {
        headers: {
          'x-device-id': this.deviceId,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get contacts');
      }

      // Transform response to Contact array
      return data.contacts.map((contact: any) => ({
        id: contact.id,
        firstName: contact.first_name,
        lastName: contact.last_name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        jobTitle: contact.job_title,
        connectionStrength: contact.connection_strength,
        contactValue: contact.contact_value,
        firstMetLocation: contact.first_met_location,
        firstMetDate: contact.first_met_date,
        tags: contact.tags || [],
        notes: contact.notes,
        nextFollowupDate: contact.next_followup_date,
        createdAt: contact.created_at,
        updatedAt: contact.updated_at,
        hubspotContactId: contact.hubspot_contact_id,
      }));
    } catch (error) {
      devError('Get contacts failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Sync contacts with HubSpot
   */
  async syncWithHubSpot(direction: 'mobile_to_hubspot' | 'hubspot_to_mobile' | 'bidirectional' = 'bidirectional'): Promise<any> {
    if (!this.deviceId) {
      throw new Error('Device ID not set');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/sync/hubspot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': this.deviceId,
        },
        body: JSON.stringify({
          direction,
          dryRun: false,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      devLog('HubSpot sync completed:', data);
      return data;
    } catch (error) {
      devError('HubSpot sync failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Initiate HubSpot OAuth flow
   */
  async initiateHubSpotOAuth(): Promise<string> {
    if (!this.deviceId) {
      throw new Error('Device ID not set');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/mobile/auth/hubspot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': this.deviceId,
        },
        body: JSON.stringify({
          redirectUrl: 'allmycircles://oauth-callback',
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate OAuth');
      }

      devLog('HubSpot OAuth URL generated:', data.authUrl);
      return data.authUrl;
    } catch (error) {
      devError('HubSpot OAuth initiation failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get sync status and dashboard data
   */
  async getDashboardData(): Promise<any> {
    if (!this.deviceId) {
      throw new Error('Device ID not set');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/hubspot/dashboard`, {
        headers: {
          'x-device-id': this.deviceId,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get dashboard data');
      }

      return data;
    } catch (error) {
      devError('Get dashboard data failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}

export const apiService = new ApiService();