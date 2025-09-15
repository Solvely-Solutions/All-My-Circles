import "react-native-reanimated";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { SafeAreaView, View, Text, TextInput, ScrollView, Pressable, StyleSheet, Modal, Alert, Platform } from "react-native";
import Animated, { FadeIn, SlideInUp } from "react-native-reanimated";
import {
  Plus,
  Search as SearchIcon,
  Users,
  LayoutGrid,
  Inbox,
  Tag as TagIcon,
  Calendar,
  MapPin,
  Mail,
  Phone,
  ChevronRight,
  X as XIcon,
  Filter as FilterIcon,
  Circle,
  ArrowRight,
  Trash2,
  LogOut,
  Wifi,
  WifiOff,
  Clock,
  Camera,
} from "lucide-react-native";
import { useAuth } from '../../contexts/AuthContext';
// Conditional import for native platforms only
const NameBadgeScanner = Platform.OS !== 'web' 
  ? require('../../components/NameBadgeScanner').NameBadgeScanner 
  : null;
import { FilterModal } from '../../components/FilterModal';
import { ContactsImportModal } from '../../components/ContactsImportModalSimpleTest';
import { UserPhotoDemo } from '../../components/UserPhotoDemo';
import { CirclesLogo } from '../../components/CirclesLogo';
import { GlassCard } from '../../components/ui/GlassCard';
import { Chip } from '../../components/ui/Chip';
import { ViewTab } from '../../components/ui/ViewTab';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { SearchBar } from '../../components/ui/SearchBar';
import { QuickFilters } from '../../components/ui/QuickFilters';
import { ContactCard } from '../../components/cards/ContactCard';
import { SwipeableContactCard } from '../../components/ui/SwipeableContactCard';
import { GroupCard } from '../../components/cards/GroupCard';
import { TimelineContactCard } from '../../components/cards/TimelineContactCard';
import { SuggestionCard } from '../../components/cards/SuggestionCard';
import { ContactCardSkeleton, SearchSkeleton, GroupSkeleton } from '../../components/ui/SkeletonLoader';
import { OfflineIndicator } from '../../components/ui/OfflineIndicator';
import { CreateGroupButton } from '../../components/ui/CreateGroupButton';
import { ActionMenu } from '../../components/ui/ActionMenu';
import { ErrorBoundary } from '../../components/errors/ErrorBoundary';
import { ContactDetailModal } from '../../components/modals/ContactDetailModal';
import { CRMConnectModal } from '../../components/modals/CRMConnectModal';
import { CRMActionButton } from '../../components/ui/CRMActionButton';
import { crmService } from '../../services/crmService';
import { GroupManagementModal } from '../../components/modals/GroupManagementModal';
import { QuickAddForm } from '../../components/forms/QuickAddForm';
import { useAppState, AppStateProvider } from '../../contexts/AppStateContext';
import { Contact } from '../../types/contact';
import { MOCK_TAGS, seedContacts, seedGroups, seedSuggestions } from '../../data/mockData';
import { getRelativeTimeString, getTimeGrouping } from '../../utils/timeHelpers';


/**
 * All My Circles — Professional Networking & B2B Sales Platform (Web + iOS)
 * - Uses React Native StyleSheet for reliable styling
 * - Animations via React Native Reanimated
 * - Glass morphism design with backdrop blur
 * - CRM integration with HubSpot, Salesforce, Pipedrive
 */


type ViewT = "home" | "contacts" | "groups" | "inbox" | "recent";

type OfflineQueueItem = {
  id: string;
  type: "add_contact" | "edit_contact" | "delete_contact" | "add_group" | "edit_group" | "delete_group";
  payload: any;
  timestamp: number;
  status: "pending" | "syncing" | "failed";
};

