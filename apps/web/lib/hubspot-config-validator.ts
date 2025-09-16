/**
 * HubSpot OAuth Configuration Validator
 * Validates HubSpot app configuration and OAuth setup
 */

export interface HubSpotConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  requiredScopes: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: HubSpotConfig | null;
}

export async function validateHubSpotConfig(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check environment variables
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
  const redirectUri = process.env.HUBSPOT_REDIRECT_URI;

  if (!clientId) {
    errors.push('HUBSPOT_CLIENT_ID environment variable is missing');
  } else if (!clientId.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i)) {
    warnings.push('HUBSPOT_CLIENT_ID does not match expected UUID format');
  }

  if (!clientSecret) {
    errors.push('HUBSPOT_CLIENT_SECRET environment variable is missing');
  } else if (!clientSecret.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i)) {
    warnings.push('HUBSPOT_CLIENT_SECRET does not match expected UUID format');
  }

  if (!redirectUri) {
    errors.push('HUBSPOT_REDIRECT_URI environment variable is missing');
  } else {
    try {
      const url = new URL(redirectUri);
      if (!url.protocol.startsWith('https') && !url.hostname.includes('localhost')) {
        warnings.push('HUBSPOT_REDIRECT_URI should use HTTPS in production');
      }
      if (!url.pathname.includes('oauth-callback')) {
        warnings.push('HUBSPOT_REDIRECT_URI should contain "oauth-callback" in the path');
      }
    } catch (urlError) {
      errors.push('HUBSPOT_REDIRECT_URI is not a valid URL');
    }
  }

  const requiredScopes = [
    'crm.objects.contacts.read',
    'crm.objects.contacts.write',
    'crm.objects.companies.read',
    'crm.objects.companies.write',
    'crm.objects.deals.read',
    'crm.objects.deals.write',
    'crm.schemas.custom.read',
    'crm.schemas.custom.write',
    'integration-sync'
  ];

  const config: HubSpotConfig | null = errors.length === 0 ? {
    clientId: clientId!,
    clientSecret: clientSecret!,
    redirectUri: redirectUri!,
    requiredScopes
  } : null;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config
  };
}

export async function testHubSpotConnectivity(accessToken: string): Promise<{
  isConnected: boolean;
  portalId?: string;
  scopes?: string[];
  error?: string;
}> {
  try {
    // Test basic connectivity with account info
    const response = await fetch('https://api.hubapi.com/account-info/v3/details', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return {
        isConnected: false,
        error: `HubSpot API returned ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();

    // Test token info to get scopes
    const tokenResponse = await fetch('https://api.hubapi.com/oauth/v1/access-tokens/' + accessToken, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    let scopes: string[] = [];
    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();
      scopes = tokenData.scopes || [];
    }

    return {
      isConnected: true,
      portalId: data.portalId?.toString() || data.hubId?.toString(),
      scopes
    };

  } catch (error) {
    return {
      isConnected: false,
      error: error instanceof Error ? error.message : 'Unknown connectivity error'
    };
  }
}

export function validateRequiredScopes(grantedScopes: string[], requiredScopes: string[] = [
  'crm.objects.contacts.read',
  'crm.objects.contacts.write',
  'crm.objects.companies.read',
  'crm.objects.companies.write'
]): {
  hasRequiredScopes: boolean;
  missingScopes: string[];
  extraScopes: string[];
} {
  const missingScopes = requiredScopes.filter(scope => !grantedScopes.includes(scope));
  const extraScopes = grantedScopes.filter(scope => !requiredScopes.includes(scope));

  return {
    hasRequiredScopes: missingScopes.length === 0,
    missingScopes,
    extraScopes
  };
}