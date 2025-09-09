/**
 * @fileoverview Accessibility Configuration
 * 
 * Centralized accessibility configuration and settings for the All My Circles app.
 * This file defines app-wide accessibility preferences, constants, and
 * configuration options that ensure consistent a11y implementation.
 * 
 * @author All My Circles Development Team
 * @version 1.0.0
 */

import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Accessibility feature flags and settings
 */
export const A11Y_CONFIG = {
  /** Whether to enable enhanced screen reader announcements */
  ENHANCED_ANNOUNCEMENTS: true,
  
  /** Whether to enable haptic feedback for accessibility */
  HAPTIC_FEEDBACK: true,
  
  /** Whether to automatically focus elements for screen readers */
  AUTO_FOCUS: true,
  
  /** Whether to enable reduced motion when system setting is on */
  RESPECT_REDUCE_MOTION: true,
  
  /** Whether to enable high contrast mode when system setting is on */
  RESPECT_HIGH_CONTRAST: true,
  
  /** Minimum delay between accessibility announcements (ms) */
  ANNOUNCEMENT_DELAY: 500,
  
  /** Whether to group related accessibility elements */
  ENABLE_GROUPING: true,
} as const;

/**
 * Custom accessibility timing constants
 */
export const A11Y_TIMING = {
  /** Time to wait before making accessibility announcements */
  ANNOUNCEMENT_DELAY: 100,
  
  /** Time to wait after screen transitions before focusing */
  FOCUS_DELAY: 300,
  
  /** Debounce time for rapid accessibility state changes */
  STATE_CHANGE_DEBOUNCE: 150,
  
  /** Timeout for accessibility info queries */
  INFO_QUERY_TIMEOUT: 1000,
} as const;

/**
 * Accessibility-specific text constants
 */
export const A11Y_STRINGS = {
  // Navigation
  BACK_BUTTON: 'Go back to previous screen',
  CLOSE_BUTTON: 'Close current screen',
  MENU_BUTTON: 'Open navigation menu',
  
  // Actions
  EDIT_ITEM: 'Edit this item',
  DELETE_ITEM: 'Delete this item',
  ADD_ITEM: 'Add new item',
  SAVE_CHANGES: 'Save your changes',
  CANCEL_ACTION: 'Cancel current action',
  
  // Status
  LOADING_DATA: 'Loading data, please wait',
  DATA_LOADED: 'Data has finished loading',
  OPERATION_COMPLETE: 'Operation completed successfully',
  OPERATION_FAILED: 'Operation failed, please try again',
  
  // Forms
  REQUIRED_FIELD: 'This field is required',
  INVALID_INPUT: 'Please check your input',
  FORM_ERRORS: 'Please correct the errors in the form',
  
  // Lists
  ITEM_OF_TOTAL: (current: number, total: number) => `Item ${current} of ${total}`,
  LIST_EMPTY: 'No items to display',
  
  // Search
  SEARCH_RESULTS: (count: number) => `${count} search results found`,
  NO_SEARCH_RESULTS: 'No results found for your search',
  CLEAR_SEARCH: 'Clear search query',
  
  // Contacts specific
  CONTACT_ADDED: 'Contact added successfully',
  CONTACT_UPDATED: 'Contact updated successfully',
  CONTACT_DELETED: 'Contact deleted successfully',
  
} as const;

/**
 * Screen reader detection and state management
 */
export class AccessibilityManager {
  private static isScreenReaderEnabled = false;
  private static isReduceMotionEnabled = false;
  private static isHighContrastEnabled = false;
  private static listeners: Array<(enabled: boolean) => void> = [];

  /**
   * Initialize accessibility manager and detect current settings
   */
  static async initialize(): Promise<void> {
    try {
      // Check if screen reader is enabled
      this.isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      
      // Check if reduce motion is enabled (iOS only)
      if (Platform.OS === 'ios') {
        this.isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      }

      // Listen for accessibility changes
      AccessibilityInfo.addEventListener('screenReaderChanged', this.handleScreenReaderChange);
      
      if (Platform.OS === 'ios') {
        AccessibilityInfo.addEventListener('reduceMotionChanged', this.handleReduceMotionChange);
      }

    } catch (error) {
      console.warn('Failed to initialize accessibility manager:', error);
    }
  }

  /**
   * Cleanup listeners when app is destroyed
   */
  static cleanup(): void {
    AccessibilityInfo.removeEventListener('screenReaderChanged', this.handleScreenReaderChange);
    
    if (Platform.OS === 'ios') {
      AccessibilityInfo.removeEventListener('reduceMotionChanged', this.handleReduceMotionChange);
    }
    
    this.listeners = [];
  }

  /**
   * Handle screen reader state changes
   */
  private static handleScreenReaderChange = (enabled: boolean): void => {
    this.isScreenReaderEnabled = enabled;
    this.notifyListeners(enabled);
  };

  /**
   * Handle reduce motion state changes
   */
  private static handleReduceMotionChange = (enabled: boolean): void => {
    this.isReduceMotionEnabled = enabled;
  };

  /**
   * Notify registered listeners of screen reader changes
   */
  private static notifyListeners(enabled: boolean): void {
    this.listeners.forEach(listener => {
      try {
        listener(enabled);
      } catch (error) {
        console.warn('Error notifying accessibility listener:', error);
      }
    });
  }

  /**
   * Check if screen reader is currently enabled
   */
  static isScreenReaderActive(): boolean {
    return this.isScreenReaderEnabled;
  }

  /**
   * Check if reduce motion is enabled
   */
  static isReduceMotionActive(): boolean {
    return this.isReduceMotionEnabled && A11Y_CONFIG.RESPECT_REDUCE_MOTION;
  }

  /**
   * Subscribe to screen reader state changes
   */
  static addScreenReaderListener(listener: (enabled: boolean) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Make an accessibility announcement
   */
  static announce(message: string, priority: 'low' | 'high' = 'low'): void {
    if (!this.isScreenReaderEnabled || !message.trim()) {
      return;
    }

    // Add delay to prevent announcement conflicts
    setTimeout(() => {
      try {
        AccessibilityInfo.announceForAccessibility(message);
      } catch (error) {
        console.warn('Failed to make accessibility announcement:', error);
      }
    }, priority === 'high' ? 0 : A11Y_TIMING.ANNOUNCEMENT_DELAY);
  }

  /**
   * Focus an element for screen readers
   */
  static focusElement(elementRef: any): void {
    if (!this.isScreenReaderEnabled || !elementRef) {
      return;
    }

    setTimeout(() => {
      try {
        elementRef.focus?.();
        AccessibilityInfo.setAccessibilityFocus(elementRef);
      } catch (error) {
        console.warn('Failed to focus element for accessibility:', error);
      }
    }, A11Y_TIMING.FOCUS_DELAY);
  }
}

/**
 * Hook-like utility for screen reader detection in functional components
 */
export const useScreenReader = () => {
  return {
    isEnabled: AccessibilityManager.isScreenReaderActive(),
    isReduceMotion: AccessibilityManager.isReduceMotionActive(),
    announce: AccessibilityManager.announce,
    focusElement: AccessibilityManager.focusElement,
  };
};