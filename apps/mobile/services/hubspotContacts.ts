import { devLog, devError } from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HubSpotContact {
  id?: string;
  properties: {
    // Standard HubSpot properties
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    company?: string;
    jobtitle?: string;
    hubspot_owner_id?: string;

    // All My Circles custom properties
    amc_connection_strength?: string;
    amc_contact_value?: string;
    amc_first_met_location?: string;
    amc_first_met_date?: string;
    amc_networking_tags?: string;
    amc_networking_notes?: string;
    amc_last_interaction_date?: string;
    amc_next_followup_date?: string;
    amc_total_interactions?: string;
    amc_contact_id?: string;
  };
}

export interface ContactCreateResult {
  success: boolean;
  contact?: HubSpotContact;
  error?: string;
  hubspotId?: string;
}

class HubSpotContactsService {
  private accessToken: string | null = null;
  private portalId: string | null = null;

  /**
   * Initialize the service with HubSpot access token
   */
  initialize(accessToken: string, portalId: string) {
    this.accessToken = accessToken;
    this.portalId = portalId;
    devLog('HubSpot Contacts Service initialized for portal:', portalId);
  }

  /**
   * Refresh the HubSpot access token when it expires
   */
  private async refreshAccessToken(): Promise<boolean> {
    try {
      const deviceId = await AsyncStorage.getItem('@allmycircles_device_id');
      if (!deviceId) {
        devError('Device ID not found, cannot refresh token');
        return false;
      }

      const response = await fetch('https://all-my-circles-web-ltp4.vercel.app/api/mobile/auth/hubspot/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-force-refresh': 'true', // Force refresh to handle expiration time mismatches
        },
        body: JSON.stringify({ deviceId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        devError('Token refresh failed:', response.status, errorText);
        return false;
      }

      const data = await response.json();
      devLog('Token refresh response:', data);

      if (data.accessToken) {
        this.accessToken = data.accessToken;
        devLog('HubSpot token refreshed successfully');
        return true;
      }

      devError('No access token in refresh response:', data);
      return false;
    } catch (error) {
      devError('Token refresh error:', error);
      return false;
    }
  }

  /**
   * Make an API call with automatic token refresh on expiration
   */
  private async makeAPICall(url: string, options: RequestInit, retryOnAuth = true): Promise<Response> {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    // If we get an authentication error and retryOnAuth is true, try to refresh the token
    if (!response.ok && retryOnAuth) {
      const responseData = await response.clone().json().catch(() => ({}));

      if (responseData.category === 'EXPIRED_AUTHENTICATION' || response.status === 401) {
        devLog('Token expired, attempting refresh...');

        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the original request with the new token
          return this.makeAPICall(url, options, false); // Don't retry again to avoid infinite loop
        }
      }
    }

    return response;
  }

