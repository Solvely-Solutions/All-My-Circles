import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinkedInEnrichmentResponse } from './linkedin-webhook';

interface PendingRequest {
  email: string;
  timestamp: number;
  requestId: string;
}

interface CompletedRequest {
  email: string;
  result: LinkedInEnrichmentResponse;
  timestamp: number;
}

const PENDING_REQUESTS_KEY = 'linkedin_pending_requests';
const COMPLETED_REQUESTS_KEY = 'linkedin_completed_requests';

export class LinkedInStore {
  // Store a pending request
  static async storePendingRequest(email: string): Promise<string> {
    const requestId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const request: PendingRequest = {
      email: email.toLowerCase().trim(),
      timestamp: Date.now(),
      requestId
    };
    
    try {
      const existing = await AsyncStorage.getItem(PENDING_REQUESTS_KEY);
      const requests = existing ? JSON.parse(existing) : [];
      requests.push(request);
      await AsyncStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify(requests));
      console.log(`Stored pending LinkedIn request for ${email} with ID ${requestId}`);
      return requestId;
    } catch (error) {
      console.error('Error storing pending request:', error);
      throw error;
    }
  }
  
  // Check if we have a completed result for an email
  static async getCompletedResult(email: string): Promise<LinkedInEnrichmentResponse | null> {
    try {
      const completed = await AsyncStorage.getItem(COMPLETED_REQUESTS_KEY);
      if (!completed) return null;
      
      const results: CompletedRequest[] = JSON.parse(completed);
      const result = results.find(r => r.email === email.toLowerCase().trim());
      
      if (result) {
        // Clean up old results (older than 1 hour)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        const filtered = results.filter(r => r.timestamp > oneHourAgo);
        await AsyncStorage.setItem(COMPLETED_REQUESTS_KEY, JSON.stringify(filtered));
        
        return result.result;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting completed result:', error);
      return null;
    }
  }
  
  // Store a completed result (called by webhook endpoint)
  static async storeCompletedResult(email: string, result: LinkedInEnrichmentResponse): Promise<void> {
    try {
      const completed = await AsyncStorage.getItem(COMPLETED_REQUESTS_KEY);
      const results = completed ? JSON.parse(completed) : [];
      
      const newResult: CompletedRequest = {
        email: email.toLowerCase().trim(),
        result,
        timestamp: Date.now()
      };
      
      // Remove any existing result for this email
      const filtered = results.filter((r: CompletedRequest) => r.email !== email.toLowerCase().trim());
      filtered.push(newResult);
      
      await AsyncStorage.setItem(COMPLETED_REQUESTS_KEY, JSON.stringify(filtered));
      console.log(`Stored completed LinkedIn result for ${email}`);
    } catch (error) {
      console.error('Error storing completed result:', error);
      throw error;
    }
  }
  
  // Check if a request is still pending
  static async isPending(email: string): Promise<boolean> {
    try {
      const pending = await AsyncStorage.getItem(PENDING_REQUESTS_KEY);
      if (!pending) return false;
      
      const requests: PendingRequest[] = JSON.parse(pending);
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      
      // Clean up old pending requests
      const recent = requests.filter(r => r.timestamp > fiveMinutesAgo);
      await AsyncStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify(recent));
      
      return recent.some(r => r.email === email.toLowerCase().trim());
    } catch (error) {
      console.error('Error checking pending status:', error);
      return false;
    }
  }
  
  // Clear a pending request (when we get a result)
  static async clearPendingRequest(email: string): Promise<void> {
    try {
      const pending = await AsyncStorage.getItem(PENDING_REQUESTS_KEY);
      if (!pending) return;
      
      const requests: PendingRequest[] = JSON.parse(pending);
      const filtered = requests.filter(r => r.email !== email.toLowerCase().trim());
      await AsyncStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error clearing pending request:', error);
    }
  }
}