function AppContent() {
  const { user, signOut } = useAuth();
  const { state, actions, computed } = useAppState();
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showCRMConnect, setShowCRMConnect] = useState(false);
  
  // Debug modal states
  useEffect(() => {
    console.log('🔧 showAdd changed:', showAdd);
    if (showAdd) {
      console.log('🔧 Add modal should now be visible');
      console.log('🔧 showActionMenu state:', showActionMenu);
      setTimeout(() => {
        console.log('🔧 Checking showAdd after 1 second:', showAdd);
        console.log('🔧 showActionMenu after 1 second:', showActionMenu);
      }, 1000);
    }
  }, [showAdd]);

  useEffect(() => {
    console.log('🔧 showActionMenu changed:', showActionMenu);
  }, [showActionMenu]);

  useEffect(() => {
    console.log('🔧 showContactsImport changed:', showContactsImport);
  }, [showContactsImport]);

  useEffect(() => {
    console.log('🔧 showBadgeScanner changed:', showBadgeScanner);
  }, [showBadgeScanner]);

  const {
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
    isOnline,
    offlineQueue,
    showOfflineIndicator,
    showBadgeScanner,
    showUserPhotoDemo,
    showContactsImport,
    isLoading,
    searchHistory,
  } = state;

  const {
    setView,
    setQuery,
    setFilters,
    setShowFilterModal,
    toggleStar,
    addContact,
    updateContact,
    deleteContact,
    addGroup,
    updateGroup,
    deleteGroup,
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
    importContacts,
    setIsOnline,
    addToOfflineQueue,
    setShowOfflineIndicator,
  } = actions;

  const { 
    displayList, 
    filteredContacts, 
    availableTags, 
    availableGroups,
    availableCompanies,
    availableCities,
    availableCountries,
    contactCounts
  } = computed;
  
  // Create alias for backward compatibility
  const list = displayList;




  const handleBadgeScanResult = useCallback((contactData: {
    name: string;
    company?: string;
    title?: string;
    email?: string;
    phone?: string;
  }) => {
    // Create contact from OCR data
    const identifier = contactData.email || contactData.phone || `${contactData.name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    const tags: string[] = [];
    const groups: string[] = [];
    
    // Add company as a group if available
    if (contactData.company) {
      groups.push(contactData.company);
    }

    // Create note with extracted information
    let note = 'Contact captured from name badge';
    if (contactData.company && contactData.title) {
      note += `\n${contactData.title} at ${contactData.company}`;
    } else if (contactData.company) {
      note += `\nWorks at ${contactData.company}`;
    } else if (contactData.title) {
      note += `\n${contactData.title}`;
    }

    addContact({
      name: contactData.name,
      identifier,
      company: contactData.company,
      title: contactData.title,
      note,
      tags,
      groups
    });

    setShowBadgeScanner(false);
    
    // Show success message
    Alert.alert(
      'Contact Added!',
      `${contactData.name} has been successfully added to your contacts.`,
      [{ text: 'OK' }]
    );
  }, [addContact, setShowBadgeScanner]);

  const handleOfflineToggle = useCallback(() => {
    setIsOnline(!isOnline);
  }, [isOnline, setIsOnline]);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      `Sign out of ${user?.name || 'your account'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  }, [user?.name, signOut]);

  const handleContactStar = useCallback((contactId: string) => {
    toggleStar(contactId);
  }, [toggleStar]);

  const handleContactEdit = useCallback((contact: Contact) => {
    setEditingContact(contact);
    setShowAdd(true);
  }, [setEditingContact, setShowAdd]);

  const handleContactView = useCallback((contact: Contact) => {
    setViewingContact(contact);
  }, [setViewingContact]);

  const handleCRMSetup = useCallback(() => {
    setShowCRMConnect(true);
  }, []);

  // Initialize CRM service on app start
  useEffect(() => {
    const initializeCRM = async () => {
      try {
        await crmService.initialize();
        console.log('CRM Service initialized successfully');
      } catch (error) {
        console.error('Failed to initialize CRM service:', error);
      }
    };

    initializeCRM();
  }, []);

  const handleCRMConnected = useCallback((connection: any) => {
    setShowCRMConnect(false);
    // Show success message or next steps
  }, []);

  const handleContactDelete = useCallback((contactId: string) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteContact(contactId) },
      ]
    );
  }, [deleteContact]);

  const handleGroupOpen = useCallback((groupName: string) => {
    setActiveGroup(groupName);
    setView('contacts');
  }, [setActiveGroup, setView]);

  const handleGroupEdit = useCallback((group: any) => {
    setEditingGroup(group);
    setShowGroupManagement(true);
  }, [setEditingGroup, setShowGroupManagement]);

  const handleGroupDelete = useCallback((groupId: string) => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteGroup(groupId) },
      ]
    );
  }, [deleteGroup]);


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logo}>
              <CirclesLogo size={36} color="white" />
            </View>
            <View>
              <Text style={styles.title}>All My Circles</Text>
              <Text style={styles.subtitle}>Connect. Network. Convert.</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Pressable 
              style={[
                styles.headerActionButton,
                styles.filterHeaderButton,
                (filters.starred || filters.hasEmail || filters.hasPhone || filters.group || (filters.tags && filters.tags.length > 0)) && styles.filterButtonActive
              ]}
              onPress={() => setShowFilterModal(true)}
              accessibilityRole="button"
              accessibilityLabel="Open contact filters"
              accessibilityHint="Tap to filter contacts by various criteria"
            >
              <FilterIcon size={18} color="white" />
              {(filters.starred || filters.hasEmail || filters.hasPhone || filters.group || (filters.tags && filters.tags.length > 0)) && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {(filters.starred ? 1 : 0) + 
                     (filters.hasEmail ? 1 : 0) + 
                     (filters.hasPhone ? 1 : 0) + 
                     (filters.group ? 1 : 0) + 
                     (filters.tags?.length || 0)}
                  </Text>
                </View>
              )}
            </Pressable>
            
            <Pressable 
              onPress={() => setShowActionMenu(true)} 
              style={[styles.headerActionButton, styles.actionMenuButton]}
            >
              <Plus size={20} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Offline Indicator */}
        <OfflineIndicator 
          isOnline={isOnline}
          offlineQueueLength={offlineQueue.length}
          showOfflineIndicator={showOfflineIndicator}
        />

        {/* Top Controls */}
        <View style={styles.topControls}>
          <GlassCard>
            <SearchBar 
              value={query} 
              onChange={setQuery}
              recentSearches={searchHistory.recentSearches}
              availableTags={availableTags}
              availableCities={availableCities}
              availableCompanies={availableCompanies}
              availableGroups={availableGroups}
            />

            {/* Quick Filters */}
            <QuickFilters
              currentFilters={filters}
              onFilterChange={setFilters}
              contactCounts={contactCounts}
            />

            {/* View Switcher */}
            <View style={styles.viewSwitcher}>
              <ViewTab icon={<LayoutGrid size={16} color="white" />} label="Home" active={view === "home"} onPress={() => { setView("home"); setActiveGroup(null); }} />
              <ViewTab icon={<Users size={16} color="white" />} label="Contacts" active={view === "contacts"} onPress={() => { setView("contacts"); setActiveGroup(null); }} />
              <ViewTab icon={<Calendar size={16} color="white" />} label="Recent" active={view === "recent"} onPress={() => { setView("recent"); setActiveGroup(null); }} />
              <ViewTab icon={<TagIcon size={16} color="white" />} label="Groups" active={view === "groups"} onPress={() => setView("groups")} />
              <ViewTab icon={<Inbox size={16} color="white" />} label={`Inbox${suggestions.length > 0 ? ` ${suggestions.length}` : ''}`} active={view === "inbox"} onPress={() => { setView("inbox"); setActiveGroup(null); }} />
            </View>
          </GlassCard>

          <View style={styles.spacing} />

          <GlassCard>
            <View style={styles.upcomingHeader}>
              <View style={styles.upcomingTitle}>
                <Calendar size={16} color="white" />
                <Text style={styles.upcomingText}>Upcoming</Text>
              </View>
            </View>
            <View style={styles.chipRow}>
              {groups.slice(0, 3).map((g) => (
                <Pressable key={g.id} onPress={() => { setActiveGroup(g.name); setView("contacts"); }} style={styles.chipContainer}>
                  <Chip>{g.name}</Chip>
                </Pressable>
              ))}
            </View>
          </GlassCard>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {view === "home" && (
            <Animated.View entering={FadeIn.delay(100)}>
              <GlassCard>
                <SectionHeader title="Starred" subtitle="People you want to keep close" />
                <View style={styles.cardContent}>
                  {isLoading ? (
                    <ContactCardSkeleton />
                  ) : contacts.filter((c) => c.starred).length === 0 ? (
                    <EmptyState 
                      text="No starred contacts yet" 
                      type="starred"
                    />
                  ) : (
                    contacts
                      .filter((c) => c.starred)
                      .map((c) => (
                        <SwipeableContactCard
                          key={c.id}
                          contact={c} 
                          onStar={() => toggleStar(c.id)} 
                          onView={() => setViewingContact(c)}
                          onEdit={() => {
                            setEditingContact(c);
                            setShowAdd(true);
                          }} 
                          onDelete={() => {
                            Alert.alert(
                              'Delete Contact',
                              `Are you sure you want to delete ${c.name}?`,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Delete', style: 'destructive', onPress: () => deleteContact(c.id) },
                              ]
                            );
                          }} 
                        />
                      ))
                  )}
                </View>
              </GlassCard>

              <View style={styles.spacing} />

              <GlassCard>
                <SectionHeader title="Recently added" subtitle="Fresh connections" />
                <View style={styles.cardContent}>
                  {isLoading ? (
                    Array.from({ length: 2 }, (_, index) => (
                      <ContactCardSkeleton key={index} style={{ marginBottom: 12 }} />
                    ))
                  ) : (
                    contacts.slice(0, 4).map((c) => (
                      <SwipeableContactCard
                        key={c.id}
                        contact={c} 
                        onStar={() => toggleStar(c.id)} 
                        onView={() => setViewingContact(c)}
                        onEdit={() => {
                          setEditingContact(c);
                          setShowAdd(true);
                        }} 
                        onDelete={() => {
                          Alert.alert(
                            'Delete Contact',
                            `Are you sure you want to delete ${c.name}?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Delete', style: 'destructive', onPress: () => deleteContact(c.id) },
                            ]
                          );
                        }} 
                      />
                    ))
                  )}
                </View>
              </GlassCard>
            </Animated.View>
          )}

          {view === "contacts" && (
            <Animated.View entering={FadeIn.delay(100)}>
              <GlassCard>
                <SectionHeader title={activeGroup ? `Contacts — ${activeGroup}` : "All contacts"} subtitle={`${list.length} result${list.length !== 1 ? "s" : ""}`} />
                <View style={styles.cardContent}>
                  {isLoading ? (
                    <SearchSkeleton count={3} />
                  ) : list.length === 0 ? (
                    <EmptyState 
                      text="No contacts match your search" 
                      type={query ? "search" : "contacts"}
                      actionText={!query ? "Add Contact" : undefined}
                      onAction={!query ? () => setShowAdd(true) : undefined}
                    />
                  ) : (
                    list.map((c) => (
                      <SwipeableContactCard
                        key={c.id}
                        contact={c} 
                        onStar={() => handleContactStar(c.id)} 
                        onView={() => handleContactView(c)}
                        onEdit={() => handleContactEdit(c)} 
                        onDelete={() => handleContactDelete(c.id)} 
                      />
                    ))
                  )}
                </View>
              </GlassCard>
            </Animated.View>
          )}

          {view === "recent" && (
            <Animated.View entering={FadeIn.delay(100)}>
              {(() => {
                // Sort contacts by last interaction date (most recent first)
                const sortedContacts = [...contacts].sort((a, b) => 
                  new Date(b.lastInteraction).getTime() - new Date(a.lastInteraction).getTime()
                );
                
                // Group contacts by time periods
                const groupedContacts = sortedContacts.reduce((groups, contact) => {
                  const groupKey = getTimeGrouping(new Date(contact.lastInteraction).toISOString());
                  if (!groups[groupKey]) {
                    groups[groupKey] = [];
                  }
                  groups[groupKey].push(contact);
                  return groups;
                }, {} as Record<string, typeof contacts>);

                const groupOrder = ["Today", "Yesterday", "This Week", "This Month", "Last 3 Months", "Older"];
                const orderedGroups = groupOrder.filter(group => groupedContacts[group]?.length > 0);

                return orderedGroups.map((groupName, groupIndex) => (
                  <View key={groupName} style={groupIndex > 0 ? { marginTop: 16 } : {}}>
                    <GlassCard>
                      <SectionHeader 
                        title={groupName} 
                        subtitle={`${groupedContacts[groupName].length} contact${groupedContacts[groupName].length !== 1 ? 's' : ''}`} 
                      />
                      <View style={styles.cardContent}>
                        {groupedContacts[groupName].map((c) => (
                          <View key={c.id} style={styles.cardMargin}>
                            <TimelineContactCard 
                              contact={c} 
                              onStar={() => handleContactStar(c.id)}
                              onView={() => handleContactView(c)}
                              onEdit={() => handleContactEdit(c)}
                              onDelete={() => handleContactDelete(c.id)}
                            />
                          </View>
                        ))}
                      </View>
                    </GlassCard>
                  </View>
                ));
              })()}
            </Animated.View>
          )}

          {view === "groups" && (
            <Animated.View entering={FadeIn.delay(100)}>
              <GlassCard>
                <SectionHeader title="Groups" subtitle="Events, trips, and custom clusters" />
                
                {/* Create New Group Button */}
                <View style={styles.cardContent}>
                  <CreateGroupButton 
                    onPress={() => {
                      setEditingGroup(null);
                      setShowGroupManagement(true);
                    }}
                  />
                </View>
                
                <View style={styles.cardContent}>
                  {isLoading ? (
                    Array.from({ length: 3 }, (_, index) => (
                      <GroupSkeleton key={index} style={{ marginBottom: 12 }} />
                    ))
                  ) : (
                    groups.map((g) => (
                      <View key={g.id} style={styles.cardMargin}>
                        <GroupCard 
                          group={g} 
                          onOpen={() => handleGroupOpen(g.name)}
                          onEdit={() => handleGroupEdit(g)}
                          onDelete={() => handleGroupDelete(g.id)}
                        />
                      </View>
                    ))
                  )}
                </View>
              </GlassCard>
            </Animated.View>
          )}

          {view === "inbox" && (
            <Animated.View entering={FadeIn.delay(100)}>
              <GlassCard>
                <SectionHeader title="Networking Inbox" subtitle="Review networking suggestions" />
                <View style={styles.cardContent}>
                  {suggestions.length === 0 && (
                    <EmptyState 
                      text="You're all caught up" 
                      type="inbox"
                    />
                  )}
                  {suggestions.map((s) => (
                    <View key={s.id} style={styles.cardMargin}>
                      <SuggestionCard s={s} contact={contacts.find((c) => c.id === s.contactId)!} onAccept={() => resolveSuggestion(s.id, "accept")} onReject={() => resolveSuggestion(s.id, "reject")} />
                    </View>
                  ))}
                </View>
              </GlassCard>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* Quick Add/Edit Modal - Fixed with View instead of Modal */}
      {showAdd && (
        <View style={styles.modal}>
          <Pressable 
            style={styles.modalBackdrop} 
            onPress={() => {
              console.log('🔧 Add modal backdrop pressed');
              setShowAdd(false);
              setEditingContact(null);
            }} 
          />
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <GlassCard style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingContact ? 'Edit Contact' : 'Quick Add'}</Text>
                <Pressable onPress={() => {
                  console.log('🔧 Add modal close button pressed');
                  setShowAdd(false);
                  setEditingContact(null);
                }} style={styles.closeButton}>
                  <XIcon size={16} color="white" />
                </Pressable>
              </View>
              <View style={styles.modalBody}>
                <QuickAddForm
                  editingContact={editingContact}
                  onCancel={() => {
                    setShowAdd(false);
                    setEditingContact(null);
                  }}
                  onSave={(data) => {
                    if (editingContact) {
                      updateContact(editingContact.id, {
                        name: data.name,
                        identifiers: [{ type: data.identifier.includes("@") ? "email" : "phone", value: data.identifier }],
                        note: data.note,
                        tags: data.tags,
                        groups: data.groups,
                        company: data.company,
                        title: data.title,
                        lastInteraction: Date.now(),
                      });
                    } else {
                      addContact(data);
                    }
                    setShowAdd(false);
                    setEditingContact(null);
                  }}
                />
              </View>
            </GlassCard>
          </Pressable>
        </View>
      )}

      {/* Contact Detail Modal */}
      <ContactDetailModal
        contact={viewingContact}
        visible={!!viewingContact}
        onClose={() => setViewingContact(null)}
        onEdit={() => {
          if (viewingContact) {
            setEditingContact(viewingContact);
            setViewingContact(null);
            setShowAdd(true);
          }
        }}
        onDelete={() => {
          if (viewingContact) {
            Alert.alert(
              'Delete Contact',
              `Are you sure you want to delete ${viewingContact.name}?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  style: 'destructive', 
                  onPress: () => {
                    deleteContact(viewingContact.id);
                    setViewingContact(null);
                  }
                },
              ]
            );
          }
        }}
        onStar={() => {
          if (viewingContact) {
            toggleStar(viewingContact.id);
          }
        }}
        onContactUpdate={(updatedContact) => {
          updateContact(updatedContact.id, updatedContact);
        }}
      />

      {/* Group Management Modal */}
      <GroupManagementModal
        group={editingGroup}
        visible={showGroupManagement}
        onClose={() => {
          setShowGroupManagement(false);
          setEditingGroup(null);
        }}
        onSave={(data) => {
          if (editingGroup) {
            updateGroup(editingGroup.id, data);
          } else {
            addGroup(data);
          }
          setEditingGroup(null);
        }}
        onDelete={editingGroup ? () => {
          Alert.alert(
            'Delete Group',
            `Are you sure you want to delete "${editingGroup.name}"? This will remove the group from all contacts.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Delete', 
                style: 'destructive', 
                onPress: () => {
                  deleteGroup(editingGroup.id);
                  setShowGroupManagement(false);
                  setEditingGroup(null);
                }
              },
            ]
          );
        } : undefined}
      />

      {/* Name Badge Scanner - Only render on native platforms */}
      {Platform.OS !== 'web' && NameBadgeScanner && (
        <NameBadgeScanner
          visible={showBadgeScanner}
          onClose={() => setShowBadgeScanner(false)}
          onContactExtracted={handleBadgeScanResult}
        />
      )}

      {/* Contacts Import Modal */}
      <ContactsImportModal
        visible={showContactsImport}
        onClose={() => setShowContactsImport(false)}
        onImportContacts={importContacts}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        currentFilters={filters}
        onApplyFilters={setFilters}
        availableTags={availableTags}
        availableGroups={availableGroups}
      />

      {/* Action Menu */}
      <ActionMenu
        visible={showActionMenu}
        onClose={() => {
          console.log('🔧 Main: ActionMenu onClose called, setting showActionMenu=false');
          setShowActionMenu(false);
        }}
        isOnline={isOnline}
        onOfflineToggle={handleOfflineToggle}
        onAddContact={() => {
          console.log('🔧 onAddContact called');
          console.log('🔧 setShowAdd function:', typeof setShowAdd);
          console.log('🔧 Current showAdd value:', showAdd);
          setShowAdd(true);
          console.log('🔧 Called setShowAdd(true)');
        }}
        onImportContacts={() => {
          console.log('🔧 onImportContacts called');
          setShowContactsImport(true);
        }}
        onBadgeScanner={Platform.OS !== 'web' ? () => {
          console.log('🔧 onBadgeScanner called');
          setShowBadgeScanner(true);
        } : undefined}
        onCRMSetup={handleCRMSetup}
        onSignOut={handleSignOut}
        showBadgeScanner={Platform.OS !== 'web'}
      />

      {/* CRM Connect Modal */}
      <CRMConnectModal
        visible={showCRMConnect}
        onClose={() => setShowCRMConnect(false)}
        onSuccess={handleCRMConnected}
      />
    </SafeAreaView>
  );
}

// -------------------- Sub Components --------------------



// -------------------- Styles --------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 100, // Extra bottom padding for safe area
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    maxWidth: '75%',
  },
  logo: {
    height: 40,
    width: 40,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    flexShrink: 1,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: -2,
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  headerActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
  },
  actionMenuButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    borderColor: 'rgba(59, 130, 246, 1)',
  },
  filterHeaderButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
    position: 'relative',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
  },
  topControls: {
    marginTop: 32,
  },
  glassCard: {
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    marginLeft: 12,
    fontSize: 16,
  },
  filterButton: {
    marginLeft: 12,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(59,130,246,0.3)',
    borderColor: '#3b82f6',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 12,
  },
  viewSwitcher: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 6,
    flexWrap: 'wrap',
  },
  viewTab: {
    flex: 1,
    minWidth: 70,
  },
  viewTabActive: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderColor: 'rgba(255,255,255,0.6)',
  },
  viewTabInactive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  viewTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  viewTabText: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
  viewTabTextActive: {
    color: '#1f2937',
  },
  viewTabTextInactive: {
    color: 'white',
  },
  spacing: {
    height: 20,
  },
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upcomingTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upcomingText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  chipContainer: {
    marginRight: 12,
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipActive: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  chipInactive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#1f2937',
  },
  chipTextInactive: {
    color: 'white',
  },
  content: {
    marginTop: 32,
  },
  cardContent: {
    marginTop: 16,
  },
  cardMargin: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  cityChip: {
    marginRight: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
  },
  noteText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 8,
  },
  identifierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  identifier: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  identifierText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginLeft: 4,
  },
  contactActions: {
    alignItems: 'flex-end',
  },
  actionButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 8,
  },
  groupCard: {
    padding: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupName: {
    color: 'white',
    fontWeight: '500',
  },
  groupType: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  groupMembersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  groupMembersText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginLeft: 8,
  },
  rejectButton: {
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  emptyState: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    color: 'rgba(255,255,255,0.7)',
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1500,
    elevation: 1500,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalCard: {
    padding: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  modalBody: {
    marginTop: 12,
  },
  formField: {
    marginBottom: 12,
  },
  formLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  formInput: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    color: 'white',
    marginTop: 4,
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  groupInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  groupInput: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    color: 'white',
  },
  addButton: {
    marginLeft: 8,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginRight: 8,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  saveButtonText: {
    color: '#1f2937',
  },
  
  // Contact Detail Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 18, 32, 0.95)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 18, 32, 0.95)',
  },
  detailModal: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1,
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    flex: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  detailActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  detailContent: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
  },
  detailName: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  detailTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  detailSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalIdentifierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  modalIdentifierText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  groupsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  groupBadgeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  modalTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  tagBadgeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  notesContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
  },
  notesText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
  interactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  interactionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  detailFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 8,
  },
  modalDeleteButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  deleteButtonText: {
    color: 'rgba(220, 38, 38, 1)',
    fontSize: 14,
    fontWeight: '500',
  },
  groupActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteActionButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  typeButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderColor: 'rgba(255,255,255,0.6)',
  },
  typeButtonInactive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#1f2937',
  },
  typeButtonTextInactive: {
    color: 'white',
  },
  memberCountText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  footerButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerButtonSpacer: {
    flex: 1,
  },
  modalCancelButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  saveButtonTextDisabled: {
    color: 'rgba(255,255,255,0.5)',
  },
});

export default function App() {
  return (
    <ErrorBoundary enableReload={true}>
      <AppStateProvider>
        <AppContent />
      </AppStateProvider>
    </ErrorBoundary>
  );
}