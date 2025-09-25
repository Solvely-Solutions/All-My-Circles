import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInDown, 
  SlideOutUp,
  Layout 
} from 'react-native-reanimated';
import { 
  Clock, 
  Search, 
  Tag, 
  MapPin, 
  Building, 
  Users,
  X as XIcon
} from 'lucide-react-native';
import { GlassCard } from './GlassCard';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'tag' | 'city' | 'company' | 'group' | 'field' | 'syntax';
  icon: React.ReactNode;
  description?: string;
}

interface SearchSuggestionsProps {
  query: string;
  onSelect: (suggestion: string) => void;
  onClear?: () => void;
  recentSearches: string[];
  availableTags: string[];
  availableCities: string[];
  availableCompanies: string[];
  availableGroups: string[];
}

export function SearchSuggestions({
  query,
  onSelect,
  onClear,
  recentSearches,
  availableTags,
  availableCities,
  availableCompanies,
  availableGroups,
}: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);

  useEffect(() => {
    if (!query || query.length < 1) {
      // Show recent searches when no query, plus search syntax hints
      const recentSuggestions: SearchSuggestion[] = recentSearches
        .slice(0, 3)
        .map((search, index) => ({
          id: `recent-${index}`,
          text: search,
          type: 'recent',
          icon: <Clock size={16} color="rgba(255,255,255,0.6)" />,
        }));

      // Add search syntax hints
      const syntaxSuggestions: SearchSuggestion[] = [
        {
          id: 'syntax-company',
          text: 'company:acme',
          type: 'syntax',
          icon: <Building size={16} color="rgba(168, 85, 247, 0.8)" />,
          description: 'Search by company'
        },
        {
          id: 'syntax-tag',
          text: 'tag:work',
          type: 'syntax',
          icon: <Tag size={16} color="rgba(34, 197, 94, 0.8)" />,
          description: 'Search by tag'
        },
        {
          id: 'syntax-city',
          text: 'city:sf',
          type: 'syntax',
          icon: <MapPin size={16} color="rgba(59, 130, 246, 0.8)" />,
          description: 'Search by city'
        }
      ];

      setSuggestions([...recentSuggestions, ...syntaxSuggestions]);
      return;
    }

    const filtered: SearchSuggestion[] = [];
    const lowerQuery = query.toLowerCase();

    // Check if user is typing field-specific search
    const fieldMatch = query.match(/^(\w+):/);
    if (fieldMatch) {
      const field = fieldMatch[1].toLowerCase();
      const value = query.substring(fieldMatch[0].length);
      
      // Suggest values for the specific field
      switch (field) {
        case 'company':
        case 'comp':
          availableCompanies
            .filter(company => company.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 5)
            .forEach(company => {
              filtered.push({
                id: `field-company-${company}`,
                text: `company:${company}`,
                type: 'field',
                icon: <Building size={16} color="rgba(168, 85, 247, 0.8)" />,
                description: `Search contacts at ${company}`
              });
            });
          break;
        case 'tag':
        case 'tags':
          availableTags
            .filter(tag => tag.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 5)
            .forEach(tag => {
              filtered.push({
                id: `field-tag-${tag}`,
                text: `tag:${tag}`,
                type: 'field',
                icon: <Tag size={16} color="rgba(34, 197, 94, 0.8)" />,
                description: `Search contacts tagged "${tag}"`
              });
            });
          break;
        case 'city':
        case 'location':
          availableCities
            .filter(city => city.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 5)
            .forEach(city => {
              filtered.push({
                id: `field-city-${city}`,
                text: `city:${city}`,
                type: 'field',
                icon: <MapPin size={16} color="rgba(59, 130, 246, 0.8)" />,
                description: `Search contacts in ${city}`
              });
            });
          break;
        case 'group':
        case 'groups':
          availableGroups
            .filter(group => group.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 5)
            .forEach(group => {
              filtered.push({
                id: `field-group-${group}`,
                text: `group:${group}`,
                type: 'field',
                icon: <Users size={16} color="rgba(245, 158, 11, 0.8)" />,
                description: `Search contacts in "${group}" group`
              });
            });
          break;
      }
      
      setSuggestions(filtered);
      return;
    }

    // Filter tags
    availableTags
      .filter(tag => tag.toLowerCase().includes(lowerQuery))
      .slice(0, 3)
      .forEach(tag => {
        filtered.push({
          id: `tag-${tag}`,
          text: tag,
          type: 'tag',
          icon: <Tag size={16} color="rgba(34, 197, 94, 0.8)" />,
        });
      });

    // Filter cities
    availableCities
      .filter(city => city.toLowerCase().includes(lowerQuery))
      .slice(0, 3)
      .forEach(city => {
        filtered.push({
          id: `city-${city}`,
          text: city,
          type: 'city',
          icon: <MapPin size={16} color="rgba(59, 130, 246, 0.8)" />,
        });
      });

    // Filter companies
    availableCompanies
      .filter(company => company.toLowerCase().includes(lowerQuery))
      .slice(0, 3)
      .forEach(company => {
        filtered.push({
          id: `company-${company}`,
          text: company,
          type: 'company',
          icon: <Building size={16} color="rgba(168, 85, 247, 0.8)" />,
        });
      });

    // Filter groups
    availableGroups
      .filter(group => group.toLowerCase().includes(lowerQuery))
      .slice(0, 3)
      .forEach(group => {
        filtered.push({
          id: `group-${group}`,
          text: group,
          type: 'group',
          icon: <Users size={16} color="rgba(245, 158, 11, 0.8)" />,
        });
      });

    // Sort by relevance (exact matches first, then partial)
    filtered.sort((a, b) => {
      const aExact = a.text.toLowerCase() === lowerQuery;
      const bExact = b.text.toLowerCase() === lowerQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.text.localeCompare(b.text);
    });

    setSuggestions(filtered.slice(0, 8));
  }, [query, availableTags, availableCities, availableCompanies, availableGroups, recentSearches]);

  if (suggestions.length === 0 && !query) {
    return null;
  }

  const getTypeLabel = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent': return 'Recent';
      case 'tag': return 'Tag';
      case 'city': return 'City';
      case 'company': return 'Company';
      case 'group': return 'Group';
      case 'field': return 'Field Search';
      case 'syntax': return 'Search Tip';
      default: return '';
    }
  };

  return (
    <Animated.View
      entering={SlideInDown.duration(300)}
      exiting={SlideOutUp.duration(200)}
      layout={Layout.duration(200)}
      style={styles.container}
    >
      <GlassCard style={styles.suggestionsCard}>
        <View style={styles.header}>
          <Text style={styles.headerText}>
            {!query ? 'Recent searches' : 'Suggestions'}
          </Text>
          {onClear && (
            <Pressable 
              onPress={onClear} 
              style={styles.clearButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Clear suggestions"
              accessibilityHint="Double tap to close suggestions"
            >
              <XIcon size={14} color="rgba(255,255,255,0.6)" />
            </Pressable>
          )}
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {suggestions.map((suggestion, index) => (
            <Animated.View
              key={suggestion.id}
              entering={FadeIn.delay(index * 50)}
              exiting={FadeOut}
              layout={Layout.duration(200)}
            >
              <Pressable
                style={styles.suggestionItem}
                onPress={() => onSelect(suggestion.text)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Search for ${suggestion.text}`}
                accessibilityHint={`${getTypeLabel(suggestion.type)} suggestion. Double tap to select`}
              >
                <View style={styles.suggestionIcon}>
                  {suggestion.icon}
                </View>
                <View style={styles.suggestionContent}>
                  <Text style={styles.suggestionText}>{suggestion.text}</Text>
                  {suggestion.description ? (
                    <Text style={styles.suggestionDescription}>
                      {suggestion.description}
                    </Text>
                  ) : suggestion.type !== 'recent' && (
                    <Text style={styles.suggestionType}>
                      {getTypeLabel(suggestion.type)}
                    </Text>
                  )}
                </View>
                <Search size={14} color="rgba(255,255,255,0.4)" />
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>

        {query && suggestions.length === 0 && (
          <Animated.View
            entering={FadeIn.delay(200)}
            style={styles.noSuggestions}
          >
            <Search size={32} color="rgba(255,255,255,0.3)" />
            <Text style={styles.noSuggestionsText}>No suggestions found</Text>
            <Text style={styles.noSuggestionsSubtext}>
              Try typing a contact name, company, or tag
            </Text>
          </Animated.View>
        )}
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  suggestionsCard: {
    backgroundColor: 'rgba(11, 18, 32, 0.95)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1,
    maxHeight: 300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: 8,
  },
  headerText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  clearButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    maxHeight: 200,
  },
  scrollContent: {
    gap: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 48,
  },
  suggestionIcon: {
    marginRight: 12,
    width: 20,
    alignItems: 'center',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionType: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  suggestionDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  noSuggestions: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noSuggestionsText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 4,
  },
  noSuggestionsSubtext: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
  },
});