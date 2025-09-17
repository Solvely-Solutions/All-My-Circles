import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isAuthenticated, getCurrentUser, getUserOrganization } from '../lib/supabase';
import { devLog, devError } from '../utils/logger';
import * as Device from 'expo-device';

interface User {
  id: string;
  authUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  deviceId: string;
  organizationId: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER_DATA: '@allmycircles_user_data',
  DEVICE_ID: '@allmycircles_device_id',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      devLog('Auth state changed:', event);
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        await clearStoredAuth();
      } else if (event === 'SIGNED_IN' && session?.user) {
        await handleAuthUser(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const generateDeviceId = async (): Promise<string> => {
    // Try to get existing device ID
    let deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (deviceId) return deviceId;

    // Generate new device ID
    if (Device.isDevice) {
      deviceId = Device.osInternalBuildId || `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } else {
      deviceId = `simulator_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    return deviceId;
  };

  const handleAuthUser = async (authUserId: string) => {
    try {
      const deviceId = await generateDeviceId();

      // Try to get user profile from server first
      try {
        const response = await fetch('https://all-my-circles-web-ltp4.vercel.app/api/mobile/auth/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'x-device-id': deviceId,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          const user: User = {
            id: userData.user.id,
            authUserId: userData.user.authUserId,
            email: userData.user.email,
            firstName: userData.user.firstName,
            lastName: userData.user.lastName,
            deviceId,
            organizationId: userData.user.organizationId,
          };

          await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
          setUser(user);
          devLog('User profile loaded from server');
          return;
        }
      } catch (profileError) {
        devLog('Profile API failed, falling back to Supabase auth data');
      }

      // Fallback: Create user object from Supabase auth data
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const user: User = {
          id: authUser.id, // Use auth user ID as fallback
          authUserId: authUser.id,
          email: authUser.email || '',
          firstName: authUser.user_metadata?.first_name || '',
          lastName: authUser.user_metadata?.last_name || '',
          deviceId,
          organizationId: '', // Will be set later when backend is fully set up
        };

        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        setUser(user);
        devLog('User authenticated with fallback data');
      }
    } catch (error) {
      devError('Error loading user profile', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const checkAuthState = async () => {
    setIsLoading(true);
    try {
      // Check if user is authenticated with Supabase
      const authenticated = await isAuthenticated();

      if (authenticated) {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          await handleAuthUser(currentUser.id);
        }
      } else {
        // Try to restore from local storage (fallback)
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          devLog('User restored from storage (fallback)');
        }
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
      ]);
    } catch (error) {
      devError('Error clearing stored auth', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    setIsLoading(true);
    try {
      const deviceId = await generateDeviceId();

      // Call the server registration endpoint
      const response = await fetch('https://all-my-circles-web-ltp4.vercel.app/api/mobile/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          deviceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // After successful registration, sign in with Supabase
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      devLog('User signed up successfully');
    } catch (error) {
      devError('Sign up failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const deviceId = await generateDeviceId();

      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Sign in failed');
      }

      // Call server signin endpoint to update device info
      const response = await fetch('https://all-my-circles-web-ltp4.vercel.app/api/mobile/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          deviceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server authentication failed');
      }

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
      await supabase.auth.signOut();
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