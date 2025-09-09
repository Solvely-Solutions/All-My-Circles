/**
 * @fileoverview Accessible Button Component
 * 
 * A fully accessible button component that follows WCAG 2.1 AA guidelines
 * and provides comprehensive screen reader support, proper touch targets,
 * and semantic roles.
 * 
 * @author All My Circles Development Team
 * @version 1.0.0
 */

import React, { memo } from 'react';
import { 
  Pressable, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  PressableProps,
  ActivityIndicator,
  View
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { 
  createButtonA11yProps, 
  ensureMinTouchTarget, 
  MIN_TOUCH_TARGET_SIZE 
} from '../../utils/accessibility';

/**
 * Props for the AccessibleButton component
 */
export interface AccessibleButtonProps extends Omit<PressableProps, 'children'> {
  /** The button text or label */
  title: string;
  /** Optional accessibility label override */
  accessibilityLabel?: string;
  /** Optional accessibility hint for additional context */
  accessibilityHint?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the button is currently loading */
  loading?: boolean;
  /** Button variant for styling */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  /** Whether to enable haptic feedback on press */
  hapticFeedback?: boolean;
  /** Custom button style */
  buttonStyle?: ViewStyle;
  /** Custom text style */
  textStyle?: TextStyle;
  /** Optional icon to display before text */
  leftIcon?: React.ReactNode;
  /** Optional icon to display after text */
  rightIcon?: React.ReactNode;
  /** Whether the button should take full width */
  fullWidth?: boolean;
}

/**
 * A fully accessible button component with comprehensive screen reader support,
 * proper touch targets, haptic feedback, and WCAG 2.1 AA compliance.
 * 
 * @example
 * ```tsx
 * <AccessibleButton
 *   title="Save Changes"
 *   variant="primary"
 *   size="large"
 *   accessibilityHint="Saves your profile changes"
 *   onPress={handleSave}
 *   disabled={!isDirty}
 *   loading={isSaving}
 * />
 * ```
 */
export const AccessibleButton = memo<AccessibleButtonProps>(function AccessibleButton({
  title,
  accessibilityLabel,
  accessibilityHint,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'medium',
  hapticFeedback = true,
  buttonStyle,
  textStyle,
  leftIcon,
  rightIcon,
  fullWidth = false,
  onPress,
  ...rest
}) {
  // Create accessibility props
  const a11yProps = createButtonA11yProps(
    accessibilityLabel || title,
    accessibilityHint,
    disabled || loading
  );

  // Handle press with haptic feedback
  const handlePress = (event: any) => {
    if (disabled || loading) return;

    if (hapticFeedback && process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onPress?.(event);
  };

  // Get button styles based on variant and size
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...ensureMinTouchTarget(MIN_TOUCH_TARGET_SIZE, MIN_TOUCH_TARGET_SIZE),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    };

    // Size adjustments
    switch (size) {
      case 'small':
        baseStyle.paddingHorizontal = 12;
        baseStyle.paddingVertical = 8;
        baseStyle.minHeight = 36;
        break;
      case 'large':
        baseStyle.paddingHorizontal = 24;
        baseStyle.paddingVertical = 16;
        baseStyle.minHeight = 52;
        break;
      default: // medium
        baseStyle.minHeight = 44;
        break;
    }

    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyle.backgroundColor = disabled || loading ? '#94a3b8' : '#3b82f6';
        break;
      case 'secondary':
        baseStyle.backgroundColor = disabled || loading ? '#f1f5f9' : '#e2e8f0';
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = disabled || loading ? '#94a3b8' : '#3b82f6';
        break;
      case 'ghost':
        baseStyle.backgroundColor = 'transparent';
        break;
      case 'danger':
        baseStyle.backgroundColor = disabled || loading ? '#94a3b8' : '#ef4444';
        break;
    }

    // Full width
    if (fullWidth) {
      baseStyle.alignSelf = 'stretch';
    }

    return baseStyle;
  };

  // Get text styles based on variant and size
  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: '600',
      textAlign: 'center',
    };

    // Size adjustments
    switch (size) {
      case 'small':
        baseTextStyle.fontSize = 14;
        break;
      case 'large':
        baseTextStyle.fontSize = 18;
        break;
      default: // medium
        baseTextStyle.fontSize = 16;
        break;
    }

    // Variant text colors
    switch (variant) {
      case 'primary':
      case 'danger':
        baseTextStyle.color = '#ffffff';
        break;
      case 'secondary':
        baseTextStyle.color = disabled || loading ? '#64748b' : '#334155';
        break;
      case 'outline':
      case 'ghost':
        baseTextStyle.color = disabled || loading ? '#94a3b8' : '#3b82f6';
        break;
    }

    if (disabled || loading) {
      baseTextStyle.opacity = 0.6;
    }

    return baseTextStyle;
  };

  const buttonStyles = [getButtonStyle(), buttonStyle];
  const finalTextStyle = [getTextStyle(), textStyle];

  return (
    <Pressable
      style={({ pressed }) => [
        ...buttonStyles,
        pressed && !disabled && !loading && styles.pressed,
      ]}
      onPress={handlePress}
      {...a11yProps}
      {...rest}
    >
      <View style={styles.content}>
        {loading && (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' || variant === 'danger' ? '#ffffff' : '#3b82f6'}
            style={styles.loader}
          />
        )}
        
        {!loading && leftIcon && (
          <View style={styles.leftIcon}>
            {leftIcon}
          </View>
        )}
        
        <Text style={finalTextStyle}>
          {title}
        </Text>
        
        {!loading && rightIcon && (
          <View style={styles.rightIcon}>
            {rightIcon}
          </View>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginRight: 8,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});