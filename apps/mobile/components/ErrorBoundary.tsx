/**
 * Error Boundary component to catch and handle React errors gracefully
 */

import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { devError } from '../utils/config';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    devError('React Error Boundary caught an error', error);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    // Log to crash reporting service in production
    // TODO: Add crash reporting integration
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <View style={styles.errorCard}>
            <AlertTriangle size={48} color="#ef4444" style={styles.icon} />
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              We're sorry, but something unexpected happened. Please try again.
            </Text>
            
            {__DEV__ && this.state.error && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>Debug Information:</Text>
                <Text style={styles.debugText}>{this.state.error.message}</Text>
                {this.state.error.stack && (
                  <Text style={styles.stackTrace}>
                    {this.state.error.stack.substring(0, 500)}...
                  </Text>
                )}
              </View>
            )}
            
            <Pressable style={styles.retryButton} onPress={this.handleReset}>
              <RefreshCw size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    maxWidth: 400,
    width: '100%',
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  debugInfo: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  debugTitle: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  debugText: {
    color: '#ef4444',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  stackTrace: {
    color: 'rgba(239,68,68,0.7)',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

/**
 * Wrapper component for specific features
 */
export function SafeComponent({ 
  children, 
  componentName = 'Component' 
}: { 
  children: ReactNode; 
  componentName?: string;
}) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        devError(`Error in ${componentName}`, error);
      }}
      fallback={
        <View style={styles.container}>
          <Text style={styles.message}>
            {componentName} encountered an error. Please refresh the app.
          </Text>
        </View>
      }
    >
      {children}
    </ErrorBoundary>
  );
}