import { LinkedInStore } from './linkedin-store';

const FRECKLE_WEBHOOK_URL = 'https://webhooks.freckle.io/v1/f/082f3900-d408-4ec3-8a94-05782b887bdc';

export interface LinkedInEnrichmentRequest {
  email: string;
}

export interface LinkedInEnrichmentResponse {
  success: boolean;
  data?: {
    name?: string;
    title?: string;
    company?: string;
    linkedinUrl?: string;
    profilePicture?: string;
    location?: string;
    headline?: string;
    requestId?: string;
    message?: string;
  };
  error?: string;
}

export async function enrichContactWithLinkedIn(email: string): Promise<LinkedInEnrichmentResponse> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    
    // First check if we already have a completed result
    const existingResult = await LinkedInStore.getCompletedResult(cleanEmail);
    if (existingResult) {
      console.log('Found existing LinkedIn result for:', cleanEmail);
      return existingResult;
    }
    
    // Check if a request is already pending
    const isPending = await LinkedInStore.isPending(cleanEmail);
    if (isPending) {
      return {
        success: false,
        error: 'LinkedIn search already in progress for this email'
      };
    }
    
    // Store pending request
    const requestId = await LinkedInStore.storePendingRequest(cleanEmail);
    console.log('Starting LinkedIn search for:', cleanEmail, 'Request ID:', requestId);
    
    // Send request to Freckle inbound webhook
    const response = await fetch(FRECKLE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: cleanEmail,
        action: 'linkedin_search',
        format: 'json',
        requestId: requestId
      }),
    });

    if (!response.ok) {
      await LinkedInStore.clearPendingRequest(cleanEmail);
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('LinkedIn webhook response:', JSON.stringify(data, null, 2));
    
    // The webhook should return OK status, and the actual data will come via outbound webhook
    if (data.status === 'OK') {
      return {
        success: false,
        error: 'PENDING', // Special status to indicate async processing
        data: {
          requestId: requestId,
          message: 'LinkedIn search initiated. Results will be available shortly.'
        }
      };
    }
    
    // If we get immediate data (shouldn't happen with outbound webhooks, but handle it)
    const hasUsefulData = data.name || data.title || data.company || data.linkedinUrl || data.location;
    if (hasUsefulData) {
      const result = { success: true, data: data };
      await LinkedInStore.storeCompletedResult(cleanEmail, result);
      await LinkedInStore.clearPendingRequest(cleanEmail);
      return result;
    }
    
    // No useful data and not pending
    await LinkedInStore.clearPendingRequest(cleanEmail);
    return {
      success: false,
      error: 'No LinkedIn profile information found for this email'
    };
    
  } catch (error) {
    console.error('LinkedIn enrichment error:', error);
    await LinkedInStore.clearPendingRequest(email.trim().toLowerCase()).catch(() => {});
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to find LinkedIn profile'
    };
  }
}