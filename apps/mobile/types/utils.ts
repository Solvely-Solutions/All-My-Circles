/**
 * Utility types for enhanced type safety and developer experience
 */

// Make all properties of T optional except for the ones specified in K
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Make all properties of T required except for the ones specified in K
export type RequiredExcept<T, K extends keyof T> = Required<T> & Partial<Pick<T, K>>;

// Extract function return type
export type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;

// Make specified properties required
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Make specified properties optional
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Deep readonly type
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// Deep partial type
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Non-null type
export type NonNull<T> = T extends null | undefined ? never : T;

// Extract keys of T where value extends U
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

// Create a type with only the keys of T where value extends U
export type PickByType<T, U> = Pick<T, KeysOfType<T, U>>;

// Create a type without the keys of T where value extends U
export type OmitByType<T, U> = Omit<T, KeysOfType<T, U>>;

// Promise unwrapper
export type Awaited<T> = T extends Promise<infer U> ? U : T;

// Function parameters type
export type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;

// Construct a function signature with new return type
export type ChangeReturnType<T extends (...args: any) => any, R> = T extends (...args: infer A) => any 
  ? (...args: A) => R 
  : never;

// Brand type for nominal typing
export type Brand<T, U> = T & { __brand: U };

// ID types using branding for better type safety
export type ContactId = Brand<string, 'ContactId'>;
export type GroupId = Brand<string, 'GroupId'>;
export type SuggestionId = Brand<string, 'SuggestionId'>;

// Timestamp type for better semantic meaning
export type Timestamp = Brand<number, 'Timestamp'>;

// Email and Phone types
export type Email = Brand<string, 'Email'>;
export type Phone = Brand<string, 'Phone'>;
export type URL = Brand<string, 'URL'>;

// Validation result type
export type UtilValidationResult<T = string> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

// API Response wrapper
export type ApiResponse<T> = {
  success: true;
  data: T;
  message?: string;
} | {
  success: false;
  error: string;
  code?: string;
};

// Event handler types
export type EventHandler<T = void> = (event: T) => void;
export type AsyncEventHandler<T = void> = (event: T) => Promise<void>;

// Component with children
export type WithChildren<T = {}> = T & { children?: React.ReactNode };

// Optional children
export type MaybeWithChildren<T = {}> = T & { children?: React.ReactNode };

// Style prop type for React Native
export type StyleProp<T> = T | T[] | false | null | undefined;

// Testable component props
export type TestableProps = {
  testID?: string;
  accessibilityLabel?: string;
};

// Loading state type
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Generic error type
export interface AppError {
  message: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: Timestamp;
}