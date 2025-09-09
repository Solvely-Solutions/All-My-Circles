/**
 * @fileoverview Accessible Input Component
 * 
 * A fully accessible text input component that provides comprehensive
 * screen reader support, proper labeling, validation states, and
 * WCAG 2.1 AA compliance.
 * 
 * @author All My Circles Development Team
 * @version 1.0.0
 */

import React, { memo, useState, useRef } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  AccessibilityInfo,
} from 'react-native';

import { 
  createSearchA11yProps,
  createAlertA11yProps,
  ensureMinTouchTarget,
  A11Y_ROLES 
} from '@/utils/accessibility';

/**
 * Props for the AccessibleInput component
 */
export interface AccessibleInputProps extends Omit<TextInputProps, 'accessibilityLabel'> {
  /** The input label */
  label: string;
  /** Optional accessibility label override */
  accessibilityLabel?: string;
  /** Optional help text to provide additional context */
  helpText?: string;
  /** Error message to display when input is invalid */
  errorMessage?: string;
  /** Whether the input is in an error state */
  hasError?: boolean;
  /** Whether the input is required */
  required?: boolean;
  /** Input variant for styling */
  variant?: 'default' | 'search' | 'outline';
  /** Input size */
  size?: 'small' | 'medium' | 'large';
  /** Custom container style */
  containerStyle?: ViewStyle;
  /** Custom input style */
  inputStyle?: TextStyle;
  /** Custom label style */
  labelStyle?: TextStyle;
  /** Whether to show the label */
  showLabel?: boolean;
  /** Optional prefix content (like icons) */
  leftElement?: React.ReactNode;
  /** Optional suffix content (like icons) */
  rightElement?: React.ReactNode;
}

/**
 * A fully accessible text input component with proper labeling,
 * error handling, and screen reader support.
 * 
 * @example
 * ```tsx
 * <AccessibleInput
 *   label="Email Address"
 *   placeholder="Enter your email"
 *   required
 *   hasError={!!emailError}
 *   errorMessage={emailError}
 *   helpText="We'll use this to send you notifications"
 *   keyboardType="email-address"
 *   autoCapitalize="none"
 *   value={email}
 *   onChangeText={setEmail}
 * />
 * ```
 */
export const AccessibleInput = memo<AccessibleInputProps>(function AccessibleInput({
  label,
  accessibilityLabel,
  helpText,
  errorMessage,
  hasError = false,
  required = false,
  variant = 'default',
  size = 'medium',
  containerStyle,
  inputStyle,
  labelStyle,
  showLabel = true,
  leftElement,
  rightElement,
  value,
  placeholder,
  onFocus,
  onBlur,
  ...rest
}) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Generate unique IDs for accessibility linking
  const inputId = `input-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const labelId = `${inputId}-label`;
  const helpTextId = `${inputId}-help`;
  const errorId = `${inputId}-error`;

  // Handle focus
  const handleFocus = (event: any) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  // Handle blur
  const handleBlur = (event: any) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  // Create accessibility props based on input type
  const getA11yProps = () => {
    const baseProps = {
      accessible: true,
      accessibilityLabel: accessibilityLabel || label + (required ? ', required' : ''),
      accessibilityRequired: required,
    };

    // Link to help text and error message
    const describedByIds = [];
    if (helpText) describedByIds.push(helpTextId);
    if (hasError && errorMessage) describedByIds.push(errorId);
    
    if (describedByIds.length > 0) {
      // Note: React Native doesn't support aria-describedby directly,
      // but we can include the info in the accessibility label
      baseProps.accessibilityLabel += `. ${helpText || ''}${hasError && errorMessage ? `. Error: ${errorMessage}` : ''}`;
    }

    // Special handling for search inputs
    if (variant === 'search') {
      return {
        ...baseProps,
        ...createSearchA11yProps(placeholder || label, value),
      };
    }

    return {
      ...baseProps,
      accessibilityRole: A11Y_ROLES.TEXT,
    };
  };

  // Get container styles
  const getContainerStyle = (): ViewStyle => {
    return {
      marginBottom: 16,
    };
  };

  // Get input styles
  const getInputStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...ensureMinTouchTarget(44, 44),
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: '#1f2937',
      backgroundColor: '#ffffff',
    };

    // Size adjustments
    switch (size) {
      case 'small':
        baseStyle.paddingHorizontal = 12;
        baseStyle.paddingVertical = 8;
        baseStyle.fontSize = 14;
        baseStyle.minHeight = 36;
        break;
      case 'large':
        baseStyle.paddingHorizontal = 20;
        baseStyle.paddingVertical = 16;
        baseStyle.fontSize = 18;
        baseStyle.minHeight = 52;
        break;
      default: // medium
        baseStyle.minHeight = 44;
        break;
    }

    // Variant styles
    switch (variant) {
      case 'outline':
        baseStyle.borderColor = hasError ? '#ef4444' : isFocused ? '#3b82f6' : '#d1d5db';
        break;
      case 'search':
        baseStyle.borderColor = hasError ? '#ef4444' : isFocused ? '#3b82f6' : '#e5e7eb';
        baseStyle.backgroundColor = '#f9fafb';
        break;
      default:
        baseStyle.borderColor = hasError ? '#ef4444' : isFocused ? '#3b82f6' : '#e5e7eb';
        break;
    }

    // Adjust padding for elements
    if (leftElement) {
      baseStyle.paddingLeft = 48;
    }
    if (rightElement) {
      baseStyle.paddingRight = 48;
    }

    return baseStyle;
  };

  // Get label styles
  const getLabelStyle = (): TextStyle => {
    return {
      fontSize: 14,
      fontWeight: '600',
      color: hasError ? '#ef4444' : '#374151',
      marginBottom: 6,
    };
  };

  return (
    <View style={[getContainerStyle(), containerStyle]}>
      {showLabel && (
        <Text
          style={[getLabelStyle(), labelStyle]}
          nativeID={labelId}
          {...createAlertA11yProps(label + (required ? ' (required)' : ''), false)}
        >
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <View style={styles.inputContainer}>
        {leftElement && (
          <View style={[styles.element, styles.leftElement]}>
            {leftElement}
          </View>
        )}

        <TextInput
          ref={inputRef}
          style={[getInputStyle(), inputStyle]}
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...getA11yProps()}
          {...rest}
        />

        {rightElement && (
          <View style={[styles.element, styles.rightElement]}>
            {rightElement}
          </View>
        )}
      </View>

      {helpText && !hasError && (
        <Text
          style={styles.helpText}
          nativeID={helpTextId}
          {...createAlertA11yProps(helpText, false)}
        >
          {helpText}
        </Text>
      )}

      {hasError && errorMessage && (
        <Text
          style={styles.errorText}
          nativeID={errorId}
          {...createAlertA11yProps(errorMessage, true)}
        >
          {errorMessage}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  inputContainer: {
    position: 'relative',
  },
  element: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    zIndex: 1,
  },
  leftElement: {
    left: 0,
  },
  rightElement: {
    right: 0,
  },
  required: {
    color: '#ef4444',
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    lineHeight: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    lineHeight: 16,
  },
});