import React, { memo, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Search as SearchIcon } from 'lucide-react-native';
import { AccessibleInput } from './AccessibleInput';
import { SearchSuggestions } from './SearchSuggestions';

interface SearchBarProps {
  value: string;
  onChange: (text: string) => void;
  recentSearches?: string[];
  availableTags?: string[];
  availableCities?: string[];
  availableCompanies?: string[];
  availableGroups?: string[];
  showSuggestions?: boolean;
}

export const SearchBar = memo<SearchBarProps>(function SearchBar({ 
  value, 
  onChange,
  recentSearches = [],
  availableTags = [],
  availableCities = [],
  availableCompanies = [],
  availableGroups = [],
  showSuggestions = true,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    setShowDropdown(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding to allow suggestion selection
    setTimeout(() => setShowDropdown(false), 150);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    onChange(suggestion);
    setShowDropdown(false);
  };

  const handleClearSuggestions = () => {
    setShowDropdown(false);
  };

  return (
    <View style={styles.searchContainer}>
      <AccessibleInput
        label="Search Contacts"
        placeholder="Search by name, tag, city, company, group…"
        value={value}
        onChangeText={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        variant="search"
        leftIcon={<SearchIcon size={16} color="rgba(255,255,255,0.7)" />}
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
        accessibilityHint="Search through your contacts by any field"
        style={[
          styles.searchInput,
          isFocused && styles.searchInputFocused,
        ]}
      />
      
      {showSuggestions && showDropdown && (
        <SearchSuggestions
          query={value}
          onSelect={handleSuggestionSelect}
          onClear={handleClearSuggestions}
          recentSearches={recentSearches}
          availableTags={availableTags}
          availableCities={availableCities}
          availableCompanies={availableCompanies}
          availableGroups={availableGroups}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  searchContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  searchInputFocused: {
    borderColor: 'rgba(59, 130, 246, 0.4)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});