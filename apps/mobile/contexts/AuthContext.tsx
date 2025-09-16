import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/apiService';
import { devLog, devError } from '../utils/logger';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  deviceId: string;
  organizationId: string;
  sessionToken?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER_DATA: '@allmycircles_user_data',
  DEVICE_ID: '@allmycircles_device_id',
  SESSION_TOKEN: '@allmycircles_session_token'
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    setIsLoading(true);
    try {
      const [userData, deviceId, sessionToken] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
        AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID),
        AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)
      ]);

      if (userData && deviceId) {
        const parsedUser = JSON.parse(userData);
        await apiService.initialize(deviceId);

        // For now, just restore the user without API verification
        // TODO: Implement proper session verification when getDeviceStatus API is ready
        setUser(parsedUser);
        devLog('User restored from storage');
      }
    } catch (error) {
      devError('Error checking auth state', error instanceof Error ? error : new Error(String(error)));
      await clearStoredAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const clearStoredAuth = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.DEVICE_ID,
        STORAGE_KEYS.SESSION_TOKEN
      ]);
    } catch (error) {
      devError('Error clearing stored auth', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const signUp = async (email: string, firstName: string, lastName: string) => {
    devLog('🚀 NEW SIGNUP FUNCTION LOADED - VERSION 2.0 🚀');
    devLog('signUp function called with:', { email, firstName, lastName });
    setIsLoading(true);
    try {
      // Generate a foolproof device ID for simulator
      const deviceId = 'simulator-test-123';
      devLog('✅ Generated device ID:', deviceId);

      // Store it for future use
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
        devLog('Device ID stored successfully');
      } catch (storageError) {
        devError('Failed to store device ID:', storageError instanceof Error ? storageError : new Error(String(storageError)));
        // Continue anyway since we have the deviceId in memory
      }

      devLog('About to initialize API service with deviceId:', deviceId);
      devLog('typeof deviceId:', typeof deviceId);
      devLog('deviceId length:', deviceId?.length);

      if (!deviceId) {
        throw new Error('Device ID is null or undefined - this should not happen!');
      }

      devLog('Calling apiService.initialize...');
      await apiService.initialize(deviceId);
      devLog('apiService.initialize completed');

      const deviceInfo = {
        firstName,
        lastName,
        platform: 'ios',
        model: 'iPhone Simulator',
        osVersion: '18.0'
      };

      const userData = await apiService.registerDevice(email, deviceInfo);

      const user: User = {
        id: userData.user.id,
        email: userData.user.email, // Use email from response
        firstName,
        lastName,
        deviceId,
        organizationId: userData.user.organizationId,
        sessionToken: userData.authentication?.sessionToken
      };

      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      if (userData.authentication?.sessionToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, userData.authentication.sessionToken);
      }

      setUser(user);
      devLog('User signed up successfully');
    } catch (error) {
      devError('Sign up failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string) => {
    setIsLoading(true);
    try {
      // Try to get stored device ID, or generate a new one
      let deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
      if (!deviceId) {
        deviceId = 'simulator-test-123';
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
      }

      // Initialize API service
      await apiService.initialize(deviceId);

      // Try to authenticate with the server using existing email and device
      // This will create a session if the user exists, or fail if they don't
      const deviceInfo = {
        firstName: '', // These will be filled from server response
        lastName: '',
        platform: 'ios',
        model: 'iPhone Simulator',
        osVersion: '18.0'
      };

      const userData = await apiService.signIn(email, deviceInfo);

      const user: User = {
        id: userData.user.id,
        email: userData.user.email,
        firstName: userData.user.firstName || '',
        lastName: userData.user.lastName || '',
        deviceId,
        organizationId: userData.user.organizationId,
        sessionToken: userData.authentication?.sessionToken
      };

      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      if (userData.authentication?.sessionToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, userData.authentication.sessionToken);
      }

      setUser(user);
      devLog('User signed in successfully');
    } catch (error) {
      devError('Sign in failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await clearStoredAuth();
      setUser(null);
      devLog('User signed out');
    } catch (error) {
      devError('Sign out error', error instanceof Error ? error : new Error(String(error)));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      signUp,
      signIn,
      signOut,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}