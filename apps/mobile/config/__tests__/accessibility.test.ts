/**
 * @fileoverview Tests for accessibility configuration and manager
 */

import { AccessibilityInfo } from 'react-native';
import { AccessibilityManager, A11Y_CONFIG, A11Y_TIMING, A11Y_STRINGS } from '../accessibility';

// Mock AccessibilityInfo
const mockAccessibilityInfo = AccessibilityInfo as any;

// Mock timers
jest.useFakeTimers();

describe('AccessibilityManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(false);
    mockAccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(false);
    mockAccessibilityInfo.announceForAccessibility.mockImplementation(() => {});
    mockAccessibilityInfo.setAccessibilityFocus.mockImplementation(() => {});
    mockAccessibilityInfo.addEventListener.mockImplementation(() => {});
    mockAccessibilityInfo.removeEventListener.mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllTimers();
    AccessibilityManager.cleanup();
  });

  describe('initialize', () => {
    it('should detect screen reader status', async () => {
      mockAccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(true);
      
      await AccessibilityManager.initialize();
      
      expect(mockAccessibilityInfo.isScreenReaderEnabled).toHaveBeenCalled();
      expect(AccessibilityManager.isScreenReaderActive()).toBe(true);
    });

    it('should detect reduce motion status on iOS', async () => {
      const originalPlatform = process.env.EXPO_OS;
      process.env.EXPO_OS = 'ios';
      
      mockAccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(true);
      
      await AccessibilityManager.initialize();
      
      expect(mockAccessibilityInfo.isReduceMotionEnabled).toHaveBeenCalled();
      
      process.env.EXPO_OS = originalPlatform;
    });

    it('should setup event listeners', async () => {
      await AccessibilityManager.initialize();
      
      expect(mockAccessibilityInfo.addEventListener).toHaveBeenCalledWith(
        'screenReaderChanged',
        expect.any(Function)
      );
    });

    it('should handle initialization errors gracefully', async () => {
      mockAccessibilityInfo.isScreenReaderEnabled.mockRejectedValue(new Error('Access denied'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      await AccessibilityManager.initialize();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to initialize accessibility manager:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should remove event listeners', () => {
      AccessibilityManager.cleanup();
      
      expect(mockAccessibilityInfo.removeEventListener).toHaveBeenCalledWith(
        'screenReaderChanged',
        expect.any(Function)
      );
    });
  });

  describe('screen reader detection', () => {
    it('should return current screen reader status', async () => {
      mockAccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(true);
      await AccessibilityManager.initialize();
      
      expect(AccessibilityManager.isScreenReaderActive()).toBe(true);
    });

    it('should update screen reader status when changed', async () => {
      await AccessibilityManager.initialize();
      
      // Get the event handler that was registered
      const eventHandler = mockAccessibilityInfo.addEventListener.mock.calls.find(
        call => call[0] === 'screenReaderChanged'
      )?.[1];
      
      // Simulate screen reader being enabled
      if (eventHandler) {
        eventHandler(true);
      }
      
      expect(AccessibilityManager.isScreenReaderActive()).toBe(true);
    });
  });

  describe('reduce motion detection', () => {
    it('should respect reduce motion setting', async () => {
      const originalPlatform = process.env.EXPO_OS;
      process.env.EXPO_OS = 'ios';
      
      mockAccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(true);
      await AccessibilityManager.initialize();
      
      expect(AccessibilityManager.isReduceMotionActive()).toBe(true);
      
      process.env.EXPO_OS = originalPlatform;
    });

    it('should respect config setting for reduce motion', async () => {
      const originalConfig = A11Y_CONFIG.RESPECT_REDUCE_MOTION;
      (A11Y_CONFIG as any).RESPECT_REDUCE_MOTION = false;
      
      const originalPlatform = process.env.EXPO_OS;
      process.env.EXPO_OS = 'ios';
      
      mockAccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(true);
      await AccessibilityManager.initialize();
      
      expect(AccessibilityManager.isReduceMotionActive()).toBe(false);
      
      (A11Y_CONFIG as any).RESPECT_REDUCE_MOTION = originalConfig;
      process.env.EXPO_OS = originalPlatform;
    });
  });

  describe('listener management', () => {
    it('should add and remove listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      const unsubscribe1 = AccessibilityManager.addScreenReaderListener(listener1);
      const unsubscribe2 = AccessibilityManager.addScreenReaderListener(listener2);
      
      // Both listeners should be called
      const eventHandler = mockAccessibilityInfo.addEventListener.mock.calls.find(
        call => call[0] === 'screenReaderChanged'
      )?.[1];
      
      if (eventHandler) {
        eventHandler(true);
      }
      
      expect(listener1).toHaveBeenCalledWith(true);
      expect(listener2).toHaveBeenCalledWith(true);
      
      // Remove first listener
      unsubscribe1();
      jest.clearAllMocks();
      
      if (eventHandler) {
        eventHandler(false);
      }
      
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledWith(false);
      
      // Remove second listener
      unsubscribe2();
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      AccessibilityManager.addScreenReaderListener(errorListener);
      
      const eventHandler = mockAccessibilityInfo.addEventListener.mock.calls.find(
        call => call[0] === 'screenReaderChanged'
      )?.[1];
      
      if (eventHandler) {
        eventHandler(true);
      }
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error notifying accessibility listener:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('announcements', () => {
    beforeEach(async () => {
      mockAccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(true);
      await AccessibilityManager.initialize();
    });

    it('should make announcements when screen reader is active', () => {
      AccessibilityManager.announce('Test message');
      
      jest.runAllTimers();
      
      expect(mockAccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Test message');
    });

    it('should not make announcements when screen reader is inactive', async () => {
      // Reinitialize with screen reader disabled
      mockAccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(false);
      await AccessibilityManager.initialize();
      
      AccessibilityManager.announce('Test message');
      
      jest.runAllTimers();
      
      expect(mockAccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
    });

    it('should not make announcements for empty messages', () => {
      AccessibilityManager.announce('');
      AccessibilityManager.announce('   ');
      
      jest.runAllTimers();
      
      expect(mockAccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
    });

    it('should handle high priority announcements immediately', () => {
      AccessibilityManager.announce('High priority', 'high');
      
      expect(mockAccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('High priority');
    });

    it('should delay low priority announcements', () => {
      AccessibilityManager.announce('Low priority', 'low');
      
      expect(mockAccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
      
      jest.runAllTimers();
      
      expect(mockAccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Low priority');
    });

    it('should handle announcement errors gracefully', () => {
      mockAccessibilityInfo.announceForAccessibility.mockImplementation(() => {
        throw new Error('Announcement failed');
      });
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      AccessibilityManager.announce('Test message');
      
      jest.runAllTimers();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to make accessibility announcement:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('element focusing', () => {
    beforeEach(async () => {
      mockAccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(true);
      await AccessibilityManager.initialize();
    });

    it('should focus elements when screen reader is active', () => {
      const mockElement = { focus: jest.fn() };
      
      AccessibilityManager.focusElement(mockElement);
      
      jest.runAllTimers();
      
      expect(mockElement.focus).toHaveBeenCalled();
      expect(mockAccessibilityInfo.setAccessibilityFocus).toHaveBeenCalledWith(mockElement);
    });

    it('should not focus elements when screen reader is inactive', async () => {
      mockAccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(false);
      await AccessibilityManager.initialize();
      
      const mockElement = { focus: jest.fn() };
      
      AccessibilityManager.focusElement(mockElement);
      
      jest.runAllTimers();
      
      expect(mockElement.focus).not.toHaveBeenCalled();
      expect(mockAccessibilityInfo.setAccessibilityFocus).not.toHaveBeenCalled();
    });

    it('should not focus null elements', () => {
      AccessibilityManager.focusElement(null);
      
      jest.runAllTimers();
      
      expect(mockAccessibilityInfo.setAccessibilityFocus).not.toHaveBeenCalled();
    });

    it('should handle focus errors gracefully', () => {
      const mockElement = {
        focus: jest.fn().mockImplementation(() => {
          throw new Error('Focus failed');
        })
      };
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      AccessibilityManager.focusElement(mockElement);
      
      jest.runAllTimers();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to focus element for accessibility:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
});

describe('A11Y_CONFIG', () => {
  it('should have default configuration values', () => {
    expect(A11Y_CONFIG.ENHANCED_ANNOUNCEMENTS).toBe(true);
    expect(A11Y_CONFIG.HAPTIC_FEEDBACK).toBe(true);
    expect(A11Y_CONFIG.AUTO_FOCUS).toBe(true);
    expect(A11Y_CONFIG.RESPECT_REDUCE_MOTION).toBe(true);
    expect(A11Y_CONFIG.RESPECT_HIGH_CONTRAST).toBe(true);
    expect(A11Y_CONFIG.ENABLE_GROUPING).toBe(true);
    expect(typeof A11Y_CONFIG.ANNOUNCEMENT_DELAY).toBe('number');
  });
});

describe('A11Y_TIMING', () => {
  it('should have timing constants', () => {
    expect(typeof A11Y_TIMING.ANNOUNCEMENT_DELAY).toBe('number');
    expect(typeof A11Y_TIMING.FOCUS_DELAY).toBe('number');
    expect(typeof A11Y_TIMING.STATE_CHANGE_DEBOUNCE).toBe('number');
    expect(typeof A11Y_TIMING.INFO_QUERY_TIMEOUT).toBe('number');
  });
});

describe('A11Y_STRINGS', () => {
  it('should have navigation strings', () => {
    expect(A11Y_STRINGS.BACK_BUTTON).toBe('Go back to previous screen');
    expect(A11Y_STRINGS.CLOSE_BUTTON).toBe('Close current screen');
    expect(A11Y_STRINGS.MENU_BUTTON).toBe('Open navigation menu');
  });

  it('should have action strings', () => {
    expect(A11Y_STRINGS.EDIT_ITEM).toBe('Edit this item');
    expect(A11Y_STRINGS.DELETE_ITEM).toBe('Delete this item');
    expect(A11Y_STRINGS.ADD_ITEM).toBe('Add new item');
    expect(A11Y_STRINGS.SAVE_CHANGES).toBe('Save your changes');
    expect(A11Y_STRINGS.CANCEL_ACTION).toBe('Cancel current action');
  });

  it('should have dynamic string functions', () => {
    expect(A11Y_STRINGS.ITEM_OF_TOTAL(3, 10)).toBe('Item 3 of 10');
    expect(A11Y_STRINGS.SEARCH_RESULTS(5)).toBe('5 search results found');
  });

  it('should have contact-specific strings', () => {
    expect(A11Y_STRINGS.CONTACT_ADDED).toBe('Contact added successfully');
    expect(A11Y_STRINGS.CONTACT_UPDATED).toBe('Contact updated successfully');
    expect(A11Y_STRINGS.CONTACT_DELETED).toBe('Contact deleted successfully');
  });
});