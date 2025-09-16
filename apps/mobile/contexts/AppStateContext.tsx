/**
 * @fileoverview Application State Context - Centralized state management for All My Circles
 * 
 * This context provides global state management for the entire application, handling:
 * - Professional contact data and operations
 * - Group management (conferences, clients, prospects, teams)
 * - UI state (modals, views, editing states)
 * - Offline queue for data synchronization
 * - CRM integration and sync management
 * 
 * @author All My All My Circles Development Team
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect, useCallback } from 'react';
import { Contact, ContactGroup, EnrichmentSuggestion, ViewType, ContactFilters, ImportedContact, SearchHistory } from '../types/contact';
// Mock data removed - now using real data from backend
import { storageService, OfflineQueueItem } from '../services/storageService';
import { syncService } from '../services/syncService';



/**
 * Main application state interface containing all global state
 * @interface AppState
 */
interface AppState {
  // View state
  /** Current active view in the application */
  view: ViewType;
  /** Search query string for filtering contacts */
  query: string;
  /** Current active filters */
  filters: ContactFilters;
  /** Whether the filter modal is visible */
  showFilterModal: boolean;
  
  // Data state
  /** Array of all contacts in the application */
  contacts: Contact[];
  /** Array of all contact groups */
  groups: ContactGroup[];
  /** Array of pending enrichment suggestions */
  suggestions: EnrichmentSuggestion[];
  
  // UI state
  /** Whether the add contact modal is visible */
  showAdd: boolean;
  /** Contact currently being edited, null if none */
  editingContact: Contact | null;
  /** Contact currently being viewed in detail, null if none */
  viewingContact: Contact | null;
  /** Name of the currently active group filter, null if none */
  activeGroup: string | null;
  /** Whether the group management modal is visible */
  showGroupManagement: boolean;
  /** Group currently being edited, null if none */
  editingGroup: ContactGroup | null;
  /** Whether the badge scanner modal is visible */
  showBadgeScanner: boolean;
  /** Whether the user photo demo is visible */
  showUserPhotoDemo: boolean;
  /** Whether the contacts import modal is visible */
  showContactsImport: boolean;
  
  // Network state
  /** Whether the device is currently online */
  isOnline: boolean;
  /** Queue of operations to sync when back online */
  offlineQueue: OfflineQueueItem[];
  /** Whether to show the offline indicator */
  showOfflineIndicator: boolean;
  /** Whether the app is currently loading data */
  isLoading: boolean;
  /** Search history including recent searches and saved searches */
  searchHistory: SearchHistory;
}

interface AppActions {
  // View actions
  setView: (view: ViewType) => void;
  setQuery: (query: string) => void;
  setFilters: (filters: ContactFilters) => void;
  setShowFilterModal: (show: boolean) => void;
  
  // Contact actions
  addContact: (payload: {
    name: string;
    identifier: string;
    company?: string;
    title?: string;
    note?: string;
    tags: string[];
    groups: string[];
  }) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  toggleStar: (id: string) => void;
  
  // Group actions
  addGroup: (payload: { name: string; type: string; location?: string }) => void;
  updateGroup: (id: string, updates: { name: string; type: string; location?: string }) => void;
  deleteGroup: (id: string) => void;
  
  // Import actions
  importContacts: (importedContacts: ImportedContact[]) => void;
  
  // Suggestion actions
  resolveSuggestion: (suggestionId: string, action: 'accept' | 'reject') => void;
  
  // UI actions
  setShowAdd: (show: boolean) => void;
  setEditingContact: (contact: Contact | null) => void;
  setViewingContact: (contact: Contact | null) => void;
  setActiveGroup: (group: string | null) => void;
  setShowGroupManagement: (show: boolean) => void;
  setEditingGroup: (group: ContactGroup | null) => void;
  setShowBadgeScanner: (show: boolean) => void;
  setShowUserPhotoDemo: (show: boolean) => void;
  setShowContactsImport: (show: boolean) => void;
  
