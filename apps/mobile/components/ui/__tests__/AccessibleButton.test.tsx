/**
 * @fileoverview Tests for AccessibleButton component
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { AccessibleButton } from '../AccessibleButton';

// Mock haptics
jest.mock('expo-haptics');
const mockHaptics = Haptics as jest.Mocked<typeof Haptics>;

describe('AccessibleButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_OS = 'ios';
  });

  describe('rendering', () => {
    it('should render with title', () => {
      const { getByText } = render(
        <AccessibleButton title="Save" onPress={jest.fn()} />
      );
      
      expect(getByText('Save')).toBeTruthy();
    });

    it('should render with left icon', () => {
      const { getByTestId } = render(
        <AccessibleButton
          title="Save"
          leftIcon={<div testID="left-icon">Icon</div>}
          onPress={jest.fn()}
        />
      );
      
      expect(getByTestId('left-icon')).toBeTruthy();
    });

    it('should render with right icon', () => {
      const { getByTestId } = render(
        <AccessibleButton
          title="Save"
          rightIcon={<div testID="right-icon">Icon</div>}
          onPress={jest.fn()}
        />
      );
      
      expect(getByTestId('right-icon')).toBeTruthy();
    });

    it('should show loading indicator when loading', () => {
      const { getByTestId, queryByText } = render(
        <AccessibleButton
          title="Save"
          loading
          onPress={jest.fn()}
          testID="button"
        />
      );
      
      // ActivityIndicator should be present
      expect(getByTestId('button')).toBeTruthy();
      // Title should still be visible
      expect(queryByText('Save')).toBeTruthy();
    });

    it('should not render icons when loading', () => {
      const { queryByTestId } = render(
        <AccessibleButton
          title="Save"
          loading
          leftIcon={<div testID="left-icon">Icon</div>}
          rightIcon={<div testID="right-icon">Icon</div>}
          onPress={jest.fn()}
        />
      );
      
      expect(queryByTestId('left-icon')).toBeNull();
      expect(queryByTestId('right-icon')).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('should have proper accessibility props', () => {
      const { getByRole } = render(
        <AccessibleButton title="Save" onPress={jest.fn()} />
      );
      
      const button = getByRole('button');
      expect(button).toHaveProp('accessible', true);
      expect(button).toHaveProp('accessibilityRole', 'button');
      expect(button).toHaveProp('accessibilityLabel', 'Save');
    });

    it('should use custom accessibility label', () => {
      const { getByRole } = render(
        <AccessibleButton
          title="Save"
          accessibilityLabel="Save your changes"
          onPress={jest.fn()}
        />
      );
      
      const button = getByRole('button');
      expect(button).toHaveProp('accessibilityLabel', 'Save your changes');
    });

    it('should include accessibility hint', () => {
      const { getByRole } = render(
        <AccessibleButton
          title="Save"
          accessibilityHint="Saves the current form"
          onPress={jest.fn()}
        />
      );
      
      const button = getByRole('button');
      expect(button).toHaveProp('accessibilityHint', 'Saves the current form');
    });

    it('should indicate disabled state in accessibility', () => {
      const { getByRole } = render(
        <AccessibleButton title="Save" disabled onPress={jest.fn()} />
      );
      
      const button = getByRole('button');
      expect(button).toHaveProp('accessibilityState', { disabled: true });
    });

    it('should indicate loading state in accessibility', () => {
      const { getByRole } = render(
        <AccessibleButton title="Save" loading onPress={jest.fn()} />
      );
      
      const button = getByRole('button');
      expect(button).toHaveProp('accessibilityState', { disabled: true });
    });
  });

  describe('interactions', () => {
    it('should call onPress when pressed', () => {
      const onPress = jest.fn();
      const { getByRole } = render(
        <AccessibleButton title="Save" onPress={onPress} />
      );
      
      fireEvent.press(getByRole('button'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should not call onPress when disabled', () => {
      const onPress = jest.fn();
      const { getByRole } = render(
        <AccessibleButton title="Save" disabled onPress={onPress} />
      );
      
      fireEvent.press(getByRole('button'));
      expect(onPress).not.toHaveBeenCalled();
    });

    it('should not call onPress when loading', () => {
      const onPress = jest.fn();
      const { getByRole } = render(
        <AccessibleButton title="Save" loading onPress={onPress} />
      );
      
      fireEvent.press(getByRole('button'));
      expect(onPress).not.toHaveBeenCalled();
    });

    it('should trigger haptic feedback on iOS', () => {
      const { getByRole } = render(
        <AccessibleButton title="Save" onPress={jest.fn()} />
      );
      
      fireEvent.press(getByRole('button'));
      
      expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Light
      );
    });

    it('should not trigger haptic feedback on Android', () => {
      process.env.EXPO_OS = 'android';
      
      const { getByRole } = render(
        <AccessibleButton title="Save" onPress={jest.fn()} />
      );
      
      fireEvent.press(getByRole('button'));
      
      expect(mockHaptics.impactAsync).not.toHaveBeenCalled();
    });

    it('should not trigger haptic feedback when disabled', () => {
      const { getByRole } = render(
        <AccessibleButton title="Save" hapticFeedback={false} onPress={jest.fn()} />
      );
      
      fireEvent.press(getByRole('button'));
      
      expect(mockHaptics.impactAsync).not.toHaveBeenCalled();
    });
  });

  describe('styling variants', () => {
    it('should apply primary variant styles by default', () => {
      const { getByRole } = render(
        <AccessibleButton title="Save" onPress={jest.fn()} />
      );
      
      const button = getByRole('button');
      expect(button).toHaveStyle({ backgroundColor: '#3b82f6' });
    });

    it('should apply secondary variant styles', () => {
      const { getByRole } = render(
        <AccessibleButton title="Save" variant="secondary" onPress={jest.fn()} />
      );
      
      const button = getByRole('button');
      expect(button).toHaveStyle({ backgroundColor: '#e2e8f0' });
    });

    it('should apply outline variant styles', () => {
      const { getByRole } = render(
        <AccessibleButton title="Save" variant="outline" onPress={jest.fn()} />
      );
      
      const button = getByRole('button');
      expect(button).toHaveStyle({
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#3b82f6',
      });
    });

    it('should apply ghost variant styles', () => {
      const { getByRole } = render(
        <AccessibleButton title="Save" variant="ghost" onPress={jest.fn()} />
      );
      
      const button = getByRole('button');
      expect(button).toHaveStyle({ backgroundColor: 'transparent' });
    });

    it('should apply danger variant styles', () => {
      const { getByRole } = render(
        <AccessibleButton title="Delete" variant="danger" onPress={jest.fn()} />
      );
      
      const button = getByRole('button');
      expect(button).toHaveStyle({ backgroundColor: '#ef4444' });
    });

    it('should apply disabled styles when disabled', () => {
      const { getByRole } = render(
        <AccessibleButton title="Save" disabled onPress={jest.fn()} />
      );
      
      const button = getByRole('button');
      expect(button).toHaveStyle({ backgroundColor: '#94a3b8' });
    });
  });

  describe('sizing', () => {
    it('should apply small size styles', () => {
      const { getByRole } = render(
        <AccessibleButton title="Save" size="small" onPress={jest.fn()} />
      );
      
      const button = getByRole('button');
      expect(button).toHaveStyle({
        paddingHorizontal: 12,
        paddingVertical: 8,
        minHeight: 36,
      });
    });

    it('should apply medium size styles by default', () => {
      const { getByRole } = render(
        <AccessibleButton title="Save" onPress={jest.fn()} />
      );
      
      const button = getByRole('button');
      expect(button).toHaveStyle({
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 44,
      });
    });

    it('should apply large size styles', () => {
      const { getByRole } = render(
        <AccessibleButton title="Save" size="large" onPress={jest.fn()} />
      );
      
      const button = getByRole('button');
      expect(button).toHaveStyle({
        paddingHorizontal: 24,
        paddingVertical: 16,
        minHeight: 52,
      });
    });

    it('should apply full width when requested', () => {
      const { getByRole } = render(
        <AccessibleButton title="Save" fullWidth onPress={jest.fn()} />
      );
      
      const button = getByRole('button');
      expect(button).toHaveStyle({ alignSelf: 'stretch' });
    });
  });

  describe('minimum touch target', () => {
    it('should ensure minimum touch target size', () => {
      const { getByRole } = render(
        <AccessibleButton title="Save" onPress={jest.fn()} />
      );
      
      const button = getByRole('button');
      expect(button).toHaveStyle({
        minWidth: 44,
        minHeight: 44,
      });
    });
  });

  describe('press states', () => {
    it('should apply pressed styles when pressed', async () => {
      const { getByRole } = render(
        <AccessibleButton title="Save" onPress={jest.fn()} />
      );
      
      const button = getByRole('button');
      
      fireEvent(button, 'pressIn');
      
      await waitFor(() => {
        expect(button).toHaveStyle({
          opacity: 0.8,
          transform: [{ scale: 0.98 }],
        });
      });
    });

    it('should not apply pressed styles when disabled', () => {
      const { getByRole } = render(
        <AccessibleButton title="Save" disabled onPress={jest.fn()} />
      );
      
      const button = getByRole('button');
      
      fireEvent(button, 'pressIn');
      
      expect(button).not.toHaveStyle({
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
      });
    });

    it('should not apply pressed styles when loading', () => {
      const { getByRole } = render(
        <AccessibleButton title="Save" loading onPress={jest.fn()} />
      );
      
      const button = getByRole('button');
      
      fireEvent(button, 'pressIn');
      
      expect(button).not.toHaveStyle({
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
      });
    });
  });
});