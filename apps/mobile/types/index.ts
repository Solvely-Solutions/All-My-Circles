/**
 * Main types export - centralized type definitions
 */

// Core domain types
export * from './contact';
export * from './app';
export * from './utils';

// Re-export common React types for convenience
export type { ReactNode, ComponentType, FC, PropsWithChildren } from 'react';
export type { ViewStyle, TextStyle, ImageStyle } from 'react-native';