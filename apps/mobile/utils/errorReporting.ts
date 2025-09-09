/**
 * Error reporting and logging utilities
 */

import { AppError, Timestamp } from '../types/utils';

interface ErrorReport {
  id: string;
  error: AppError;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  breadcrumbs: Breadcrumb[];
  deviceInfo: DeviceInfo;
  appVersion: string;
  timestamp: Timestamp;
}

interface Breadcrumb {
  timestamp: Timestamp;
  message: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  category: string;
  data?: Record<string, any>;
}

interface DeviceInfo {
  platform: string;
  platformVersion: string;
  appVersion: string;
  buildVersion: string;
  deviceModel?: string;
  screenSize?: { width: number; height: number };
  isEmulator: boolean;
}

class ErrorReporter {
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 50;
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  /**
   * Set the current user ID for error reports
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Add a breadcrumb to the error trail
   */
  addBreadcrumb(
    message: string,
    level: Breadcrumb['level'] = 'info',
    category: string = 'general',
    data?: Record<string, any>
  ): void {
    const breadcrumb: Breadcrumb = {
      timestamp: Date.now() as Timestamp,
      message,
      level,
      category,
      data,
    };

    this.breadcrumbs.push(breadcrumb);

    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }

    if (__DEV__) {
      console.log(`[${level.toUpperCase()}] ${category}: ${message}`, data);
    }
  }

  /**
   * Report an error
   */
  async reportError(error: AppError, additionalData?: Record<string, any>): Promise<void> {
    const report: ErrorReport = {
      id: this.generateErrorId(),
      error: {
        ...error,
        details: {
          ...error.details,
          ...additionalData,
        },
      },
      userId: this.userId,
      sessionId: this.sessionId,
      breadcrumbs: [...this.breadcrumbs],
      deviceInfo: await this.getDeviceInfo(),
      appVersion: this.getAppVersion(),
      timestamp: Date.now() as Timestamp,
    };

    // Log to console in development
    if (__DEV__) {
      console.group('🚨 Error Report');
      console.error('Error:', report.error);
      console.log('Report ID:', report.id);
      console.log('Session ID:', report.sessionId);
      console.log('Breadcrumbs:', report.breadcrumbs);
      console.groupEnd();
    }

    // In production, send to error reporting service
    if (!__DEV__) {
      await this.sendToReportingService(report);
    }

    // Store locally for offline support
    await this.storeErrorLocally(report);
  }

  /**
   * Report a caught exception
   */
  reportException(error: Error, context?: string, additionalData?: Record<string, any>): void {
    const appError: AppError = {
      message: error.message,
      code: error.name,
      details: {
        stack: error.stack,
        context,
        ...additionalData,
      },
      timestamp: Date.now() as Timestamp,
    };

    this.addBreadcrumb(
      `Exception: ${error.message}`,
      'error',
      'exception',
      { context, stack: error.stack }
    );

    this.reportError(appError);
  }

  /**
   * Report a handled error with custom message
   */
  reportHandledError(
    message: string,
    code?: string,
    additionalData?: Record<string, any>
  ): void {
    const appError: AppError = {
      message,
      code,
      details: additionalData,
      timestamp: Date.now() as Timestamp,
    };

    this.addBreadcrumb(
      `Handled Error: ${message}`,
      'error',
      'handled',
      additionalData
    );

    this.reportError(appError);
  }

  /**
   * Clear all breadcrumbs
   */
  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    if (typeof global !== 'undefined' && global.ErrorUtils) {
      const originalGlobalHandler = global.ErrorUtils.getGlobalHandler();
      
      global.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        this.addBreadcrumb(
          `Global Error: ${error.message}`,
          'error',
          'global',
          { isFatal, stack: error.stack }
        );

        this.reportException(error, 'Global Error Handler');
        
        // Call original handler
        originalGlobalHandler(error, isFatal);
      });
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getDeviceInfo(): Promise<DeviceInfo> {
    // In a real implementation, you'd get this from react-native-device-info
    return {
      platform: 'unknown',
      platformVersion: 'unknown',
      appVersion: this.getAppVersion(),
      buildVersion: 'unknown',
      isEmulator: __DEV__,
    };
  }

  private getAppVersion(): string {
    // Get from app config or package.json
    return '1.0.0';
  }

  private async sendToReportingService(report: ErrorReport): Promise<void> {
    try {
      // In production, send to your error reporting service
      // Example: Sentry, Bugsnag, custom API, etc.
      console.log('Would send error report to service:', report.id);
    } catch (error) {
      console.error('Failed to send error report:', error);
    }
  }

  private async storeErrorLocally(report: ErrorReport): Promise<void> {
    try {
      // Store in AsyncStorage or SQLite for offline support
      const storageKey = `error_report_${report.id}`;
      // await AsyncStorage.setItem(storageKey, JSON.stringify(report));
      console.log('Error report stored locally:', storageKey);
    } catch (error) {
      console.error('Failed to store error report locally:', error);
    }
  }
}

// Global instance
export const errorReporter = new ErrorReporter();

// Convenience functions
export const reportError = (error: AppError, additionalData?: Record<string, any>) => 
  errorReporter.reportError(error, additionalData);

export const reportException = (error: Error, context?: string, additionalData?: Record<string, any>) =>
  errorReporter.reportException(error, context, additionalData);

export const reportHandledError = (message: string, code?: string, additionalData?: Record<string, any>) =>
  errorReporter.reportHandledError(message, code, additionalData);

export const addBreadcrumb = (
  message: string,
  level: Breadcrumb['level'] = 'info',
  category: string = 'general',
  data?: Record<string, any>
) => errorReporter.addBreadcrumb(message, level, category, data);

export const setUserId = (userId: string) => errorReporter.setUserId(userId);

export const clearBreadcrumbs = () => errorReporter.clearBreadcrumbs();