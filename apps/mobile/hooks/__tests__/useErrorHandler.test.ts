/**
 * @fileoverview Tests for useErrorHandler hook
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useErrorHandler, useNetworkErrorHandler } from '../useErrorHandler';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeEach(() => {
  jest.clearAllMocks();
  console.error = jest.fn();
  console.log = jest.fn();
  // Set __DEV__ to true for testing
  (global as any).__DEV__ = true;
});

afterEach(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

describe('useErrorHandler', () => {
  describe('initial state', () => {
    it('should initialize with null error and not loading', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('handleError', () => {
    it('should handle string errors', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      act(() => {
        result.current.handleError('Something went wrong');
      });
      
      expect(result.current.error).toEqual({
        message: 'Something went wrong',
        timestamp: expect.any(Number),
      });
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Something went wrong',
        [{ text: 'OK', onPress: expect.any(Function) }]
      );
    });

    it('should handle Error objects', () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error('Test error');
      testError.stack = 'Stack trace';
      
      act(() => {
        result.current.handleError(testError);
      });
      
      expect(result.current.error).toEqual({
        message: 'Test error',
        code: 'Error',
        details: {
          stack: 'Stack trace',
          context: undefined,
        },
        timestamp: expect.any(Number),
      });
      
      expect(console.error).toHaveBeenCalledWith('Error handled:', expect.any(Object));
    });

    it('should include context in error message', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      act(() => {
        result.current.handleError('Network failed', true, 'fetching user data');
      });
      
      expect(result.current.error?.message).toBe('fetching user data: Network failed');
    });

    it('should not show alert when showAlert is false', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      act(() => {
        result.current.handleError('Error', false);
      });
      
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('should handle object errors with message property', () => {
      const { result } = renderHook(() => useErrorHandler());
      const errorObj = { message: 'Object error', code: 'OBJ_ERROR' };
      
      act(() => {
        result.current.handleError(errorObj);
      });
      
      expect(result.current.error).toEqual({
        message: 'Object error',
        code: 'OBJ_ERROR',
        details: errorObj,
        timestamp: expect.any(Number),
      });
    });

    it('should handle unknown error types', () => {
      const { result } = renderHook(() => useErrorHandler());
      const unknownError = { data: 'some data' };
      
      act(() => {
        result.current.handleError(unknownError);
      });
      
      expect(result.current.error).toEqual({
        message: 'Unknown error occurred',
        details: { originalError: unknownError },
        timestamp: expect.any(Number),
      });
    });
  });

  describe('clearError', () => {
    it('should clear the current error', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      // Set an error first
      act(() => {
        result.current.handleError('Test error');
      });
      
      expect(result.current.error).not.toBeNull();
      
      // Clear the error
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
    });
  });

  describe('executeWithErrorHandling', () => {
    it('should execute successful async function', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const mockFn = jest.fn().mockResolvedValue('success');
      const onSuccess = jest.fn();
      
      let returnValue: any;
      
      await act(async () => {
        returnValue = await result.current.executeWithErrorHandling(mockFn, {
          onSuccess,
        });
      });
      
      expect(mockFn).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledWith('success');
      expect(returnValue).toBe('success');
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle async function errors', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const mockError = new Error('Async error');
      const mockFn = jest.fn().mockRejectedValue(mockError);
      const onError = jest.fn();
      
      let returnValue: any;
      
      await act(async () => {
        returnValue = await result.current.executeWithErrorHandling(mockFn, {
          onError,
        });
      });
      
      expect(mockFn).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Async error',
        code: 'Error',
      }));
      expect(returnValue).toBeNull();
      expect(result.current.error).not.toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should set loading state during execution', async () => {
      const { result } = renderHook(() => useErrorHandler());
      let loadingDuringExecution = false;
      
      const mockFn = jest.fn().mockImplementation(async () => {
        loadingDuringExecution = result.current.isLoading;
        return 'success';
      });
      
      await act(async () => {
        await result.current.executeWithErrorHandling(mockFn);
      });
      
      expect(loadingDuringExecution).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should clear previous error before execution', async () => {
      const { result } = renderHook(() => useErrorHandler());
      
      // Set an initial error
      act(() => {
        result.current.handleError('Initial error');
      });
      
      expect(result.current.error).not.toBeNull();
      
      // Execute successful function
      await act(async () => {
        await result.current.executeWithErrorHandling(
          jest.fn().mockResolvedValue('success')
        );
      });
      
      expect(result.current.error).toBeNull();
    });

    it('should include context in error message', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const mockFn = jest.fn().mockRejectedValue(new Error('API failed'));
      
      await act(async () => {
        await result.current.executeWithErrorHandling(mockFn, {
          context: 'loading user profile',
        });
      });
      
      expect(result.current.error?.message).toBe('loading user profile: API failed');
    });
  });

  describe('retry', () => {
    it('should succeed on first attempt', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const mockFn = jest.fn().mockResolvedValue('success');
      
      let returnValue: any;
      
      await act(async () => {
        returnValue = await result.current.retry(mockFn);
      });
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(returnValue).toBe('success');
      expect(result.current.error).toBeNull();
    });

    it('should retry failed attempts with exponential backoff', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Attempt 1'))
        .mockRejectedValueOnce(new Error('Attempt 2'))
        .mockResolvedValueOnce('success');
      
      let returnValue: any;
      
      await act(async () => {
        returnValue = await result.current.retry(mockFn, 3, 10); // Short delay for testing
      });
      
      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(returnValue).toBe('success');
      expect(result.current.error).toBeNull();
    });

    it('should fail after max retries', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));
      
      let returnValue: any;
      
      await act(async () => {
        returnValue = await result.current.retry(mockFn, 2, 10);
      });
      
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(returnValue).toBeNull();
      expect(result.current.error?.message).toBe('Failed after 2 attempts: Always fails');
    });
  });
});

describe('useNetworkErrorHandler', () => {
  it('should format network errors appropriately', () => {
    const { result } = renderHook(() => useNetworkErrorHandler());
    
    act(() => {
      result.current.handleNetworkError(new Error('Network request failed'), 'fetch user data');
    });
    
    expect(result.current.error).toEqual({
      message: 'Failed to fetch user data: Please check your internet connection',
      code: 'NETWORK_ERROR',
      timestamp: expect.any(Number),
    });
  });

  it('should format timeout errors', () => {
    const { result } = renderHook(() => useNetworkErrorHandler());
    
    act(() => {
      result.current.handleNetworkError(new Error('Request timeout'));
    });
    
    expect(result.current.error).toEqual({
      message: 'Network operation failed: Request timed out',
      code: 'TIMEOUT_ERROR',
      timestamp: expect.any(Number),
    });
  });

  it('should handle unknown network errors', () => {
    const { result } = renderHook(() => useNetworkErrorHandler());
    
    act(() => {
      result.current.handleNetworkError('Unknown network issue');
    });
    
    expect(result.current.error).toEqual({
      message: 'Network operation failed',
      code: 'UNKNOWN_NETWORK_ERROR',
      details: { originalError: 'Unknown network issue' },
      timestamp: expect.any(Number),
    });
  });
});