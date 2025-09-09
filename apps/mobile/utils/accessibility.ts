/**
 * @fileoverview Accessibility utilities for React Native components
 * 
 * Provides helper functions and constants for implementing comprehensive
 * accessibility features across the application, following WCAG 2.1 AA guidelines.
 * 
 * @author All My Circles Development Team
 * @version 1.0.0
 */

import { AccessibilityRole, AccessibilityState, AccessibilityValue } from 'react-native';

/**
 * Common accessibility roles used throughout the application
 */
export const A11Y_ROLES = {
  BUTTON: 'button' as AccessibilityRole,
  TEXT: 'text' as AccessibilityRole,
  HEADER: 'header' as AccessibilityRole,
  LINK: 'link' as AccessibilityRole,
  IMAGE: 'image' as AccessibilityRole,
  SEARCH: 'search' as AccessibilityRole,
  TAB: 'tab' as AccessibilityRole,
  TAB_LIST: 'tablist' as AccessibilityRole,
  LIST: 'list' as AccessibilityRole,
  LIST_ITEM: 'listitem' as AccessibilityRole,
  MENU: 'menu' as AccessibilityRole,
  MENU_ITEM: 'menuitem' as AccessibilityRole,
  ALERT: 'alert' as AccessibilityRole,
  CHECKBOX: 'checkbox' as AccessibilityRole,
  RADIO: 'radio' as AccessibilityRole,
  SWITCH: 'switch' as AccessibilityRole,
} as const;

/**
 * Common accessibility traits for iOS
 */
export const A11Y_TRAITS = {
  BUTTON: ['button'],
  LINK: ['link'],
  HEADER: ['header'],
  SEARCH_FIELD: ['searchField'],
  IMAGE: ['image'],
  SELECTED: ['selected'],
  DISABLED: ['disabled'],
  KEYBOARD_KEY: ['keyboardKey'],
  ADJUSTABLE: ['adjustable'],
  SUMMARY_ELEMENT: ['summaryElement'],
  UPDATES_FREQUENTLY: ['updatesFrequently'],
} as const;

/**
 * Accessibility hint messages for common UI patterns
 */
export const A11Y_HINTS = {
  DOUBLE_TAP: 'Double tap to activate',
  SWIPE_LEFT: 'Swipe left for more options',
  SWIPE_RIGHT: 'Swipe right for more options',
  LONG_PRESS: 'Long press for additional options',
  NAVIGATE: 'Double tap to navigate',
  EDIT: 'Double tap to edit',
  DELETE: 'Double tap to delete',
  ADD: 'Double tap to add',
  SEARCH: 'Double tap to search',
  CLOSE: 'Double tap to close',
  EXPAND: 'Double tap to expand',
  COLLAPSE: 'Double tap to collapse',
} as const;

/**
 * Creates accessibility props for buttons
 * @param label - The accessible label for the button
 * @param hint - Optional hint for additional context
 * @param disabled - Whether the button is disabled
 * @returns Accessibility props object
 */
export function createButtonA11yProps(
  label: string,
  hint?: string,
  disabled = false
) {
  return {
    accessible: true,
    accessibilityRole: A11Y_ROLES.BUTTON,
    accessibilityLabel: label,
    accessibilityHint: hint || A11Y_HINTS.DOUBLE_TAP,
    accessibilityState: { disabled } as AccessibilityState,
    // iOS specific
    accessibilityTraits: disabled ? A11Y_TRAITS.DISABLED : A11Y_TRAITS.BUTTON,
  };
}

/**
 * Creates accessibility props for text elements
 * @param text - The text content (used as label if no explicit label provided)
 * @param label - Optional explicit accessibility label
 * @param role - The semantic role (defaults to 'text')
 * @returns Accessibility props object
 */
export function createTextA11yProps(
  text: string,
  label?: string,
  role: AccessibilityRole = A11Y_ROLES.TEXT
) {
  return {
    accessible: true,
    accessibilityRole: role,
    accessibilityLabel: label || text,
  };
}

/**
 * Creates accessibility props for headers
 * @param level - Header level (1-6)
 * @param text - Header text content
 * @returns Accessibility props object
 */
export function createHeaderA11yProps(level: 1 | 2 | 3 | 4 | 5 | 6, text: string) {
  return {
    accessible: true,
    accessibilityRole: A11Y_ROLES.HEADER,
    accessibilityLabel: `${text}, heading level ${level}`,
    // iOS specific
    accessibilityTraits: A11Y_TRAITS.HEADER,
  };
}

/**
 * Creates accessibility props for links
 * @param label - The link text or description
 * @param destination - Optional description of where the link leads
 * @returns Accessibility props object
 */
export function createLinkA11yProps(label: string, destination?: string) {
  const hint = destination ? `Navigates to ${destination}` : A11Y_HINTS.NAVIGATE;
  
  return {
    accessible: true,
    accessibilityRole: A11Y_ROLES.LINK,
    accessibilityLabel: label,
    accessibilityHint: hint,
    // iOS specific
    accessibilityTraits: A11Y_TRAITS.LINK,
  };
}

/**
 * Creates accessibility props for images
 * @param alt - Alternative text describing the image
 * @param decorative - Whether the image is purely decorative
 * @returns Accessibility props object
 */