  /**
   * Refresh the access token if it's expired
   */
  private async refreshAccessToken(): Promise<boolean> {
    try {
      const deviceId = await AsyncStorage.getItem('@allmycircles_device_id');
      if (!deviceId) {
        devError('Device ID not found, cannot refresh token');
        return false;
      }

      devLog('🔄 Refreshing HubSpot access token...');

      const response = await fetch('https://all-my-circles-web-ltp4.vercel.app/api/mobile/auth/hubspot/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-force-refresh': 'true', // Force refresh even if token seems valid
        },
        body: JSON.stringify({ deviceId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        devError('Token refresh failed:', errorData);
        return false;
      }

      const tokenData = await response.json();

      // Update our stored access token
      this.accessToken = tokenData.accessToken;
      await AsyncStorage.setItem('@hubspot_access_token', tokenData.accessToken);

      devLog('✅ HubSpot access token refreshed successfully');
      return true;

    } catch (error) {
      devError('Token refresh error:', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Make a HubSpot API call with automatic token refresh on 401 errors
   */
  private async makeHubSpotApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
    try {
      return await apiCall();
    } catch (error: any) {
      // Check if it's a 401 unauthorized error (expired token)
      if (error?.status === 401 || error?.message?.includes('expired') || error?.message?.includes('unauthorized')) {
        devLog('🔑 Access token expired, attempting refresh...');

        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the API call with the new token
          devLog('🔄 Retrying API call with refreshed token...');
          return await apiCall();
        } else {
          throw new Error('Failed to refresh access token. Please re-authenticate with HubSpot.');
        }
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Create a new contact in HubSpot
   */
  async createContact(contactData: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    title?: string;
    linkedinUrl?: string;
    notes?: string;
    createdByUserId?: string;
    createdByEmail?: string;
    hubspotOwnerId?: string;
    // All My Circles specific properties
    connectionStrength?: 'Strong' | 'Medium' | 'Weak';
    contactValue?: 'High' | 'Medium' | 'Low';
    firstMetLocation?: string;
    firstMetDate?: string;
    tags?: string[];
    lastInteractionDate?: string;
    nextFollowupDate?: string;
    totalInteractions?: number;
    circlesContactId?: string;
  }): Promise<ContactCreateResult> {
    if (!this.accessToken) {
      return {
        success: false,
        error: 'HubSpot Contacts Service not initialized. Call initialize() first.'
      };
    }

    try {
      // Split name into first and last name
      const nameParts = contactData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const hubspotContact: HubSpotContact = {
        properties: {
          // Standard HubSpot properties
          firstname: firstName,
          lastname: lastName,
          email: contactData.email || undefined,
          phone: contactData.phone || undefined,
          company: contactData.company || undefined,
          jobtitle: contactData.title || undefined,
          hs_linkedin_url: contactData.linkedinUrl || undefined,
          hubspot_owner_id: contactData.hubspotOwnerId || undefined,

          // All My Circles essential networking properties
          amc_first_met_location: contactData.firstMetLocation || undefined,
          amc_first_met_date: contactData.firstMetDate || undefined,
          amc_networking_tags: contactData.tags ? contactData.tags.join(', ') : undefined,
          amc_networking_notes: contactData.notes || undefined,
        }
      };

      // Remove undefined properties
      Object.keys(hubspotContact.properties).forEach(key => {
        if (hubspotContact.properties[key as keyof typeof hubspotContact.properties] === undefined) {
          delete hubspotContact.properties[key as keyof typeof hubspotContact.properties];
        }
      });

      devLog('Creating HubSpot contact with smart logic:', contactData);

      // Use smart creation endpoint with ownership logic
      const response = await fetch('https://all-my-circles-web-ltp4.vercel.app/api/hubspot/contacts/smart-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': await AsyncStorage.getItem('@allmycircles_device_id') || '',
        },
        body: JSON.stringify(contactData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        devError('Smart HubSpot contact creation failed:', responseData);
        return {
          success: false,
          error: responseData.error || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      devLog('Smart HubSpot contact creation result:', responseData);

      return {
        success: true,
        contact: responseData.contact,
        hubspotId: responseData.contactId,
        action: responseData.action
      };

    } catch (error) {
      devError('HubSpot contact creation error:', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Update an existing contact in HubSpot
   */
  async updateContact(contactId: string, contactData: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    title?: string;
    notes?: string;
    hubspotOwnerId?: string;
    // All My Circles specific properties
    connectionStrength?: 'Strong' | 'Medium' | 'Weak';
    contactValue?: 'High' | 'Medium' | 'Low';
    firstMetLocation?: string;
    firstMetDate?: string;
    tags?: string[];
    lastInteractionDate?: string;
    nextFollowupDate?: string;
    totalInteractions?: number;
    circlesContactId?: string;
  }): Promise<ContactCreateResult> {
    if (!this.accessToken) {
      return {
        success: false,
        error: 'HubSpot Contacts Service not initialized. Call initialize() first.'
      };
    }

    try {
      const properties: any = {};

      // Standard HubSpot properties
      if (contactData.name) {
        const nameParts = contactData.name.trim().split(' ');
        properties.firstname = nameParts[0] || '';
        properties.lastname = nameParts.slice(1).join(' ') || '';
      }

      if (contactData.email) properties.email = contactData.email;
      if (contactData.phone) properties.phone = contactData.phone;
      if (contactData.company) properties.company = contactData.company;
      if (contactData.title) properties.jobtitle = contactData.title;
      if (contactData.hubspotOwnerId) properties.hubspot_owner_id = contactData.hubspotOwnerId;

      // All My Circles custom properties
      if (contactData.connectionStrength) properties.amc_connection_strength = contactData.connectionStrength;
      if (contactData.contactValue) properties.amc_contact_value = contactData.contactValue;
      if (contactData.firstMetLocation) properties.amc_first_met_location = contactData.firstMetLocation;
      if (contactData.firstMetDate) properties.amc_first_met_date = contactData.firstMetDate;
      if (contactData.tags) properties.amc_networking_tags = contactData.tags.join(', ');
      if (contactData.notes) properties.amc_networking_notes = contactData.notes;
      if (contactData.lastInteractionDate) properties.amc_last_interaction_date = contactData.lastInteractionDate;
      if (contactData.nextFollowupDate) properties.amc_next_followup_date = contactData.nextFollowupDate;
      if (contactData.totalInteractions !== undefined) properties.amc_total_interactions = contactData.totalInteractions.toString();
      if (contactData.circlesContactId) properties.amc_contact_id = contactData.circlesContactId;

      const hubspotContact = { properties };

      devLog('Updating HubSpot contact:', contactId, hubspotContact);

      const response = await this.makeAPICall(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hubspotContact),
      });

      const responseData = await response.json();

      if (!response.ok) {
        devError('HubSpot contact update failed:', responseData);
        return {
          success: false,
          error: responseData.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      devLog('HubSpot contact updated successfully:', responseData);

      return {
        success: true,
        contact: responseData,
        hubspotId: responseData.id
      };

    } catch (error) {
      devError('HubSpot contact update error:', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Search for contacts by email
   */
  async searchContactByEmail(email: string): Promise<{ success: boolean; contact?: HubSpotContact; error?: string }> {
    if (!this.accessToken) {
      return {
        success: false,
        error: 'HubSpot Contacts Service not initialized. Call initialize() first.'
      };
    }

    try {
      const searchBody = {
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'email',
                operator: 'EQ',
                value: email
              }
            ]
          }
        ]
      };

      const response = await this.makeAPICall('https://api.hubapi.com/crm/v3/objects/contacts/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchBody),
      });

      const responseData = await response.json();

      if (!response.ok) {
        devError('HubSpot contact search failed:', responseData);
        return {
          success: false,
          error: responseData.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      if (responseData.results && responseData.results.length > 0) {
        return {
          success: true,
          contact: responseData.results[0]
        };
      }

      return {
        success: true,
        contact: undefined // No contact found
      };

    } catch (error) {
      devError('HubSpot contact search error:', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get contact by ID
   */
  async getContactById(contactId: string): Promise<{ success: boolean; contact?: HubSpotContact; error?: string }> {
    if (!this.accessToken) {
      return {
        success: false,
        error: 'HubSpot Contacts Service not initialized. Call initialize() first.'
      };
    }

    try {
      const response = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        devError('HubSpot get contact failed:', responseData);
        return {
          success: false,
          error: responseData.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      return {
        success: true,
        contact: responseData
      };

    } catch (error) {
      devError('HubSpot get contact error:', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Update an existing contact in HubSpot
   */
  async updateContact(contactId: string, contactData: {
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    company?: string;
    title?: string;
    notes?: string;
    tags?: string[];
    firstMetLocation?: string;
    firstMetDate?: string;
  }): Promise<ContactCreateResult> {
    if (!this.accessToken) {
      return {
        success: false,
        error: 'HubSpot Contacts Service not initialized. Call initialize() first.'
      };
    }

    try {
      devLog('Updating HubSpot contact:', contactId, contactData);

      // Use smart update endpoint
      const response = await fetch('https://all-my-circles-web-ltp4.vercel.app/api/hubspot/contacts/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': await AsyncStorage.getItem('@allmycircles_device_id') || '',
        },
        body: JSON.stringify({
          contactId,
          contactData
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        devError('HubSpot contact update failed:', responseData);
        return {
          success: false,
          error: responseData.error || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      devLog('HubSpot contact updated successfully:', responseData);

      return {
        success: true,
        contact: responseData.contact,
        hubspotId: contactId,
        updated: responseData.updated,
        updatedFields: responseData.updatedFields
      };

    } catch (error) {
      devError('HubSpot contact update error:', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      };
    }
  }
}

export const hubspotContactsService = new HubSpotContactsService();