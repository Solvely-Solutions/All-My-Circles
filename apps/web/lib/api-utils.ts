import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Client } from '@hubspot/api-client';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export interface Organization {
  id: string;
  name: string;
  hubspot_portal_id: number;
  hubspot_access_token: string;
  hubspot_refresh_token: string;
  token_expires_at: string;
  app_installation_id: string;
  sync_settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AuthContext {
  organization: Organization;
  user?: {
    id: string;
    email: string;
    mobile_device_id?: string;
  };
}

export async function getAuthContext(request: NextRequest): Promise<AuthContext> {
  const deviceId = request.headers.get('x-device-id');
  const portalId = request.cookies.get('hubspot_portal_id')?.value;

  if (!deviceId && !portalId) {
    throw new Error('Authentication required');
  }

  let organizationId: string;
  let user: any = null;

  if (deviceId) {
    // Mobile app authentication
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('mobile_device_id', deviceId)
      .single();
    
    if (error || !userData) {
      throw new Error('Device not authorized');
    }
    
    user = userData;
    organizationId = userData.organization_id;
  } else if (portalId) {
    // Web authentication
    const { data: org, error } = await supabase
      .from('organizations')
      .select('id')
      .eq('hubspot_portal_id', parseInt(portalId))
      .single();
    
    if (error || !org) {
      throw new Error('Organization not found');
    }
    
    organizationId = org.id;
  } else {
    throw new Error('No valid authentication method found');
  }

  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single();

  if (orgError || !organization) {
    throw new Error('Organization not found');
  }

  return { organization, user };
}

export async function getHubSpotClient(accessToken: string): Promise<Client> {
  return new Client({ accessToken });
}

export async function refreshHubSpotToken(organization: Organization): Promise<string> {
  if (!organization.hubspot_refresh_token) {
    throw new Error('No refresh token available');
  }

  const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.HUBSPOT_CLIENT_ID!,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
      refresh_token: organization.hubspot_refresh_token,
    }),
  });

  const tokens = await response.json();

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${tokens.error_description || tokens.error}`);
  }

  // Update organization with new tokens
  await supabase
    .from('organizations')
    .update({
      hubspot_access_token: tokens.access_token,
      hubspot_refresh_token: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    })
    .eq('id', organization.id);

  return tokens.access_token;
}

export async function getValidHubSpotClient(organization: Organization): Promise<Client> {
  let accessToken = organization.hubspot_access_token;

  // Check if token needs refresh (expires within next 5 minutes)
  const expiresAt = new Date(organization.token_expires_at);
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

  if (expiresAt < fiveMinutesFromNow) {
    try {
      accessToken = await refreshHubSpotToken(organization);
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('HubSpot authentication expired. Please reconnect.');
    }
  }

  return new Client({ accessToken });
}

export function createApiResponse(data: any, status: number = 200) {
  return Response.json(data, { status });
}

export function createErrorResponse(message: string, status: number = 500) {
  return Response.json({ error: message }, { status });
}

export async function withAuth<T>(
  request: NextRequest,
  handler: (authContext: AuthContext, request: NextRequest) => Promise<T>
): Promise<T> {
  try {
    const authContext = await getAuthContext(request);
    return await handler(authContext, request);
  } catch (error) {
    throw error;
  }
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export function getPaginationParams(request: NextRequest, maxLimit: number = 100): PaginationParams {
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), maxLimit);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

export function createPaginationResponse(data: any[], params: PaginationParams, hasMore: boolean) {
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      hasMore,
    },
  };
}