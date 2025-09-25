import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { devLog, devError } from '../utils/logger';

// Supabase configuration
const supabaseUrl = 'https://xoibeirouqmdesxessnt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvaWJlaXJvdXFtZGVzeGVzc250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NTgyNDksImV4cCI6MjA3MzAzNDI0OX0.JEZlkmC2aCQ3nMAfGsFEO0IGOVzDG7vKPiq2OtF3xqo';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create the Supabase client with auth configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use AsyncStorage for session persistence in React Native
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper function to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    devError('Error checking authentication status', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
};

// Helper function to get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    devError('Error getting current user', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
};

// Helper function to get user's organization
export const getUserOrganization = async (userId: string) => {
  try {
    // First get the user record to find their organization
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('auth_user_id', userId)
      .single();

    if (userError || !userRecord) {
      devLog('No user record found - this is expected for new auth system');
      return null;
    }

    // Then get the organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', userRecord.organization_id)
      .single();

    if (orgError) {
      devError('Error getting organization', orgError);
      return null;
    }

    return organization;
  } catch (error) {
    devLog('Error getting user organization - this is expected for new auth system');
    return null;
  }
};

export default supabase;