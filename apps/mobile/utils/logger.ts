/**
 * Development Logger Utility
 * Simple logging functions for development and debugging
 */

const isDevelopment = true; // Always log in development

export function devLog(message: string, ...args: any[]): void {
  if (isDevelopment) {
    console.log(`[All My Circles] ${message}`, ...args);
  }
}

export function devError(message: string, error?: Error, ...args: any[]): void {
  if (isDevelopment) {
    console.error(`[All My Circles ERROR] ${message}`, error, ...args);
  }
}

export function devWarn(message: string, ...args: any[]): void {
  if (isDevelopment) {
    console.warn(`[All My Circles WARN] ${message}`, ...args);
  }
}

export function devInfo(message: string, ...args: any[]): void {
  if (isDevelopment) {
    console.info(`[All My Circles INFO] ${message}`, ...args);
  }
}