/**
 * Secure configuration management for the Circles app
 * Handles environment variables with validation and fallbacks
 */

interface AppConfig {
  ocr: {
    apiKey: string;
    endpoint: string;
    timeout: number;
    maxRetries: number;
  };
  development: {
    enableConsoleLogging: boolean;
    enableDebugMode: boolean;
  };
}

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Validates that required environment variables are present and valid
 */
function validateEnvironment(): void {
  const requiredVars = ['EXPO_PUBLIC_OCR_SPACE_API_KEY'];
  const missing: string[] = [];

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value || value.trim().length === 0) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new ConfigurationError(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
}

/**
 * Validates OCR API key format
 */
function validateOcrApiKey(apiKey: string): boolean {
  // OCR.space API keys are typically alphanumeric with specific length
  if (!apiKey || apiKey.length < 10) {
    return false;
  }
  
  // Check for common placeholder values
  const placeholders = ['your_api_key', 'api_key_here', 'helloworld', 'test'];
  if (placeholders.some(placeholder => apiKey.toLowerCase().includes(placeholder))) {
    return false;
  }
  
  return true;
}

/**
 * Gets the application configuration with validation
 */
export function getAppConfig(): AppConfig {
  // Validate environment first
  validateEnvironment();
  
  const ocrApiKey = process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY!;
  
  // Validate OCR API key
  if (!validateOcrApiKey(ocrApiKey)) {
    throw new ConfigurationError(
      'Invalid OCR API key. Please ensure you have a valid OCR.space API key in your .env file.'
    );
  }
  
  return {
    ocr: {
      apiKey: ocrApiKey,
      endpoint: 'https://api.ocr.space/parse/image',
      timeout: 30000, // 30 seconds
      maxRetries: 3,
    },
    development: {
      enableConsoleLogging: __DEV__ || false,
      enableDebugMode: __DEV__ || false,
    },
  };
}

/**
 * Safe way to check if configuration is valid without throwing
 */
export function isConfigurationValid(): { valid: boolean; error?: string } {
  try {
    getAppConfig();
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Unknown configuration error' 
    };
  }
}

/**
 * Development-only logging utility
 */
export function devLog(message: string, ...args: any[]): void {
  const config = getAppConfig();
  if (config.development.enableConsoleLogging) {
    console.log(`[All My Circles Dev] ${message}`, ...args);
  }
}

/**
 * Development-only error logging utility
 */
export function devError(message: string, error?: Error): void {
  const config = getAppConfig();
  if (config.development.enableConsoleLogging) {
    console.error(`[All My Circles Error] ${message}`, error);
  }
}