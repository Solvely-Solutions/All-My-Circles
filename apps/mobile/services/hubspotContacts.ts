import { devLog, devError } from '../utils/logger';

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
   * Create a new contact in HubSpot
   */
  async createContact(contactData: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    title?: string;
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
          hubspot_owner_id: contactData.hubspotOwnerId || undefined,

          // All My Circles custom properties
          amc_connection_strength: contactData.connectionStrength || undefined,
          amc_contact_value: contactData.contactValue || undefined,
          amc_first_met_location: contactData.firstMetLocation || undefined,
          amc_first_met_date: contactData.firstMetDate || undefined,
          amc_networking_tags: contactData.tags ? contactData.tags.join(', ') : undefined,
          amc_networking_notes: contactData.notes || undefined,
          amc_last_interaction_date: contactData.lastInteractionDate || undefined,
          amc_next_followup_date: contactData.nextFollowupDate || undefined,
          amc_total_interactions: contactData.totalInteractions ? contactData.totalInteractions.toString() : '0',
          amc_contact_id: contactData.circlesContactId || undefined,
        }
      };

      // Remove undefined properties
      Object.keys(hubspotContact.properties).forEach(key => {
        if (hubspotContact.properties[key as keyof typeof hubspotContact.properties] === undefined) {
          delete hubspotContact.properties[key as keyof typeof hubspotContact.properties];
        }
      });

      devLog('Creating HubSpot contact:', hubspotContact);

      const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hubspotContact),
      });

      const responseData = await response.json();

      if (!response.ok) {
        devError('HubSpot contact creation failed:', responseData);
        return {
          success: false,
          error: responseData.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      devLog('HubSpot contact created successfully:', responseData);

      return {
        success: true,
        contact: responseData,
        hubspotId: responseData.id
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

      const response = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
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

      const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
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
}

export const hubspotContactsService = new HubSpotContactsService();