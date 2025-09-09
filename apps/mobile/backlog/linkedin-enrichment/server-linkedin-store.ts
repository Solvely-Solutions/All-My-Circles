import { LinkedInEnrichmentResponse } from './linkedin-webhook';

interface CompletedRequest {
  email: string;
  result: LinkedInEnrichmentResponse;
  timestamp: number;
}

// Global in-memory store for server-side API routes
const completedResults: Map<string, CompletedRequest> = new Map();

// In-memory store for server-side API routes
class ServerLinkedInStore {
  
  // Store a completed result (called by webhook endpoint)
  static storeCompletedResult(email: string, result: LinkedInEnrichmentResponse): void {
    const cleanEmail = email.toLowerCase().trim();
    
    const completedRequest: CompletedRequest = {
      email: cleanEmail,
      result,
      timestamp: Date.now()
    };
    
    completedResults.set(cleanEmail, completedRequest);
    console.log(`Stored completed LinkedIn result for ${email} in server store. Total stored: ${completedResults.size}`);
    
    // Clean up old results (older than 1 hour)
    this.cleanupOldResults();
  }
  
  // Get completed result (for debugging purposes)
  static getCompletedResult(email: string): LinkedInEnrichmentResponse | null {
    const cleanEmail = email.toLowerCase().trim();
    console.log(`Checking for LinkedIn result for email: ${cleanEmail}. Total stored: ${completedResults.size}`);
    const result = completedResults.get(cleanEmail);
    
    if (result) {
      // Check if result is still fresh (less than 1 hour old)
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      if (result.timestamp > oneHourAgo) {
        console.log(`Found fresh LinkedIn result for: ${cleanEmail}`);
        return result.result;
      } else {
        // Clean up expired result
        completedResults.delete(cleanEmail);
        console.log(`Expired LinkedIn result for: ${cleanEmail}`);
      }
    } else {
      console.log(`No LinkedIn result found for: ${cleanEmail}`);
    }
    
    return null;
  }
  
  // Clean up old results
  private static cleanupOldResults(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [email, result] of completedResults.entries()) {
      if (result.timestamp <= oneHourAgo) {
        completedResults.delete(email);
      }
    }
  }
  
  // Get all stored results (for debugging)
  static getAllResults(): CompletedRequest[] {
    return Array.from(completedResults.values());
  }
  
  // Clear all results (for debugging)
  static clearAllResults(): void {
    completedResults.clear();
    console.log('Cleared all LinkedIn results from server store');
  }
}

export { ServerLinkedInStore };