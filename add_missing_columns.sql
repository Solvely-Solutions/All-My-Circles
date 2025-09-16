-- Add missing columns to fix schema issues

-- Add plan column to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'free';

-- Add device_info column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}';