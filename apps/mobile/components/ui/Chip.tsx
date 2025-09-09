import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface ChipProps {
  children?: React.ReactNode;
  label?: string;
  icon?: React.ReactNode;
  active?: boolean;
  selected?: boolean;
  onPress?: () => void;
  variant?: 'default' | 'selected' | 'danger';
  style?: any;
}

export const Chip = memo<ChipProps>(function Chip({ 
  children, 
  label,
  icon,
  active = false,
  selected = false,
  onPress,
  variant = 'default',
  style
}) {
  const isActive = active || selected;
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'selected':
        return {
          chip: styles.chipSelected,
          text: styles.chipTextSelected
        };
      case 'danger':
        return {
          chip: styles.chipDanger,
          text: styles.chipTextDanger
        };
      default:
        return {
          chip: isActive ? styles.chipActive : styles.chipInactive,
          text: isActive ? styles.chipTextActive : styles.chipTextInactive
        };
    }
  };

  const variantStyles = getVariantStyles();
  const content = label || children;

  const chipContent = (
    <View style={[styles.chip, variantStyles.chip, style]}>
      <View style={styles.chipContent}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={[styles.chipText, variantStyles.text]}>
          {content}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessible={true} accessibilityRole="button">
        {chipContent}
      </Pressable>
    );
  }

  return chipContent;
});

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  chipInactive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  chipSelected: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  chipDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#93c5fd',
  },
  chipTextInactive: {
    color: 'rgba(255,255,255,0.7)',
  },
  chipTextSelected: {
    color: '#6ee7b7',
  },
  chipTextDanger: {
    color: '#fca5a5',
  },
});