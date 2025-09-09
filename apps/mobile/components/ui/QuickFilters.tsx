import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Star, Mail, Phone, MapPin, Building, Clock, Filter } from 'lucide-react-native';
import { Chip } from './Chip';
import { ContactFilters } from '../../types/contact';

interface QuickFilter {
  id: string;
  label: string;
  icon: React.ReactNode;
  filters: Partial<ContactFilters>;
  count?: number;
}

interface QuickFiltersProps {
  currentFilters: ContactFilters;
  onFilterChange: (filters: ContactFilters) => void;
  contactCounts?: {
    starred: number;
    hasEmail: number;
    hasPhone: number;
    hasLinkedIn: number;
    recentInteraction: number;
    total: number;
  };
}

export function QuickFilters({ 
  currentFilters, 
  onFilterChange, 
  contactCounts 
}: QuickFiltersProps) {
  const quickFilters: QuickFilter[] = [
    {
      id: 'starred',
      label: 'Starred',
      icon: <Star size={14} color="#fbbf24" fill={currentFilters.starred ? "#fbbf24" : "transparent"} />,
      filters: { starred: !currentFilters.starred },
      count: contactCounts?.starred
    },
    {
      id: 'hasEmail',
      label: 'Has Email',
      icon: <Mail size={14} color="#3b82f6" />,
      filters: { hasEmail: !currentFilters.hasEmail },
      count: contactCounts?.hasEmail
    },
    {
      id: 'hasPhone',
      label: 'Has Phone',
      icon: <Phone size={14} color="#10b981" />,
      filters: { hasPhone: !currentFilters.hasPhone },
      count: contactCounts?.hasPhone
    },
    {
      id: 'hasLinkedIn',
      label: 'Has LinkedIn',
      icon: <Building size={14} color="#0077b5" />,
      filters: { hasLinkedIn: !currentFilters.hasLinkedIn },
      count: contactCounts?.hasLinkedIn
    },
    {
      id: 'recentInteraction',
      label: 'Recent',
      icon: <Clock size={14} color="#f59e0b" />,
      filters: { recentInteraction: !currentFilters.recentInteraction },
      count: contactCounts?.recentInteraction
    }
  ];

  const handleFilterPress = (filter: QuickFilter) => {
    // Toggle the specific filter
    const newFilters = {
      ...currentFilters,
      ...filter.filters
    };
    onFilterChange(newFilters);
  };

  const isFilterActive = (filter: QuickFilter): boolean => {
    return Object.entries(filter.filters).every(([key, value]) => {
      return currentFilters[key as keyof ContactFilters] === value;
    });
  };

  const hasAnyFilters = 
    currentFilters.starred || 
    currentFilters.hasEmail || 
    currentFilters.hasPhone || 
    currentFilters.hasLinkedIn || 
    currentFilters.recentInteraction ||
    currentFilters.tags?.length ||
    currentFilters.group ||
    currentFilters.company ||
    currentFilters.city ||
    currentFilters.country;

  const clearAllFilters = () => {
    onFilterChange({
      query: currentFilters.query, // Keep the search query
      starred: false,
      hasEmail: false,
      hasPhone: false,
      hasLinkedIn: false,
      recentInteraction: false,
      tags: [],
      group: undefined,
      company: undefined,
      city: undefined,
      country: undefined,
      sortBy: currentFilters.sortBy,
      sortOrder: currentFilters.sortOrder,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {quickFilters.map((filter) => {
          const isActive = isFilterActive(filter);
          return (
            <Chip
              key={filter.id}
              label={filter.count !== undefined ? `${filter.label} (${filter.count})` : filter.label}
              icon={filter.icon}
              selected={isActive}
              onPress={() => handleFilterPress(filter)}
              variant={isActive ? 'selected' : 'default'}
              style={styles.filterChip}
            />
          );
        })}
        
        {hasAnyFilters && (
          <Chip
            label="Clear All"
            icon={<Filter size={14} color="#ef4444" />}
            onPress={clearAllFilters}
            variant="danger"
            style={styles.clearChip}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  filterChip: {
    marginHorizontal: 2,
  },
  clearChip: {
    marginLeft: 8,
    marginHorizontal: 2,
  },
});