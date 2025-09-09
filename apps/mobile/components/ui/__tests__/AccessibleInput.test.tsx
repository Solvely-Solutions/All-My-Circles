/**
 * @fileoverview Tests for AccessibleInput component
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AccessibleInput } from '../AccessibleInput';

describe('AccessibleInput', () => {
  describe('rendering', () => {
    it('should render with label', () => {
      const { getByText } = render(
        <AccessibleInput
          label="Email Address"
          onChangeText={jest.fn()}
        />
      );
      
      expect(getByText('Email Address')).toBeTruthy();
    });

    it('should render without label when showLabel is false', () => {
      const { queryByText } = render(
        <AccessibleInput
          label="Email Address"
          showLabel={false}
          onChangeText={jest.fn()}
        />
      );
      
      expect(queryByText('Email Address')).toBeNull();
    });

    it('should render required indicator', () => {
      const { getByText } = render(
        <AccessibleInput
          label="Email Address"
          required
          onChangeText={jest.fn()}
        />
      );
      
      expect(getByText('*')).toBeTruthy();
    });

    it('should render help text', () => {
      const { getByText } = render(
        <AccessibleInput
          label="Email Address"
          helpText="We'll use this to send notifications"
          onChangeText={jest.fn()}
        />
      );
      
      expect(getByText("We'll use this to send notifications")).toBeTruthy();
    });

    it('should render error message', () => {
      const { getByText } = render(
        <AccessibleInput
          label="Email Address"
          hasError
          errorMessage="Invalid email format"
          onChangeText={jest.fn()}
        />
      );
      
      expect(getByText('Invalid email format')).toBeTruthy();
    });

    it('should not show help text when there is an error', () => {
      const { queryByText, getByText } = render(
        <AccessibleInput
          label="Email Address"
          helpText="We'll use this to send notifications"
          hasError
          errorMessage="Invalid email format"
          onChangeText={jest.fn()}
        />
      );
      
      expect(getByText('Invalid email format')).toBeTruthy();
      expect(queryByText("We'll use this to send notifications")).toBeNull();
    });

    it('should render left element', () => {
      const { getByTestId } = render(
        <AccessibleInput
          label="Email Address"
          leftElement={<div testID="left-element">@</div>}
          onChangeText={jest.fn()}
        />
      );
      
      expect(getByTestId('left-element')).toBeTruthy();
    });

    it('should render right element', () => {
      const { getByTestId } = render(
        <AccessibleInput
          label="Email Address"
          rightElement={<div testID="right-element">Clear</div>}
          onChangeText={jest.fn()}
        />
      );
      
      expect(getByTestId('right-element')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('should have proper accessibility props', () => {
      const { getByDisplayValue } = render(
        <AccessibleInput
          label="Email Address"
          value="test@example.com"
          onChangeText={jest.fn()}
        />
      );
      
      const input = getByDisplayValue('test@example.com');
      expect(input).toHaveProp('accessible', true);
      expect(input).toHaveProp('accessibilityRole', 'text');
      expect(input).toHaveProp('accessibilityLabel', 'Email Address');
    });

    it('should include required in accessibility label', () => {
      const { getByDisplayValue } = render(
        <AccessibleInput
          label="Email Address"
          value="test@example.com"
          required
          onChangeText={jest.fn()}
        />
      );
      
      const input = getByDisplayValue('test@example.com');
      expect(input).toHaveProp('accessibilityLabel', 'Email Address, required');
      expect(input).toHaveProp('accessibilityRequired', true);
    });

    it('should use custom accessibility label', () => {
      const { getByDisplayValue } = render(
        <AccessibleInput
          label="Email"
          accessibilityLabel="Enter your email address"
          value="test@example.com"
          onChangeText={jest.fn()}
        />
      );
      
      const input = getByDisplayValue('test@example.com');
      expect(input).toHaveProp('accessibilityLabel', expect.stringContaining('Enter your email address'));
    });

    it('should include help text in accessibility label', () => {
      const { getByDisplayValue } = render(
        <AccessibleInput
          label="Email Address"
          helpText="We'll send notifications here"
          value="test@example.com"
          onChangeText={jest.fn()}
        />
      );
      
      const input = getByDisplayValue('test@example.com');
      expect(input).toHaveProp('accessibilityLabel', expect.stringContaining("We'll send notifications here"));
    });

    it('should include error message in accessibility label', () => {
      const { getByDisplayValue } = render(
        <AccessibleInput
          label="Email Address"
          hasError
          errorMessage="Invalid email format"
          value="test@example.com"
          onChangeText={jest.fn()}
        />
      );
      
      const input = getByDisplayValue('test@example.com');
      expect(input).toHaveProp('accessibilityLabel', expect.stringContaining('Error: Invalid email format'));
    });

    it('should have search role for search variant', () => {
      const { getByPlaceholderText } = render(
        <AccessibleInput
          label="Search"
          placeholder="Search contacts"
          variant="search"
          onChangeText={jest.fn()}
        />
      );
      
      const input = getByPlaceholderText('Search contacts');
      expect(input).toHaveProp('accessibilityRole', 'search');
    });
  });

  describe('styling variants', () => {
    it('should apply default variant styles', () => {
      const { getByDisplayValue } = render(
        <AccessibleInput
          label="Email"
          value="test@example.com"
          onChangeText={jest.fn()}
        />
      );
      
      const input = getByDisplayValue('test@example.com');
      expect(input).toHaveStyle({
        borderWidth: 1,
        backgroundColor: '#ffffff',
      });
    });

    it('should apply outline variant styles', () => {
      const { getByDisplayValue } = render(
        <AccessibleInput
          label="Email"
          variant="outline"
          value="test@example.com"
          onChangeText={jest.fn()}
        />
      );
      
      const input = getByDisplayValue('test@example.com');
      expect(input).toHaveStyle({
        borderWidth: 1,
        backgroundColor: '#ffffff',
      });
    });

    it('should apply search variant styles', () => {
      const { getByDisplayValue } = render(
        <AccessibleInput
          label="Search"
          variant="search"
          value="test query"
          onChangeText={jest.fn()}
        />
      );
      
      const input = getByDisplayValue('test query');
      expect(input).toHaveStyle({
        backgroundColor: '#f9fafb',
      });
    });

    it('should apply error styles when hasError is true', () => {
      const { getByDisplayValue } = render(
        <AccessibleInput
          label="Email"
          hasError
          value="invalid-email"
          onChangeText={jest.fn()}
        />
      );
      
      const input = getByDisplayValue('invalid-email');
      expect(input).toHaveStyle({
        borderColor: '#ef4444',
      });
    });

    it('should apply focus styles', () => {
      const { getByDisplayValue } = render(
        <AccessibleInput
          label="Email"
          value="test@example.com"
          onChangeText={jest.fn()}
        />
      );
      
      const input = getByDisplayValue('test@example.com');
      
      fireEvent(input, 'focus');
      
      // Focus styles are applied via state, testing the behavior
      expect(input).toHaveStyle({
        borderColor: '#3b82f6', // Focus color when not in error state
      });
    });
  });

  describe('sizing', () => {
    it('should apply small size styles', () => {
      const { getByDisplayValue } = render(
        <AccessibleInput
          label="Email"
          size="small"
          value="test@example.com"
          onChangeText={jest.fn()}
        />
      );
      
      const input = getByDisplayValue('test@example.com');
      expect(input).toHaveStyle({
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        minHeight: 36,
      });
    });

    it('should apply medium size styles by default', () => {
      const { getByDisplayValue } = render(
        <AccessibleInput
          label="Email"
          value="test@example.com"
          onChangeText={jest.fn()}
        />
      );
      
      const input = getByDisplayValue('test@example.com');
      expect(input).toHaveStyle({
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        minHeight: 44,
      });
    });

    it('should apply large size styles', () => {
      const { getByDisplayValue } = render(
        <AccessibleInput
          label="Email"
          size="large"
          value="test@example.com"
          onChangeText={jest.fn()}
        />
      );
      
      const input = getByDisplayValue('test@example.com');
      expect(input).toHaveStyle({
        paddingHorizontal: 20,
        paddingVertical: 16,
        fontSize: 18,
        minHeight: 52,
      });
    });
  });

  describe('minimum touch target', () => {
    it('should ensure minimum touch target size', () => {
      const { getByDisplayValue } = render(
        <AccessibleInput
          label="Email"
          value="test@example.com"
          onChangeText={jest.fn()}
        />
      );
      
      const input = getByDisplayValue('test@example.com');
      expect(input).toHaveStyle({
        minWidth: 44,
        minHeight: 44,
      });
    });
  });

  describe('interactions', () => {
    it('should call onChangeText when text changes', () => {
      const onChangeText = jest.fn();
      const { getByDisplayValue } = render(
        <AccessibleInput
          label="Email"
          value="test@example.com"
          onChangeText={onChangeText}
        />
      );
      
      const input = getByDisplayValue('test@example.com');
      fireEvent.changeText(input, 'new@example.com');
      
      expect(onChangeText).toHaveBeenCalledWith('new@example.com');
    });

    it('should call onFocus when input is focused', () => {
      const onFocus = jest.fn();
      const { getByDisplayValue } = render(
        <AccessibleInput
          label="Email"
          value="test@example.com"
          onFocus={onFocus}
          onChangeText={jest.fn()}
        />
      );
      
      const input = getByDisplayValue('test@example.com');
      fireEvent(input, 'focus');
      
      expect(onFocus).toHaveBeenCalled();
    });

    it('should call onBlur when input loses focus', () => {
      const onBlur = jest.fn();
      const { getByDisplayValue } = render(
        <AccessibleInput
          label="Email"
          value="test@example.com"
          onBlur={onBlur}
          onChangeText={jest.fn()}
        />
      );
      
      const input = getByDisplayValue('test@example.com');
      fireEvent(input, 'blur');
      
      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe('element positioning', () => {
    it('should adjust padding for left element', () => {
      const { getByDisplayValue } = render(
        <AccessibleInput
          label="Email"
          value="test@example.com"
          leftElement={<div>@</div>}
          onChangeText={jest.fn()}
        />
      );
      
      const input = getByDisplayValue('test@example.com');
      expect(input).toHaveStyle({
        paddingLeft: 48,
      });
    });

    it('should adjust padding for right element', () => {
      const { getByDisplayValue } = render(
        <AccessibleInput
          label="Email"
          value="test@example.com"
          rightElement={<div>Clear</div>}
          onChangeText={jest.fn()}
        />
      );
      
      const input = getByDisplayValue('test@example.com');
      expect(input).toHaveStyle({
        paddingRight: 48,
      });
    });

    it('should adjust padding for both left and right elements', () => {
      const { getByDisplayValue } = render(
        <AccessibleInput
          label="Email"
          value="test@example.com"
          leftElement={<div>@</div>}
          rightElement={<div>Clear</div>}
          onChangeText={jest.fn()}
        />
      );
      
      const input = getByDisplayValue('test@example.com');
      expect(input).toHaveStyle({
        paddingLeft: 48,
        paddingRight: 48,
      });
    });
  });
});