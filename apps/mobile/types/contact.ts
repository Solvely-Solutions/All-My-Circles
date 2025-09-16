/**
 * TypeScript type definitions for professional networking
 */

export interface ContactIdentifier {
  type: 'email' | 'phone' | 'linkedin' | 'url';
  value: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  name?: string; // computed from firstName + lastName for backward compatibility
  email?: string;
  phone?: string;
  identifiers?: ContactIdentifier[];
  company?: string;
  jobTitle?: string;
  title?: string; // alias for jobTitle for backward compatibility
  city?: string;
  country?: string;
  connectionStrength?: 'Strong' | 'Medium' | 'Weak';
  contactValue?: 'High' | 'Medium' | 'Low';
  firstMetLocation?: string;
  firstMetDate?: string;
  lastInteractionDate?: string;
  nextFollowupDate?: string;
  totalInteractions?: number;
  groups?: string[];
  tags: string[];
  notes?: string;
  note?: string; // alias for notes for backward compatibility
  starred?: boolean;
  lastInteraction?: number; // timestamp in milliseconds
  imageUri?: string;
  createdAt?: string;
  updatedAt?: string;
  hubspotContactId?: string;

  // CRM sync tracking
  syncStatus?: 'none' | 'synced' | 'pending' | 'failed';
  lastSyncedAt?: string;
  syncError?: string;
  needsSync?: boolean; // Flag to indicate contact was edited and needs sync
}

export interface ContactGroup {
  id: string;
  name: string;
  type: 'event' | 'location' | 'custom' | 'conference' | 'client' | 'prospect' | 'team' | 'sales-meeting';
  location?: string;
  members: string[]; // Contact IDs
  description?: string;
  createdAt?: string;
}

export interface ContactSuggestion {
  id: string;
  contactId: string;
  field: keyof Contact;
  proposed: string;
  confidence: number; // 0-1 range
  source: 'ocr' | 'networking' | 'manual';
  createdAt: string;
}

// Legacy alias for backwards compatibility
export type EnrichmentSuggestion = ContactSuggestion;

// Form data types
export interface ContactFormData {
  name: string;
  identifier: string;
  company?: string;
  title?: string;
  note?: string;
  tags: string[];
  groups: string[];
}

export interface ExtractedContactData {
  name: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
}

// Offline queue types
export type OfflineAction =
  | 'create_contact'
  | 'update_contact'
  | 'delete_contact'
  | 'create_group'
  | 'edit_group'
  | 'delete_group'
  | 'sync_contact_to_hubspot'
  | 'update_hubspot_contact';

export interface OfflineQueueItem {
  id: string;
  action: OfflineAction;
  data: Contact | ContactGroup | { id: string } | ContactFormData;
  timestamp: string;
  retries: number;
}

// Contact filter and search types
export interface ContactFilters {
  query: string;
  group?: string;
  starred?: boolean;
  tags?: string[];
  hasEmail?: boolean;
  hasPhone?: boolean;
  hasLinkedIn?: boolean;
  company?: string;
  city?: string;
  country?: string;
  recentInteraction?: boolean; // Contacts interacted with in last 30 days
  sortBy?: 'name' | 'company' | 'lastInteraction' | 'created';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchHistory {
  recentSearches: string[];
  savedSearches: SavedSearch[];
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: ContactFilters;
  createdAt: string;
}

export type ViewMode = 'grid' | 'list' | 'timeline';

export type ViewType = "home" | "contacts" | "groups" | "inbox" | "recent";

// Import types
export interface ImportedContact {
  id: string;
  name: string;
  identifiers: ContactIdentifier[];
  company: string;
  title: string;
  city: string;
  country: string;
  note: string;
  tags: string[];
  groups: string[];
  starred: boolean;
  lastInteraction: number;
}

export interface ContactsImportResult {
  success: boolean;
  contacts: ImportedContact[];
  totalFound: number;
  error?: string;
}

// Error types
export interface ContactError {
  type: 'validation' | 'network' | 'storage' | 'permission';
  message: string;
  field?: keyof Contact;
  code?: string;
}