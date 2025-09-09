/**
 * @fileoverview Error handling hook for functional components
 * 
 * Provides comprehensive error handling utilities for React functional components,
 * including state management, alert display, async operation handling, and retry logic.
 * 
 * @author All My Circles Development Team
 * @version 1.0.0
 */

import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { AppError } from '../types/utils';

/**
 * Custom hook for comprehensive error handling in functional components
 * 
 * @returns {Object} Error handling utilities and state
 * @returns {AppError | null} error - Current error state
 * @returns {boolean} isLoading - Whether an async operation is in progress
 * @returns {Function} handleError - Function to handle and display errors
 * @returns {Function} clearError - Function to clear the current error
 * @returns {Function} executeWithErrorHandling - Execute async functions with error handling
 * @returns {Function} retry - Retry a failed operation with exponential backoff
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { error, isLoading, executeWithErrorHandling } = useErrorHandler();
 * 
 *   const fetchData = () => {
 *     executeWithErrorHandling(async () => {
 *       const data = await api.getData();
 *       setData(data);
 *     }, {
 *       context: 'fetching user data',
 *       onSuccess: (data) => console.log('Success!', data)
 *     });
 *   };
 * 
 *   return (
 *     <View>
 *       {isLoading && <LoadingSpinner />}
 *       {error && <ErrorMessage error={error} />}
 *       <Button onPress={fetchData} title="Load Data" />
 *     </View>
 *   );
 * }
 * ```
 */
export function useErrorHandler() {
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Handle an error by setting it in state and optionally showing an alert
   */
  const handleError = useCallback((error: unknown, showAlert = true, context?: string) => {
    const appError: AppError = formatError(error, context);
    setError(appError);

    if (__DEV__) {
      console.error('Error handled:', appError);
    }

    if (showAlert) {
      Alert.alert(
        'Error',
        appError.message,
        [{ text: 'OK', onPress: clearError }]
      );
    }

    // Log to error reporting service in production
    // logErrorToService(appError);
  }, [clearError]);

  /**
   * Execute an async function with error handling
   */
  const executeWithErrorHandling = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: {
      showAlert?: boolean;
      context?: string;
      onSuccess?: (result: T) => void;
      onError?: (error: AppError) => void;
    } = {}
  ): Promise<T | null> => {
    const { showAlert = true, context, onSuccess, onError } = options;

    try {
      setIsLoading(true);
      clearError();
      
      const result = await asyncFn();
      onSuccess?.(result);
      return result;
    } catch (error) {
      const appError = formatError(error, context);
      setError(appError);
      onError?.(appError);

      if (showAlert) {
        Alert.alert(
          'Error',
          appError.message,
          [{ text: 'OK' }]
        );
      }

      if (__DEV__) {
        console.error('Async operation failed:', appError);
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  /**
   * Retry a failed operation
   */
  const retry = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T | null> => {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        attempts++;
        const result = await asyncFn();
        clearError();
        return result;
      } catch (error) {
        if (attempts === maxRetries) {
          handleError(error, true, `Failed after ${maxRetries} attempts`);
          return null;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempts));
      }
    }
    
    return null;
  }, [handleError, clearError]);

  return {
    error,
    isLoading,
    handleError,
    clearError,
    executeWithErrorHandling,
    retry,
  };
}

/**
 * Format an unknown error into a standardized AppError
 */
function formatError(error: unknown, context?: string): AppError {
  const timestamp = Date.now() as any; // Brand as Timestamp
  
  if (error instanceof Error) {
    return {
      message: context ? `${context}: ${error.message}` : error.message,
      code: error.name,
      details: {
        stack: error.stack,
        context,
      },
      timestamp,
    };
  }
  
  if (typeof error === 'string') {
    return {
      message: context ? `${context}: ${error}` : error,
      timestamp,
    };
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return {
      message: context ? `${context}: ${String(error.message)}` : String(error.message),
      code: 'code' in error ? String(error.code) : undefined,
      details: error,
      timestamp,
    };
  }
  
  return {
    message: context ? `${context}: Unknown error occurred` : 'Unknown error occurred',
    details: { originalError: error },
    timestamp,
  };
}

/**
 * Hook for handling network errors specifically
 */
export function useNetworkErrorHandler() {
  const { handleError, ...rest } = useErrorHandler();

  const handleNetworkError = useCallback((error: unknown, operation?: string) => {
    const networkError = formatNetworkError(error, operation);
    handleError(networkError, true);
  }, [handleError]);

  return {
    ...rest,
    handleNetworkError,
  };
}

function formatNetworkError(error: unknown, operation?: string): AppError {
  const timestamp = Date.now() as any;
  const baseMessage = operation ? `Failed to ${operation}` : 'Network operation failed';
  
  if (error instanceof Error) {
    if (error.message.includes('Network request failed')) {
      return {
        message: `${baseMessage}: Please check your internet connection`,
        code: 'NETWORK_ERROR',
        timestamp,
      };
    }
    
    if (error.message.includes('timeout')) {
      return {
        message: `${baseMessage}: Request timed out`,
        code: 'TIMEOUT_ERROR',
        timestamp,
      };
    }
  }
  
  return {
    message: baseMessage,
    code: 'UNKNOWN_NETWORK_ERROR',
    details: { originalError: error },
    timestamp,
  };
}