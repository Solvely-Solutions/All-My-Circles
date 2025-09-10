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
  };
  error?: string;
}

export async function enrichContactWithLinkedIn(email: string): Promise<LinkedInEnrichmentResponse> {
  try {
    const response = await fetch(FRECKLE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase()
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('LinkedIn enrichment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}