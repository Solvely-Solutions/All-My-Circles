/**
 * CRM Integration Types for All My Circles
 */

export type CRMProvider = 'salesforce' | 'hubspot' | 'pipedrive' | 'webhook';

export interface CRMConnection {
  id: string;
  provider: CRMProvider;
  name: string; // User-defined name for this connection
  isActive: boolean;
  credentials: CRMCredentials;
  fieldMappings: CRMFieldMapping[];
  lastSync?: string;
  createdAt: string;
  metadata?: Record<string, any>; // For storing additional data like userId
}

export interface CRMCredentials {
  // Salesforce
  salesforceInstanceUrl?: string;
  salesforceAccessToken?: string;
  salesforceRefreshToken?: string;
  
  // HubSpot
  hubspotAccessToken?: string;
  hubspotRefreshToken?: string;
  hubspotPortalId?: string;
  
  // Pipedrive
  pipedriveApiToken?: string;
  pipedriveDomain?: string;
  
  // Generic webhook
  webhookUrl?: string;
  webhookHeaders?: Record<string, string>;
}

export interface CRMFieldMapping {
  localField: keyof Contact; // Field from our Contact interface
  crmField: string; // Field name in the CRM system
  isRequired: boolean;
  transform?: 'none' | 'uppercase' | 'lowercase' | 'phone_format';
}

export interface CRMContact {
  id?: string; // CRM's internal ID
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  city?: string;
  country?: string;
  linkedinUrl?: string;
  notes?: string;
  customFields?: Record<string, any>;
}

export interface CRMPushRequest {
  contacts: Contact[];
  connectionId: string;
  createAsLead?: boolean; // For sales CRMs, create as lead vs contact
  assignToUser?: string; // CRM user ID to assign to
  addToList?: string; // CRM list/campaign ID
}

export interface CRMPushResult {
  success: boolean;
  totalContacts: number;
  successfulPushes: number;
  failedPushes: number;
  errors: CRMError[];
  crmContacts: CRMContactResult[];
}

export interface CRMContactResult {
  localId: string; // Our contact ID
  crmId?: string; // CRM's contact ID
  success: boolean;
  error?: string;
  url?: string; // Direct link to contact in CRM
}

export interface CRMError {
  contactId: string;
  error: string;
  code?: string;
}

export interface CRMSyncRequest {
  connectionId: string;
  direction: 'push' | 'pull' | 'bidirectional';
  lastSyncTimestamp?: string;
  filterCriteria?: CRMSyncFilter;
}

export interface CRMSyncFilter {
  modifiedAfter?: string;
  contactOwner?: string;
  tags?: string[];
}

export interface CRMSyncResult {
  success: boolean;
  direction: 'push' | 'pull' | 'bidirectional';
  contactsProcessed: number;
  contactsCreated: number;
  contactsUpdated: number;
  errors: CRMError[];
  lastSyncTimestamp: string;
}

// Provider-specific interfaces

// Salesforce
export interface SalesforceContact {
  Id?: string;
  FirstName?: string;
  LastName: string;
  Email?: string;
  Phone?: string;
  Account?: {
    Name?: string;
  };
  Title?: string;
  MailingCity?: string;
  MailingCountry?: string;
  Description?: string;
  [key: string]: any; // Custom fields
}

// HubSpot
export interface HubSpotContact {
  id?: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    company?: string;
    jobtitle?: string;
    city?: string;
    country?: string;
    linkedin_bio?: string;
    notes_last_contacted?: string;
    [key: string]: any; // Custom properties
  };
}

// Pipedrive
export interface PipedriveContact {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  org_name?: string;
  job_title?: string;
  address_locality?: string;
  address_country?: string;
  [key: string]: any; // Custom fields
}

// Import our Contact type
import type { Contact } from './contact';