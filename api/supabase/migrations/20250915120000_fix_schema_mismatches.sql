-- Fix schema mismatches for authentication and user management
-- This migration adds missing tables and columns required by the application code

-- Add missing columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create user_sessions table for mobile device authentication
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    device_id TEXT NOT NULL,
    device_info JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device ON user_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active, expires_at);

-- Add trigger for user_sessions updated_at
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create CRM connections table (referenced in validate-config route)
CREATE TABLE IF NOT EXISTS crm_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- 'hubspot', 'salesforce', etc.
    access_token TEXT,
    refresh_token TEXT,
    portal_id BIGINT,
    scopes TEXT[] DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Create indexes for crm_connections
CREATE INDEX IF NOT EXISTS idx_crm_connections_user_id ON crm_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_connections_provider ON crm_connections(provider);
CREATE INDEX IF NOT EXISTS idx_crm_connections_active ON crm_connections(is_active);

-- Add trigger for crm_connections updated_at
CREATE TRIGGER update_crm_connections_updated_at BEFORE UPDATE ON crm_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Populate first_name and last_name from existing name field if it exists
UPDATE users
SET
    first_name = SPLIT_PART(name, ' ', 1),
    last_name = CASE
        WHEN array_length(string_to_array(name, ' '), 1) > 1
        THEN SPLIT_PART(name, ' ', 2)
        ELSE NULL
    END
WHERE name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL);