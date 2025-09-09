/**
 * @fileoverview Tests for ErrorBoundary component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary } from '../ErrorBoundary';

// Mock the GlassCard component
jest.mock('../../ui/GlassCard', () => ({
  GlassCard: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <Text>No error</Text>;
};

// Mock console methods
const originalConsoleError = console.error;

beforeEach(() => {
  console.error = jest.fn();
  (global as any).__DEV__ = true;
});

afterEach(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary', () => {
  describe('normal operation', () => {
    it('should render children when no error occurs', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      expect(getByText('No error')).toBeTruthy();
    });

    it('should render children with custom props', () => {
      const { getByText } = render(
        <ErrorBoundary enableReload>
          <Text>Test content</Text>
        </ErrorBoundary>
      );
      
      expect(getByText('Test content')).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('should render error UI when child throws error', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );
      
      expect(getByText('Something went wrong')).toBeTruthy();
      expect(getByText('We encountered an unexpected error. This has been logged and we\'ll look into it.')).toBeTruthy();
    });

    it('should render custom fallback when provided', () => {
      const customFallback = <Text>Custom error message</Text>;
      
      const { getByText } = render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );
      
      expect(getByText('Custom error message')).toBeTruthy();
    });

    it('should call onError callback when error occurs', () => {
      const onError = jest.fn();
      
      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );
      
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });

    it('should log error to console in development', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );
      
      expect(console.error).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.any(Object)
      );
    });
  });

  describe('reload functionality', () => {
    it('should show reload button when enableReload is true', () => {
      const { getByText } = render(
        <ErrorBoundary enableReload>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );
      
      expect(getByText('Try Again')).toBeTruthy();
    });

    it('should not show reload button when enableReload is false', () => {
      const { queryByText } = render(
        <ErrorBoundary enableReload={false}>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );
      
      expect(queryByText('Try Again')).toBeNull();
    });

    it('should not show reload button by default', () => {
      const { queryByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );
      
      expect(queryByText('Try Again')).toBeNull();
    });
  });

  describe('debug information', () => {
    it('should show debug info in development mode', () => {
      (global as any).__DEV__ = true;
      
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );
      
      expect(getByText('Debug Information:')).toBeTruthy();
      expect(getByText('Error: Test error message')).toBeTruthy();
      expect(getByText(/Error ID: error_/)).toBeTruthy();
    });

    it('should not show debug info in production mode', () => {
      (global as any).__DEV__ = false;
      
      const { queryByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );
      
      expect(queryByText('Debug Information:')).toBeNull();
      expect(queryByText('Error: Test error message')).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('should have proper accessibility props on error elements', () => {
      const { getByRole, getAllByRole } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );
      
      // Check for heading
      const headers = getAllByRole('header');
      expect(headers.length).toBeGreaterThan(0);
      
      // Check for alert
      const alerts = getAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
    });

    it('should have accessible reload button when enabled', () => {
      const { getByRole } = render(
        <ErrorBoundary enableReload>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );
      
      const reloadButton = getByRole('button');
      expect(reloadButton).toHaveProp('accessible', true);
      expect(reloadButton).toHaveProp('accessibilityRole', 'button');
      expect(reloadButton).toHaveProp('accessibilityLabel', 'Try Again');
      expect(reloadButton).toHaveProp('accessibilityHint', 'Attempts to reload the component that crashed');
    });

    it('should have minimum touch target for reload button', () => {
      const { getByRole } = render(
        <ErrorBoundary enableReload>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );
      
      const reloadButton = getByRole('button');
      expect(reloadButton).toHaveStyle({
        minWidth: 44,
        minHeight: 44,
      });
    });
  });

  describe('error ID generation', () => {
    it('should generate unique error IDs', () => {
      const { getByText: getByText1 } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );
      
      const { getByText: getByText2 } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );
      
      const errorId1 = getByText1(/Error ID: error_/).props.children;
      const errorId2 = getByText2(/Error ID: error_/).props.children;
      
      expect(errorId1).not.toEqual(errorId2);
    });

    it('should include timestamp in error ID', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );
      
      const errorIdText = getByText(/Error ID: error_/).props.children;
      expect(errorIdText).toMatch(/Error ID: error_\d+_/);
    });
  });

  describe('state management', () => {
    it('should update state when getDerivedStateFromError is called', () => {
      const testError = new Error('Test error');
      const newState = ErrorBoundary.getDerivedStateFromError(testError);
      
      expect(newState).toEqual({
        hasError: true,
        error: testError,
        errorId: expect.stringMatching(/error_\d+_[a-z0-9]+/),
      });
    });
  });
});