/**
 * Application state and UI-related type definitions
 */

import { Contact, ContactGroup, EnrichmentSuggestion, ViewType } from './contact';

// App State Types
export interface AppState {
  view: ViewType;
  query: string;
  contacts: Contact[];
  groups: ContactGroup[];
  suggestions: EnrichmentSuggestion[];
  activeGroup: string | null;
  isOnline: boolean;
  offlineQueue: any[]; // TODO: Type this properly
  showOfflineIndicator: boolean;
}

// Modal State Types
export interface ModalState {
  showAdd: boolean;
  showGroupManagement: boolean;
  showScanner: boolean;
}

// UI State Types
export interface UIState {
  editingContact: Contact | null;
  editingGroup: ContactGroup | null;
  viewingContact: Contact | null;
}

// Combined App Context State
export interface AppContextState extends AppState, ModalState, UIState {}

// Action Types for Context
export interface AppActions {
  // View actions
  setView: (view: ViewType) => void;
  setQuery: (query: string) => void;
  setActiveGroup: (group: string | null) => void;
  
  // Contact actions
  addContact: (payload: AddContactPayload) => void;
  updateContact: (contact: Contact) => void;
  deleteContact: (contactId: string) => void;
  toggleStar: (contactId: string) => void;
  
  // Group actions
  addGroup: (payload: AddGroupPayload) => void;
  updateGroup: (group: ContactGroup) => void;
  deleteGroup: (groupId: string) => void;
  
  // Suggestion actions
  resolveSuggestion: (suggestionId: string, action: 'accept' | 'reject') => void;
  
  // Modal actions
  setShowAdd: (show: boolean) => void;
  setShowGroupManagement: (show: boolean) => void;
  setShowScanner: (show: boolean) => void;
  setEditingContact: (contact: Contact | null) => void;
  setEditingGroup: (group: ContactGroup | null) => void;
  setViewingContact: (contact: Contact | null) => void;
}

// Payload Types
export interface AddContactPayload {
  name: string;
  identifier: string;
  company?: string;
  title?: string;
  note?: string;
  tags: string[];
  groups: string[];
}

export interface AddGroupPayload {
  name: string;
  type: 'event' | 'location' | 'custom';
  location?: string;
  description?: string;
  members?: string[];
}

// Computed Values Types
export interface ComputedValues {
  filteredContacts: Contact[];
  starredContacts: Contact[];
  recentContacts: Contact[];
  groupedContacts: Record<string, Contact[]>;
}

// Component Prop Types
export interface BaseComponentProps {
  className?: string;
  style?: any; // React Native StyleProp
  testID?: string;
}

// Event Handler Types
export type ContactActionHandler = (contactId: string) => void;
export type ContactEditHandler = (contact: Contact) => void;
export type GroupActionHandler = (groupId: string) => void;
export type GroupEditHandler = (group: ContactGroup) => void;

// Form Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FormField {
  name: string;
  value: string;
  required?: boolean;
  validation?: (value: string) => string | null;
}

// Performance Types
export interface PerformanceMetrics {
  renderTime: number;
  lastUpdate: number;
  componentUpdates: number;
}

// Theme Types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    error: string;
    warning: string;
    success: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
}