  // Network actions
  setIsOnline: (online: boolean) => void;
  addToOfflineQueue: (item: Omit<OfflineQueueItem, 'id' | 'timestamp'>) => void;
  setShowOfflineIndicator: (show: boolean) => void;
  
  // Search actions
  addRecentSearch: (searchTerm: string) => void;
  clearRecentSearches: () => void;
}

interface AppContextType {
  state: AppState;
  actions: AppActions;
  computed: {
    filteredContacts: Contact[];
    groupMembers: Contact[];
    displayList: Contact[];
    availableTags: string[];
    availableGroups: string[];
    availableCompanies: string[];
    availableCities: string[];
    availableCountries: string[];
    contactCounts: {
      starred: number;
      hasEmail: number;
      hasPhone: number;
      hasLinkedIn: number;
      recentInteraction: number;
      total: number;
    };
  };
}

const AppStateContext = createContext<AppContextType | null>(null);

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}

interface AppStateProviderProps {
  children: ReactNode;
}

export function AppStateProvider({ children }: AppStateProviderProps) {
  // Core state
  const [view, setView] = useState<ViewType>("home");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ContactFilters>({
    query: "",
    starred: false,
    hasEmail: false,
    hasPhone: false,
  });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [suggestions, setSuggestions] = useState<EnrichmentSuggestion[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI state
  const [showAdd, setShowAddState] = useState(false);
  const setShowAdd = useCallback((show: boolean) => {
    console.log('🔧 AppStateContext: setShowAdd called with:', show);
    console.log('🔧 AppStateContext: Current showAdd:', showAdd);
    setShowAddState(show);
    console.log('🔧 AppStateContext: setShowAddState called');
  }, [showAdd]);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null);
  const [showBadgeScanner, setShowBadgeScanner] = useState(false);
  const [showUserPhotoDemo, setShowUserPhotoDemo] = useState(false);
  const [showContactsImport, setShowContactsImport] = useState(false);

  // Debug showAdd state changes
  useEffect(() => {
    console.log('🔧 AppStateContext: showAdd state changed to:', showAdd);
  }, [showAdd]);
  
  // Network state
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
  const [showOfflineIndicator, setShowOfflineIndicator] = useState(false);
  
  // Search state
  const [searchHistory, setSearchHistory] = useState<SearchHistory>({
    recentSearches: [],
    savedSearches: []
  });

  // Load data from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const appState = await storageService.loadAppState();
        if (appState) {
          setContacts(appState.contacts);
          setGroups(appState.groups);
          setSuggestions(appState.suggestions);
          setFilters(appState.filters);
        } else {
          // First time user, start with empty data
          setContacts([]);
          setGroups([]);
          setSuggestions([]);

          // Save empty data immediately
          await storageService.saveAppState({
            contacts: [],
            groups: [],
            suggestions: [],
            filters: {
              query: "",
              starred: false,
              hasEmail: false,
              hasPhone: false,
            }
          });
        }

        // Load offline queue
        const existingQueue = await storageService.getOfflineQueue();
        setOfflineQueue(existingQueue);
        
      } catch (error) {
        console.error('Failed to load app state, starting with empty data:', error);
        setContacts([]);
        setGroups([]);
        setSuggestions([]);
      } finally {
        setIsDataLoaded(true);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Auto-save data when state changes
  useEffect(() => {
    if (isDataLoaded) {
      const saveData = async () => {
        try {
          await storageService.saveAppState({
            contacts,
            groups,
            suggestions,
            filters
          });
        } catch (error) {
          console.error('Failed to save app state:', error);
        }
      };

      saveData();
    }
  }, [contacts, groups, suggestions, filters, isDataLoaded]);

  // Auto-sync offline queue when online
  useEffect(() => {
    let syncInterval: NodeJS.Timeout;
    
    if (isOnline && isDataLoaded) {
      syncInterval = setInterval(async () => {
        try {
          const result = await syncService.processOfflineQueue();
          if (result.processed > 0) {
            // Refresh queue after successful sync
            const updatedQueue = await storageService.getOfflineQueue();
            setOfflineQueue(updatedQueue);
          }
        } catch (error) {
          console.error('Auto-sync failed:', error);
        }
      }, 30000); // 30 seconds
    }

    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, [isOnline, isDataLoaded]);

  // Network actions
  const addToOfflineQueue = useMemo(() => async (item: Omit<OfflineQueueItem, 'id' | 'timestamp'>) => {
    try {
      const success = await storageService.addToOfflineQueue(item);
      if (success) {
        // Refresh the queue state from storage
        const updatedQueue = await storageService.getOfflineQueue();
        setOfflineQueue(updatedQueue);
      }
    } catch (error) {
      console.error('Failed to add to offline queue:', error);
    }
  }, []);

  // Contact actions
  const addContact = useMemo(() => (payload: {
    name: string;
    identifier: string;
    company?: string;
    title?: string;
    note?: string;
    tags: string[];
    groups: string[];
  }) => {
    const id = `c${Date.now()}`;
    const identType = payload.identifier.includes("@")
      ? "email"
      : payload.identifier.startsWith("+")
      ? "phone"
      : "url";

    const newContact: Contact = {
      id,
      name: payload.name,
      identifiers: [{ type: identType as 'email' | 'phone' | 'linkedin' | 'url', value: payload.identifier }],
      company: payload.company || "",
      title: payload.title || "",
      city: "",
      country: "",
      groups: payload.groups,
      tags: payload.tags,
      note: payload.note || "",
      starred: false,
      lastInteraction: Date.now(),
    };

    setContacts((prev) => [newContact, ...prev]);

    // Handle groups
    payload.groups.forEach((gname) => {
      const existingGroup = groups.find((g) => g.name === gname);
      if (!existingGroup) {
        const gid = `g${Date.now()}-${Math.random()}`;
        const newGroup: ContactGroup = {
          id: gid,
          name: gname,
          type: "custom" as const,
          location: "",
          members: [id]
        };
        setGroups((prev) => [...prev, newGroup]);
      } else {
        setGroups((prev) => prev.map((g) =>
          g.id === existingGroup.id
            ? { ...g, members: [...new Set([...g.members, id])] }
            : g
        ));
      }
    });

    // Send to backend and sync to HubSpot
    if (isOnline) {
      syncService.syncContact(newContact).catch((error) => {
        console.error('Failed to sync contact to backend:', error);
        // Add to offline queue for retry
        addToOfflineQueue({
          type: 'add_contact',
          payload: newContact,
          status: 'pending'
        });
      });
    } else {
      // Add to offline queue if offline
      addToOfflineQueue({
        type: 'add_contact',
        payload: newContact,
        status: 'pending'
      });
    }
  }, [groups, isOnline, addToOfflineQueue]);

  const updateContact = useMemo(() => (id: string, updates: Partial<Contact>) => {
    let updatedContact: Contact | undefined;

    setContacts((prev) => {
      const newContacts = prev.map((c) => {
        if (c.id === id) {
          updatedContact = { ...c, ...updates };
          return updatedContact;
        }
        return c;
      });
      return newContacts;
    });

    // Handle sync based on online status
    if (!isOnline) {
      // Add to offline queue if offline
      addToOfflineQueue({
        type: 'edit_contact',
        payload: { id, updates },
        status: 'pending'
      });
    } else if (updatedContact) {
      // Auto-sync to HubSpot if online and contact has HubSpot ID
      if (updatedContact.hubspotContactId) {
        console.log('Auto-syncing contact update to HubSpot:', updatedContact);

        // Trigger immediate sync without waiting
        syncService.syncContactUpdate(updatedContact, updatedContact.hubspotContactId)
          .then(() => {
            console.log('Contact auto-sync to HubSpot completed successfully');
            // Update sync status on the contact
            setContacts((prev) => prev.map((c) =>
              c.id === id ? {
                ...c,
                syncStatus: 'synced',
                lastSyncedAt: new Date().toISOString()
              } : c
            ));
          })
          .catch((error) => {
            console.error('Contact auto-sync to HubSpot failed:', error);
            // Update sync status to show error
            setContacts((prev) => prev.map((c) =>
              c.id === id ? {
                ...c,
                syncStatus: 'failed',
                syncError: error.message
              } : c
            ));
          });
      }
    }
  }, [isOnline, addToOfflineQueue]);

  const deleteContact = useMemo(() => (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setGroups((prev) => prev.map((g) => ({ ...g, members: g.members.filter((m) => m !== id) })));
    
    // Add to offline queue if offline
    if (!isOnline) {
      addToOfflineQueue({
        type: 'delete_contact',
        payload: { id },
        status: 'pending'
      });
    }
  }, [isOnline, addToOfflineQueue]);

  const toggleStar = useMemo(() => (id: string) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, starred: !c.starred } : c)));
  }, []);

  // Group actions
  const addGroup = useMemo(() => (payload: { name: string; type: string; location?: string }) => {
    const id = `g${Date.now()}`;
    const newGroup: ContactGroup = {
      id,
      name: payload.name,
      type: payload.type as "event" | "location" | "custom",
      location: payload.location || "",
      members: []
    };
    setGroups((prev) => [...prev, newGroup]);
    
    // Add to offline queue if offline
    if (!isOnline) {
      addToOfflineQueue({
        type: 'add_group',
        payload: newGroup,
        status: 'pending'
      });
    }
  }, [isOnline, addToOfflineQueue]);

  const updateGroup = useMemo(() => (id: string, updates: { name: string; type: string; location?: string }) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates, type: updates.type as "event" | "location" | "custom" } : g)));
    
    // Add to offline queue if offline
    if (!isOnline) {
      addToOfflineQueue({
        type: 'edit_group',
        payload: { id, updates },
        status: 'pending'
      });
    }
  }, [isOnline, addToOfflineQueue]);

  const deleteGroup = useMemo(() => (id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
    setContacts((prev) => prev.map((c) => ({ ...c, groups: c.groups.filter((gname) => {
      const group = groups.find((g) => g.id === id);
      return group ? gname !== group.name : true;
    })})));
    
    // Add to offline queue if offline
    if (!isOnline) {
      addToOfflineQueue({
        type: 'delete_group',
        payload: { id },
        status: 'pending'
      });
    }
  }, [groups, isOnline, addToOfflineQueue]);

  // Suggestion actions  
  const resolveSuggestion = useMemo(() => (suggestionId: string, action: 'accept' | 'reject') => {
    // For now, just remove the suggestion
    setSuggestions((prev) => prev.filter(s => s.id !== suggestionId));
    
    // TODO: If accepted, apply the suggestion to the contact
    // TODO: If rejected, mark as rejected for future reference
  }, []);

  // Import actions
  const importContacts = useMemo(() => (importedContacts: ImportedContact[]) => {
    const newContacts: Contact[] = importedContacts.map(imported => ({
      ...imported,
      city: imported.city || '',
      country: imported.country || '',
    }));
    
    setContacts((prev) => [...newContacts, ...prev]);
    
    // Handle any new groups that might be created from imported contacts
    const newGroupNames = new Set<string>();
    newContacts.forEach(contact => {
      contact.groups.forEach(groupName => {
        if (!groups.find(g => g.name === groupName)) {
          newGroupNames.add(groupName);
        }
      });
    });
    
    // Create new groups if needed
    if (newGroupNames.size > 0) {
      const newGroups: ContactGroup[] = Array.from(newGroupNames).map(name => ({
        id: `g${Date.now()}-${Math.random()}`,
        name,
        type: 'custom' as const,
        location: '',
        members: newContacts
          .filter(c => c.groups.includes(name))
          .map(c => c.id)
      }));
      
      setGroups((prev) => [...prev, ...newGroups]);
    }
  }, [groups]);

  // Update filters when query changes
  const handleSetQuery = (newQuery: string) => {
    setQuery(newQuery);
    setFilters(prev => ({ ...prev, query: newQuery }));
    
    // Add to recent searches if it's a meaningful search (3+ chars)
    if (newQuery.trim().length >= 3) {
      addRecentSearch(newQuery.trim());
    }
  };

  // Search history actions
  const addRecentSearch = (searchTerm: string) => {
    setSearchHistory(prev => {
      const filtered = prev.recentSearches.filter(term => term !== searchTerm);
      return {
        ...prev,
        recentSearches: [searchTerm, ...filtered].slice(0, 10) // Keep only last 10
      };
    });
  };

  const clearRecentSearches = () => {
    setSearchHistory(prev => ({
      ...prev,
      recentSearches: []
    }));
  };

  // Enhanced search helper function
  const searchInContact = useCallback((contact: Contact, query: string): boolean => {
    const q = query.trim().toLowerCase();
    if (!q) return true;

    // Support field-specific search syntax: "company:acme", "tag:work", "city:sf"
    const fieldSearchRegex = /(\w+):\s*([^:\s]+)/g;
    const fieldMatches = [...q.matchAll(fieldSearchRegex)];
    
    if (fieldMatches.length > 0) {
      // Field-specific search
      return fieldMatches.every(([, field, value]) => {
        const searchValue = value.toLowerCase();
        switch (field) {
          case 'company':
          case 'comp':
            return contact.company?.toLowerCase().includes(searchValue) || false;
          case 'title':
          case 'job':
            return contact.title?.toLowerCase().includes(searchValue) || false;
          case 'tag':
          case 'tags':
            return contact.tags.some(tag => tag.toLowerCase().includes(searchValue));
          case 'group':
          case 'groups':
            return contact.groups.some(group => group.toLowerCase().includes(searchValue));
          case 'city':
          case 'location':
            return contact.city?.toLowerCase().includes(searchValue) || false;
          case 'country':
            return contact.country?.toLowerCase().includes(searchValue) || false;
          case 'email':
            return contact.identifiers.some(id => 
              id.type === 'email' && id.value.toLowerCase().includes(searchValue)
            );
          case 'phone':
            return contact.identifiers.some(id => 
              id.type === 'phone' && id.value.includes(searchValue)
            );
          case 'name':
            return contact.name.toLowerCase().includes(searchValue);
          default:
            return false;
        }
      });
    }

    // General search across all fields (improved with weighted scoring)
    const searchableText = [
      contact.name,
      contact.company,
      contact.title,
      contact.city,
      contact.country,
      contact.tags.join(" "),
      contact.groups.join(" "),
      contact.identifiers.map((i) => i.value).join(" "),
      contact.note,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(q);
  }, []);

  // Computed values
  const filteredContacts = useMemo(() => {
    let filtered = [...contacts];

    // Apply enhanced text search
    if (filters.query.trim()) {
      filtered = filtered.filter((c) => searchInContact(c, filters.query));
    }

    // Apply starred filter
    if (filters.starred) {
      filtered = filtered.filter(c => c.starred);
    }

    // Apply email filter
    if (filters.hasEmail) {
      filtered = filtered.filter(c => c.identifiers.some(id => id.type === 'email'));
    }

    // Apply phone filter
    if (filters.hasPhone) {
      filtered = filtered.filter(c => c.identifiers.some(id => id.type === 'phone'));
    }

    // Apply group filter
    if (filters.group) {
      filtered = filtered.filter(c => c.groups.includes(filters.group!));
    }

    // Apply tags filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(c => 
        filters.tags!.some(tag => c.tags.includes(tag))
      );
    }

    // Apply LinkedIn filter
    if (filters.hasLinkedIn) {
      filtered = filtered.filter(c => c.identifiers.some(id => id.type === 'linkedin'));
    }

    // Apply company filter
    if (filters.company) {
      filtered = filtered.filter(c => 
        c.company?.toLowerCase().includes(filters.company!.toLowerCase()) || false
      );
    }

    // Apply city filter
    if (filters.city) {
      filtered = filtered.filter(c => 
        c.city?.toLowerCase().includes(filters.city!.toLowerCase()) || false
      );
    }

    // Apply country filter
    if (filters.country) {
      filtered = filtered.filter(c => 
        c.country?.toLowerCase().includes(filters.country!.toLowerCase()) || false
      );
    }

    // Apply recent interaction filter (last 30 days)
    if (filters.recentInteraction) {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(c => c.lastInteraction > thirtyDaysAgo);
    }

    // Apply sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let comparison = 0;
        switch (filters.sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'company':
            comparison = (a.company || '').localeCompare(b.company || '');
            break;
          case 'lastInteraction':
            comparison = b.lastInteraction - a.lastInteraction; // Most recent first by default
            break;
          case 'created':
            comparison = (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime());
            break;
        }
        return filters.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [contacts, filters]);

  const groupMembers = useMemo(() => {
    if (!activeGroup) return contacts;
    const group = groups.find((g) => g.name === activeGroup || g.id === activeGroup);
    if (!group) return contacts;
    const ids = new Set(group.members);
    return contacts.filter((c) => ids.has(c.id));
  }, [activeGroup, groups, contacts]);

  const displayList = useMemo(() => {
    return activeGroup ? groupMembers : filteredContacts;
  }, [activeGroup, groupMembers, filteredContacts]);

  // Available tags and groups for filter modal
  const availableTags = useMemo(() => {
    const allTags = contacts.flatMap(c => c.tags);
    return [...new Set(allTags)].sort();
  }, [contacts]);

  const availableGroups = useMemo(() => {
    return groups.map(g => g.name).sort();
  }, [groups]);

  const availableCompanies = useMemo(() => {
    const companies = contacts
      .map(c => c.company)
      .filter((company): company is string => Boolean(company))
      .filter(company => company.trim().length > 0);
    return [...new Set(companies)].sort();
  }, [contacts]);

  const availableCities = useMemo(() => {
    const cities = contacts
      .map(c => c.city)
      .filter((city): city is string => Boolean(city))
      .filter(city => city.trim().length > 0);
    return [...new Set(cities)].sort();
  }, [contacts]);

  const availableCountries = useMemo(() => {
    const countries = contacts
      .map(c => c.country)
      .filter((country): country is string => Boolean(country))
      .filter(country => country.trim().length > 0);
    return [...new Set(countries)].sort();
  }, [contacts]);

  const contactCounts = useMemo(() => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    return {
      starred: contacts.filter(c => c.starred).length,
      hasEmail: contacts.filter(c => c.identifiers.some(id => id.type === 'email')).length,
      hasPhone: contacts.filter(c => c.identifiers.some(id => id.type === 'phone')).length,
      hasLinkedIn: contacts.filter(c => c.identifiers.some(id => id.type === 'linkedin')).length,
      recentInteraction: contacts.filter(c => c.lastInteraction > thirtyDaysAgo).length,
      total: contacts.length,
    };
  }, [contacts]);

  const state: AppState = {
    view,
    query,
    filters,
    showFilterModal,
    contacts,
    groups,
    suggestions,
    showAdd,
    editingContact,
    viewingContact,
    activeGroup,
    showGroupManagement,
    editingGroup,
    showBadgeScanner,
    showUserPhotoDemo,
    showContactsImport,
    isOnline,
    offlineQueue,
    showOfflineIndicator,
    isLoading,
    searchHistory,
  };

  const actions: AppActions = {
    setView,
    setQuery: handleSetQuery,
    setFilters,
    setShowFilterModal,
    addContact,
    updateContact,
    deleteContact,
    toggleStar,
    addGroup,
    updateGroup,
    deleteGroup,
    importContacts,
    resolveSuggestion,
    setShowAdd,
    setEditingContact,
    setViewingContact,
    setActiveGroup,
    setShowGroupManagement,
    setEditingGroup,
    setShowBadgeScanner,
    setShowUserPhotoDemo,
    setShowContactsImport,
    setIsOnline,
    addToOfflineQueue,
    setShowOfflineIndicator,
    addRecentSearch,
    clearRecentSearches,
  };

  const computed = {
    filteredContacts,
    groupMembers,
    displayList,
    availableTags,
    availableGroups,
    availableCompanies,
    availableCities,
    availableCountries,
    contactCounts,
  };

  const contextValue: AppContextType = {
    state,
    actions,
    computed,
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
}