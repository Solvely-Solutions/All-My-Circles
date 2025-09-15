-- Create CRM connections table for storing OAuth tokens and connection details
CREATE TABLE IF NOT EXISTS crm_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'hubspot', 'salesforce', 'pipedrive', etc.
  portal_id VARCHAR(100), -- For HubSpot, this is the portal ID
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  connection_name VARCHAR(255),
  scopes TEXT[], -- Array of granted scopes
  metadata JSONB DEFAULT '{}', -- Additional provider-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one active connection per user per provider
  UNIQUE(user_id, provider)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_crm_connections_user_id ON crm_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_connections_organization_id ON crm_connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_connections_provider ON crm_connections(provider);
CREATE INDEX IF NOT EXISTS idx_crm_connections_active ON crm_connections(is_active) WHERE is_active = true;

-- Add RLS (Row Level Security) policies
ALTER TABLE crm_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own CRM connections
CREATE POLICY "Users can view own CRM connections" ON crm_connections
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can insert their own CRM connections
CREATE POLICY "Users can create own CRM connections" ON crm_connections
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own CRM connections
CREATE POLICY "Users can update own CRM connections" ON crm_connections
  FOR UPDATE USING (user_id = auth.uid());

-- Policy: Users can delete their own CRM connections
CREATE POLICY "Users can delete own CRM connections" ON crm_connections
  FOR DELETE USING (user_id = auth.uid());

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_crm_connections_updated_at
  BEFORE UPDATE ON crm_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();