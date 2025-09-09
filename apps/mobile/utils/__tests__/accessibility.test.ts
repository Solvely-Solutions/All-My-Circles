/**
 * @fileoverview Tests for accessibility utilities
 */

import {
  createButtonA11yProps,
  createTextA11yProps,
  createHeaderA11yProps,
  createLinkA11yProps,
  createImageA11yProps,
  createSearchA11yProps,
  createListItemA11yProps,
  createTabA11yProps,
  createAlertA11yProps,
  createToggleA11yProps,
  meetsMinTouchTarget,
  ensureMinTouchTarget,
  MIN_TOUCH_TARGET_SIZE,
  A11Y_ROLES,
  A11Y_HINTS,
} from '../accessibility';

describe('accessibility utilities', () => {
  describe('createButtonA11yProps', () => {
    it('should create basic button accessibility props', () => {
      const props = createButtonA11yProps('Save');
      
      expect(props).toEqual({
        accessible: true,
        accessibilityRole: A11Y_ROLES.BUTTON,
        accessibilityLabel: 'Save',
        accessibilityHint: A11Y_HINTS.DOUBLE_TAP,
        accessibilityState: { disabled: false },
        accessibilityTraits: ['button'],
      });
    });

    it('should create disabled button accessibility props', () => {
      const props = createButtonA11yProps('Save', 'Save your changes', true);
      
      expect(props).toEqual({
        accessible: true,
        accessibilityRole: A11Y_ROLES.BUTTON,
        accessibilityLabel: 'Save',
        accessibilityHint: 'Save your changes',
        accessibilityState: { disabled: true },
        accessibilityTraits: ['disabled'],
      });
    });

    it('should use default hint when none provided', () => {
      const props = createButtonA11yProps('Delete');
      
      expect(props.accessibilityHint).toBe(A11Y_HINTS.DOUBLE_TAP);
    });
  });

  describe('createTextA11yProps', () => {
    it('should create basic text accessibility props', () => {
      const props = createTextA11yProps('Hello World');
      
      expect(props).toEqual({
        accessible: true,
        accessibilityRole: A11Y_ROLES.TEXT,
        accessibilityLabel: 'Hello World',
      });
    });

    it('should use explicit label when provided', () => {
      const props = createTextA11yProps('Display text', 'Screen reader text');
      
      expect(props.accessibilityLabel).toBe('Screen reader text');
    });

    it('should accept custom role', () => {
      const props = createTextA11yProps('Summary', undefined, A11Y_ROLES.HEADER);
      
      expect(props.accessibilityRole).toBe(A11Y_ROLES.HEADER);
    });
  });

  describe('createHeaderA11yProps', () => {
    it('should create header accessibility props with level', () => {
      const props = createHeaderA11yProps(2, 'Section Title');
      
      expect(props).toEqual({
        accessible: true,
        accessibilityRole: A11Y_ROLES.HEADER,
        accessibilityLabel: 'Section Title, heading level 2',
        accessibilityTraits: ['header'],
      });
    });

    it('should work with all heading levels', () => {
      for (let level = 1; level <= 6; level++) {
        const props = createHeaderA11yProps(level as any, 'Test');
        expect(props.accessibilityLabel).toBe(`Test, heading level ${level}`);
      }
    });
  });

  describe('createLinkA11yProps', () => {
    it('should create basic link accessibility props', () => {
      const props = createLinkA11yProps('Learn More');
      
      expect(props).toEqual({
        accessible: true,
        accessibilityRole: A11Y_ROLES.LINK,
        accessibilityLabel: 'Learn More',
        accessibilityHint: A11Y_HINTS.NAVIGATE,
        accessibilityTraits: ['link'],
      });
    });

    it('should include destination in hint when provided', () => {
      const props = createLinkA11yProps('Home', 'home page');
      
      expect(props.accessibilityHint).toBe('Navigates to home page');
    });
  });

  describe('createImageA11yProps', () => {
    it('should create accessible image props', () => {
      const props = createImageA11yProps('User profile photo');
      
      expect(props).toEqual({
        accessible: true,
        accessibilityRole: A11Y_ROLES.IMAGE,
        accessibilityLabel: 'User profile photo',
        accessibilityTraits: ['image'],
      });
    });

    it('should create decorative image props', () => {
      const props = createImageA11yProps('Decorative border', true);
      
      expect(props).toEqual({
        accessible: false,
        accessibilityElementsHidden: true,
        importantForAccessibility: 'no-hide-descendants',
      });
    });
  });

  describe('createSearchA11yProps', () => {
    it('should create basic search accessibility props', () => {
      const props = createSearchA11yProps('Search contacts');
      
      expect(props).toEqual({
        accessible: true,
        accessibilityRole: A11Y_ROLES.SEARCH,
        accessibilityLabel: 'Search contacts',
        accessibilityValue: undefined,
        accessibilityHint: A11Y_HINTS.SEARCH,
        accessibilityTraits: ['searchField'],
      });
    });

    it('should include current value when provided', () => {
      const props = createSearchA11yProps('Search contacts', 'john');
      
      expect(props.accessibilityValue).toEqual({ text: 'john' });
    });
  });

  describe('createListItemA11yProps', () => {
    it('should create basic list item accessibility props', () => {
      const props = createListItemA11yProps('Contact Name');
      
      expect(props).toEqual({
        accessible: true,
        accessibilityRole: A11Y_ROLES.LIST_ITEM,
        accessibilityLabel: 'Contact Name',
        accessibilityState: { selected: false },
        accessibilityHint: A11Y_HINTS.DOUBLE_TAP,
        accessibilityTraits: ['button'],
      });
    });

    it('should include position information when provided', () => {
      const props = createListItemA11yProps('Contact Name', '1 of 5');
      
      expect(props.accessibilityLabel).toBe('Contact Name, 1 of 5');
    });

    it('should handle selected state', () => {
      const props = createListItemA11yProps('Contact Name', undefined, true);
      
      expect(props.accessibilityState).toEqual({ selected: true });
      expect(props.accessibilityTraits).toContain('selected');
    });
  });

  describe('createTabA11yProps', () => {
    it('should create basic tab accessibility props', () => {
      const props = createTabA11yProps('Home');
      
      expect(props).toEqual({
        accessible: true,
        accessibilityRole: A11Y_ROLES.TAB,
        accessibilityLabel: 'Home',
        accessibilityState: { selected: false },
        accessibilityHint: A11Y_HINTS.DOUBLE_TAP,
        accessibilityTraits: ['button'],
      });
    });

    it('should handle selected tab state', () => {
      const props = createTabA11yProps('Home', true);
      
      expect(props.accessibilityState).toEqual({ selected: true });
      expect(props.accessibilityTraits).toEqual(['selected']);
    });

    it('should include position information', () => {
      const props = createTabA11yProps('Home', false, 'tab 1 of 3');
      
      expect(props.accessibilityLabel).toBe('Home, tab 1 of 3');
    });
  });

  describe('createAlertA11yProps', () => {
    it('should create basic alert accessibility props', () => {
      const props = createAlertA11yProps('Error occurred');
      
      expect(props).toEqual({
        accessible: true,
        accessibilityRole: A11Y_ROLES.ALERT,
        accessibilityLabel: 'Error occurred',
        accessibilityLiveRegion: 'polite',
      });
    });

    it('should disable live region when requested', () => {
      const props = createAlertA11yProps('Static message', false);
      
      expect(props.accessibilityLiveRegion).toBe('none');
    });
  });

  describe('createToggleA11yProps', () => {
    it('should create toggle accessibility props for off state', () => {
      const props = createToggleA11yProps('Dark Mode', false);
      
      expect(props).toEqual({
        accessible: true,
        accessibilityRole: A11Y_ROLES.SWITCH,
        accessibilityLabel: 'Dark Mode',
        accessibilityValue: { text: 'off' },
        accessibilityState: { checked: false },
        accessibilityHint: A11Y_HINTS.DOUBLE_TAP,
      });
    });

    it('should create toggle accessibility props for on state', () => {
      const props = createToggleA11yProps('Dark Mode', true);
      
      expect(props.accessibilityValue).toEqual({ text: 'on' });
      expect(props.accessibilityState).toEqual({ checked: true });
    });

    it('should use custom on/off text', () => {
      const props = createToggleA11yProps('Notifications', true, 'enabled', 'disabled');
      
      expect(props.accessibilityValue).toEqual({ text: 'enabled' });
    });
  });

  describe('meetsMinTouchTarget', () => {
    it('should return true for sizes meeting minimum requirements', () => {
      expect(meetsMinTouchTarget(44, 44)).toBe(true);
      expect(meetsMinTouchTarget(50, 44)).toBe(true);
      expect(meetsMinTouchTarget(44, 50)).toBe(true);
      expect(meetsMinTouchTarget(60, 60)).toBe(true);
    });

    it('should return false for sizes not meeting minimum requirements', () => {
      expect(meetsMinTouchTarget(30, 44)).toBe(false);
      expect(meetsMinTouchTarget(44, 30)).toBe(false);
      expect(meetsMinTouchTarget(30, 30)).toBe(false);
    });
  });

  describe('ensureMinTouchTarget', () => {
    it('should return original size when already meeting minimum', () => {
      const result = ensureMinTouchTarget(50, 60);
      
      expect(result).toEqual({
        minWidth: 50,
        minHeight: 60,
      });
    });

    it('should adjust size to meet minimum requirements', () => {
      const result = ensureMinTouchTarget(30, 35);
      
      expect(result).toEqual({
        minWidth: MIN_TOUCH_TARGET_SIZE,
        minHeight: MIN_TOUCH_TARGET_SIZE,
      });
    });

    it('should only adjust dimensions that are too small', () => {
      const result = ensureMinTouchTarget(30, 50);
      
      expect(result).toEqual({
        minWidth: MIN_TOUCH_TARGET_SIZE,
        minHeight: 50,
      });
    });
  });

  describe('constants', () => {
    it('should have minimum touch target size constant', () => {
      expect(MIN_TOUCH_TARGET_SIZE).toBe(44);
    });

    it('should have accessibility roles defined', () => {
      expect(A11Y_ROLES.BUTTON).toBe('button');
      expect(A11Y_ROLES.TEXT).toBe('text');
      expect(A11Y_ROLES.HEADER).toBe('header');
      expect(A11Y_ROLES.LINK).toBe('link');
      expect(A11Y_ROLES.IMAGE).toBe('image');
    });

    it('should have accessibility hints defined', () => {
      expect(A11Y_HINTS.DOUBLE_TAP).toBe('Double tap to activate');
      expect(A11Y_HINTS.NAVIGATE).toBe('Double tap to navigate');
      expect(A11Y_HINTS.SEARCH).toBe('Double tap to search');
    });
  });
});