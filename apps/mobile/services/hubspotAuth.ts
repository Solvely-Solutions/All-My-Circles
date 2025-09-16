import { Linking } from 'react-native';
import { apiService } from './apiService';
import { devLog, devError } from '../utils/logger';

export interface HubSpotAuthResponse {
  authUrl: string;
  state: string;
  message: string;
}

export interface HubSpotTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  portalId: string;
}

class HubSpotAuthService {
  private deviceId: string | null = null;
  private isAuthenticating: boolean = false;

  initialize(deviceId: string) {
    this.deviceId = deviceId;
    devLog('HubSpot Auth Service initialized with deviceId:', deviceId);
  }

  async startOAuthFlow(): Promise<HubSpotAuthResponse> {
    if (!this.deviceId) {
      throw new Error('HubSpot Auth Service not initialized. Call initialize() first.');
    }

    try {
      devLog('Starting HubSpot OAuth flow...');
      this.isAuthenticating = true;

      const response = await fetch(`${apiService.baseUrl}/api/mobile/auth/hubspot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: this.deviceId,
          redirectUrl: 'circles://hubspot-auth-callback'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: HubSpotAuthResponse = await response.json();
      devLog('Received HubSpot auth URL:', data.authUrl);

      return data;
    } catch (error) {
      this.isAuthenticating = false;
      devError('Failed to start HubSpot OAuth flow:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async openAuthUrl(authUrl: string): Promise<void> {
    try {
      devLog('Opening HubSpot auth URL in browser...');

      const supported = await Linking.canOpenURL(authUrl);
      if (!supported) {
        throw new Error('Cannot open URL in browser');
      }

      await Linking.openURL(authUrl);
      devLog('Successfully opened HubSpot auth URL');
    } catch (error) {
      devError('Failed to open HubSpot auth URL:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async handleAuthCallback(url: string): Promise<HubSpotTokens> {
    if (!this.isAuthenticating) {
      devLog('Ignoring callback - not in authentication flow');
      throw new Error('Not in authentication flow');
    }

    try {
      devLog('Handling HubSpot auth callback:', url);

      const urlObject = new URL(url);
      const code = urlObject.searchParams.get('code');
      const state = urlObject.searchParams.get('state');
      const error = urlObject.searchParams.get('error');

      if (error) {
        throw new Error(`HubSpot OAuth error: ${error}`);
      }

      if (!code || !state) {
        throw new Error('Missing authorization code or state parameter');
      }

      // Verify state parameter contains our deviceId
      try {
        // Use atob for base64 decoding in React Native
        // First decode URL encoding, then base64
        const decodedState = decodeURIComponent(state);
        const stateData = JSON.parse(atob(decodedState));
        devLog('Parsed state data:', stateData);
        if (stateData.deviceId !== this.deviceId) {
          throw new Error('Invalid state parameter - device ID mismatch');
        }
      } catch (parseError) {
        devLog('State parameter parsing error:', parseError);
        devLog('Raw state parameter:', state);
        throw new Error('Invalid state parameter format');
      }

      // Exchange code for tokens via our backend
      const exchangeUrl = `${apiService.baseUrl}/api/hubspot/oauth/exchange`;
      devLog('Calling token exchange URL:', exchangeUrl);
      const response = await fetch(exchangeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          state,
          deviceId: this.deviceId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        devLog('Token exchange error response:', errorText);
        throw new Error(`Token exchange failed: HTTP ${response.status} - ${errorText}`);
      }

      const tokens: HubSpotTokens = await response.json();
      devLog('Successfully exchanged code for HubSpot tokens');

      this.isAuthenticating = false;
      return tokens;
    } catch (error) {
      this.isAuthenticating = false;
      devError('Failed to handle HubSpot auth callback:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async checkAuthStatus(): Promise<{ isAuthenticated: boolean; portalId?: string }> {
    if (!this.deviceId) {
      return { isAuthenticated: false };
    }

    try {
      const response = await fetch(`${apiService.baseUrl}/api/hubspot/auth/status?deviceId=${this.deviceId}`);

      if (!response.ok) {
        return { isAuthenticated: false };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      devError('Failed to check HubSpot auth status:', error instanceof Error ? error : new Error(String(error)));
      return { isAuthenticated: false };
    }
  }

  async refreshToken(): Promise<{ accessToken: string; expiresAt: string }> {
    if (!this.deviceId) {
      throw new Error('HubSpot Auth Service not initialized');
    }

    try {
      devLog('Refreshing HubSpot access token...');

      const response = await fetch(`${apiService.baseUrl}/api/mobile/auth/hubspot/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: this.deviceId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token refresh failed: HTTP ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      devLog('Successfully refreshed HubSpot token');

      return {
        accessToken: data.accessToken,
        expiresAt: data.expiresAt
      };
    } catch (error) {
      devError('Failed to refresh HubSpot token:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.deviceId) {
      throw new Error('HubSpot Auth Service not initialized');
    }

    try {
      const response = await fetch(`${apiService.baseUrl}/api/hubspot/auth/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: this.deviceId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Disconnect failed: HTTP ${response.status}`);
      }

      devLog('Successfully disconnected from HubSpot');
    } catch (error) {
      devError('Failed to disconnect from HubSpot:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}

export const hubspotAuthService = new HubSpotAuthService();