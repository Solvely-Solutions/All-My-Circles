/**
 * @fileoverview Error Boundary Component - Catches and handles JavaScript errors in React components
 * 
 * This component provides a fallback UI when any JavaScript error occurs in the component tree.
 * It logs errors appropriately based on the environment and provides recovery options.
 * 
 * @author All My Circles Development Team
 * @version 1.0.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { GlassCard } from '../ui/GlassCard';
import { 
  createAlertA11yProps, 
  createButtonA11yProps, 
  createHeaderA11yProps,
  ensureMinTouchTarget 
} from '@/utils/accessibility';

/**
 * Props for the ErrorBoundary component
 * @interface ErrorBoundaryProps
 */
interface ErrorBoundaryProps {
  /** Child components to render when no error occurs */
  children: ReactNode;
  /** Custom fallback component to render instead of the default error UI */
  fallback?: ReactNode;
  /** Callback function called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to show a reload button in the error UI */
  enableReload?: boolean;
}

/**
 * Internal state of the ErrorBoundary component
 * @interface ErrorBoundaryState
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The error that was caught, if any */
  error?: Error;
  /** Additional information about where the error occurred */
  errorInfo?: ErrorInfo;
  /** Unique identifier for this error instance */
  errorId: string;
}

/**
 * Error boundary component that catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 * 
 * @class ErrorBoundary
 * @extends {Component<ErrorBoundaryProps, ErrorBoundaryState>}
 * 
 * @example
 * ```tsx
 * <ErrorBoundary 
 *   enableReload={true}
 *   onError={(error, errorInfo) => reportError(error, errorInfo)}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  /**
   * Creates an instance of ErrorBoundary
   * @param {ErrorBoundaryProps} props - Component props
   */
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      errorId: '',
    };
  }

  /**
   * Static method called when an error is thrown during rendering
   * Updates component state to trigger error UI rendering
   * 
   * @static
   * @param {Error} error - The error that was thrown
   * @returns {Partial<ErrorBoundaryState>} State update to trigger error UI
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  /**
   * Called after an error has been thrown by a descendant component
   * Used for logging errors and calling error handlers
   * 
   * @param {Error} error - The error that was thrown
   * @param {ErrorInfo} errorInfo - Information about where the error occurred
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Store error info in state
    this.setState({
      error,
      errorInfo,
    });

    // In production, you might want to log this to an error reporting service
    // Example: Sentry, Bugsnag, etc.
    // logErrorToService(error, errorInfo);
  }

  /**
   * Resets the error boundary state to allow recovery from errors
   * Called when user clicks the "Try Again" button
   */
  handleReload = (): void => {
    // Reset the error boundary state
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: '',
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render default error UI
      return (
        <View style={styles.container}>
          <GlassCard style={styles.errorCard}>
            <View style={styles.errorHeader}>
              <AlertTriangle 
                size={32} 
                color="#ef4444"
                // Make icon accessible for screen readers
                accessible={true}
                accessibilityRole="image"
                accessibilityLabel="Error alert icon"
              />
              <Text 
                style={styles.errorTitle}
                {...createHeaderA11yProps(1, 'Something went wrong')}
              >
                Something went wrong
              </Text>
            </View>
            
            <Text 
              style={styles.errorMessage}
              {...createAlertA11yProps(
                'We encountered an unexpected error. This has been logged and we\'ll look into it.',
                true
              )}
            >
              We encountered an unexpected error. This has been logged and we'll look into it.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.debugInfo}>
                <Text 
                  style={styles.debugTitle}
                  {...createHeaderA11yProps(2, 'Debug Information')}
                >
                  Debug Information:
                </Text>
                <Text 
                  style={styles.debugText}
                  accessible={true}
                  accessibilityRole="text"
                  accessibilityLabel={`Error details: ${this.state.error.name}, ${this.state.error.message}`}
                >
                  {this.state.error.name}: {this.state.error.message}
                </Text>
                <Text 
                  style={styles.errorId}
                  accessible={true}
                  accessibilityRole="text"
                  accessibilityLabel={`Error ID: ${this.state.errorId}`}
                >
                  Error ID: {this.state.errorId}
                </Text>
              </View>
            )}

            {this.props.enableReload && (
              <Pressable 
                style={[styles.reloadButton, ensureMinTouchTarget(44, 44)]} 
                onPress={this.handleReload}
                {...createButtonA11yProps(
                  'Try Again',
                  'Attempts to reload the component that crashed'
                )}
              >
                <RefreshCw 
                  size={16} 
                  color="white"
                  accessible={false} // Icon is decorative, button handles accessibility
                />
                <Text style={styles.reloadButtonText}>Try Again</Text>
              </Pressable>
            )}
          </GlassCard>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    padding: 24,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  errorHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginTop: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  debugInfo: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  errorId: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
    fontFamily: 'monospace',
  },
  reloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  reloadButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});