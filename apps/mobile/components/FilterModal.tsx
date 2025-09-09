import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import { X as XIcon, Star, Mail, Phone, Tag, Users } from 'lucide-react-native';
import { ContactFilters } from '../types/contact';
import { AccessibleButton } from './ui/AccessibleButton';
import { GlassCard } from './ui/GlassCard';
import { SafeComponent } from './ErrorBoundary';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  currentFilters: ContactFilters;
  onApplyFilters: (filters: ContactFilters) => void;
  availableTags: string[];
  availableGroups: string[];
}

function FilterModalCore({ 
  visible, 
  onClose, 
  currentFilters, 
  onApplyFilters,
  availableTags,
  availableGroups 
}: FilterModalProps) {
  const [filters, setFilters] = useState<ContactFilters>(currentFilters);

  useEffect(() => {
    if (visible) {
      setFilters(currentFilters);
    }
  }, [visible, currentFilters]);

  const toggleTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags?.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...(prev.tags || []), tag]
    }));
  };

  const toggleGroup = (group: string) => {
    setFilters(prev => ({
      ...prev,
      group: prev.group === group ? undefined : group
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClearAll = () => {
    const clearedFilters: ContactFilters = {
      query: filters.query, // Keep the search query
      group: undefined,
      starred: false,
      tags: [],
      hasEmail: false,
      hasPhone: false,
    };
    setFilters(clearedFilters);
  };

  const activeFiltersCount = 
    (filters.starred ? 1 : 0) +
    (filters.hasEmail ? 1 : 0) +
    (filters.hasPhone ? 1 : 0) +
    (filters.group ? 1 : 0) +
    (filters.tags?.length || 0);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <GlassCard style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filter Contacts</Text>
            <AccessibleButton
              onPress={onClose}
              variant="ghost"
              size="small"
              accessibilityLabel="Close filters"
              accessibilityRole="button"
              style={styles.closeButton}
            >
              <XIcon size={24} color="white" />
            </AccessibleButton>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Quick Filters */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Filters</Text>
              
              <View style={styles.filterRow}>
                <View style={styles.filterInfo}>
                  <Star size={16} color={filters.starred ? "#f59e0b" : "rgba(255,255,255,0.7)"} />
                  <Text style={styles.filterLabel}>Starred contacts only</Text>
                </View>
                <Switch
                  value={filters.starred || false}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, starred: value }))}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#3b82f6' }}
                  thumbColor={filters.starred ? '#ffffff' : 'rgba(255,255,255,0.8)'}
                  accessibilityLabel="Filter by starred contacts"
                  accessibilityRole="switch"
                />
              </View>

              <View style={styles.filterRow}>
                <View style={styles.filterInfo}>
                  <Mail size={16} color={filters.hasEmail ? "#10b981" : "rgba(255,255,255,0.7)"} />
                  <Text style={styles.filterLabel}>Has email address</Text>
                </View>
                <Switch
                  value={filters.hasEmail || false}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, hasEmail: value }))}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#3b82f6' }}
                  thumbColor={filters.hasEmail ? '#ffffff' : 'rgba(255,255,255,0.8)'}
                  accessibilityLabel="Filter by contacts with email"
                  accessibilityRole="switch"
                />
              </View>

              <View style={styles.filterRow}>
                <View style={styles.filterInfo}>
                  <Phone size={16} color={filters.hasPhone ? "#8b5cf6" : "rgba(255,255,255,0.7)"} />
                  <Text style={styles.filterLabel}>Has phone number</Text>
                </View>
                <Switch
                  value={filters.hasPhone || false}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, hasPhone: value }))}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#3b82f6' }}
                  thumbColor={filters.hasPhone ? '#ffffff' : 'rgba(255,255,255,0.8)'}
                  accessibilityLabel="Filter by contacts with phone"
                  accessibilityRole="switch"
                />
              </View>
            </View>

            {/* Groups */}
            {availableGroups.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Users size={16} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.sectionTitle}>Groups</Text>
                </View>
                <View style={styles.chipContainer}>
                  {availableGroups.map((group) => (
                    <Pressable
                      key={group}
                      style={[
                        styles.chip,
                        filters.group === group && styles.chipSelected
                      ]}
                      onPress={() => toggleGroup(group)}
                      accessibilityRole="button"
                      accessibilityLabel={`Filter by ${group} group`}
                      accessibilityState={{ selected: filters.group === group }}
                    >
                      <Text style={[
                        styles.chipText,
                        filters.group === group && styles.chipTextSelected
                      ]}>
                        {group}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Tags */}
            {availableTags.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Tag size={16} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.sectionTitle}>Tags</Text>
                </View>
                <View style={styles.chipContainer}>
                  {availableTags.map((tag) => (
                    <Pressable
                      key={tag}
                      style={[
                        styles.chip,
                        filters.tags?.includes(tag) && styles.chipSelected
                      ]}
                      onPress={() => toggleTag(tag)}
                      accessibilityRole="button"
                      accessibilityLabel={`Filter by ${tag} tag`}
                      accessibilityState={{ selected: filters.tags?.includes(tag) }}
                    >
                      <Text style={[
                        styles.chipText,
                        filters.tags?.includes(tag) && styles.chipTextSelected
                      ]}>
                        {tag}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerInfo}>
              <Text style={styles.filtersCount}>
                {activeFiltersCount === 0 
                  ? 'No filters applied' 
                  : `${activeFiltersCount} filter${activeFiltersCount === 1 ? '' : 's'} applied`
                }
              </Text>
            </View>
            
            <View style={styles.footerActions}>
              <AccessibleButton
                onPress={handleClearAll}
                variant="ghost"
                size="medium"
                disabled={activeFiltersCount === 0}
                accessibilityLabel="Clear all filters"
                style={styles.clearButton}
              >
                <Text style={[
                  styles.clearButtonText,
                  activeFiltersCount === 0 && styles.disabledText
                ]}>
                  Clear All
                </Text>
              </AccessibleButton>

              <AccessibleButton
                onPress={handleApply}
                variant="primary"
                size="medium"
                accessibilityLabel="Apply filters to contacts"
                style={styles.applyButton}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </AccessibleButton>
            </View>
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
}

export function FilterModal(props: FilterModalProps) {
  return (
    <SafeComponent componentName="FilterModal">
      <FilterModalCore {...props} />
    </SafeComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  modalCard: {
    flex: 1,
    margin: 0,
    borderRadius: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  filterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  chipSelected: {
    backgroundColor: 'rgba(59,130,246,0.3)',
    borderColor: '#3b82f6',
  },
  chipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  footerInfo: {
    marginBottom: 16,
  },
  filtersCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledText: {
    color: 'rgba(255,255,255,0.4)',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});