export function createImageA11yProps(alt: string, decorative = false) {
  if (decorative) {
    return {
      accessible: false,
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no-hide-descendants' as const,
    };
  }

  return {
    accessible: true,
    accessibilityRole: A11Y_ROLES.IMAGE,
    accessibilityLabel: alt,
    // iOS specific
    accessibilityTraits: A11Y_TRAITS.IMAGE,
  };
}

/**
 * Creates accessibility props for search inputs
 * @param placeholder - Placeholder text
 * @param value - Current search value
 * @returns Accessibility props object
 */
export function createSearchA11yProps(placeholder: string, value?: string) {
  return {
    accessible: true,
    accessibilityRole: A11Y_ROLES.SEARCH,
    accessibilityLabel: placeholder,
    accessibilityValue: value ? { text: value } as AccessibilityValue : undefined,
    accessibilityHint: A11Y_HINTS.SEARCH,
    // iOS specific
    accessibilityTraits: A11Y_TRAITS.SEARCH_FIELD,
  };
}

/**
 * Creates accessibility props for list items
 * @param label - The item label
 * @param position - Item position in list (e.g., "1 of 10")
 * @param selected - Whether the item is selected
 * @returns Accessibility props object
 */
export function createListItemA11yProps(
  label: string,
  position?: string,
  selected = false
) {
  const fullLabel = position ? `${label}, ${position}` : label;
  const traits = selected ? [...A11Y_TRAITS.BUTTON, ...A11Y_TRAITS.SELECTED] : A11Y_TRAITS.BUTTON;

  return {
    accessible: true,
    accessibilityRole: A11Y_ROLES.LIST_ITEM,
    accessibilityLabel: fullLabel,
    accessibilityState: { selected } as AccessibilityState,
    accessibilityHint: A11Y_HINTS.DOUBLE_TAP,
    // iOS specific
    accessibilityTraits: traits,
  };
}

/**
 * Creates accessibility props for tabs
 * @param label - Tab label
 * @param selected - Whether the tab is selected
 * @param position - Tab position (e.g., "tab 1 of 3")
 * @returns Accessibility props object
 */
export function createTabA11yProps(
  label: string,
  selected = false,
  position?: string
) {
  const fullLabel = position ? `${label}, ${position}` : label;
  
  return {
    accessible: true,
    accessibilityRole: A11Y_ROLES.TAB,
    accessibilityLabel: fullLabel,
    accessibilityState: { selected } as AccessibilityState,
    accessibilityHint: A11Y_HINTS.DOUBLE_TAP,
    // iOS specific  
    accessibilityTraits: selected ? A11Y_TRAITS.SELECTED : A11Y_TRAITS.BUTTON,
  };
}

/**
 * Creates accessibility props for alerts/error messages
 * @param message - The alert message
 * @param live - Whether this is a live region that should announce updates
 * @returns Accessibility props object
 */
export function createAlertA11yProps(message: string, live = true) {
  return {
    accessible: true,
    accessibilityRole: A11Y_ROLES.ALERT,
    accessibilityLabel: message,
    accessibilityLiveRegion: live ? 'polite' as const : 'none' as const,
  };
}

/**
 * Creates accessibility props for toggles/switches
 * @param label - The toggle label
 * @param value - Current toggle state
 * @param onText - Text to announce when on (default: "on")
 * @param offText - Text to announce when off (default: "off")  
 * @returns Accessibility props object
 */
export function createToggleA11yProps(
  label: string,
  value: boolean,
  onText = 'on',
  offText = 'off'
) {
  return {
    accessible: true,
    accessibilityRole: A11Y_ROLES.SWITCH,
    accessibilityLabel: label,
    accessibilityValue: { text: value ? onText : offText } as AccessibilityValue,
    accessibilityState: { checked: value } as AccessibilityState,
    accessibilityHint: A11Y_HINTS.DOUBLE_TAP,
  };
}

/**
 * Minimum touch target size (44x44 points) as per Apple/Google guidelines
 */
export const MIN_TOUCH_TARGET_SIZE = 44;

/**
 * Checks if a size meets minimum touch target requirements
 * @param width - Width in points
 * @param height - Height in points  
 * @returns Whether the size meets accessibility requirements
 */
export function meetsMinTouchTarget(width: number, height: number): boolean {
  return width >= MIN_TOUCH_TARGET_SIZE && height >= MIN_TOUCH_TARGET_SIZE;
}

/**
 * Creates styles to ensure minimum touch target size
 * @param currentWidth - Current width
 * @param currentHeight - Current height
 * @returns Style object with minimum dimensions
 */
export function ensureMinTouchTarget(currentWidth: number, currentHeight: number) {
  return {
    minWidth: Math.max(currentWidth, MIN_TOUCH_TARGET_SIZE),
    minHeight: Math.max(currentHeight, MIN_TOUCH_TARGET_SIZE),
  };
}

/**
 * Common accessibility announcements for screen readers
 */
export const A11Y_ANNOUNCEMENTS = {
  LOADING: 'Loading',
  LOADED: 'Content loaded', 
  ERROR: 'Error occurred',
  SUCCESS: 'Action completed successfully',
  SAVED: 'Changes saved',
  DELETED: 'Item deleted',
  ADDED: 'Item added',
  UPDATED: 'Item updated',
} as const;