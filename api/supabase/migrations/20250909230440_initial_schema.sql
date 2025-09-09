-- Circles Database Schema for Supabase
-- This schema supports the HubSpot integration and mobile app data sync

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE sync_status AS ENUM ('pending', 'syncing', 'completed', 'failed');
CREATE TYPE connection_strength AS ENUM ('weak', 'medium', 'strong');
CREATE TYPE contact_value AS ENUM ('low', 'medium', 'high');

-- Users/Organizations table - tracks HubSpot portal connections
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    hubspot_portal_id BIGINT UNIQUE,
    hubspot_access_token TEXT,
    hubspot_refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    app_installation_id TEXT,
    sync_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table - individual users within organizations
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    hubspot_user_id BIGINT,
    mobile_device_id TEXT,
    mobile_push_token TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, email)
);

-- Networking events/groups - conferences, meetups, etc.
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_date DATE,
    end_date DATE,
    event_type TEXT DEFAULT 'conference',
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts table - networking contacts with enriched data
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic contact info
    hubspot_contact_id BIGINT,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    company TEXT,
    job_title TEXT,
    
    -- Networking specific data
    connection_strength connection_strength DEFAULT 'weak',
    contact_value contact_value DEFAULT 'low',
    first_met_at UUID REFERENCES events(id),
    first_met_location TEXT,
    first_met_date DATE,
    last_interaction_date DATE,
    next_followup_date DATE,
    total_interactions INTEGER DEFAULT 0,
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    social_links JSONB DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    
    -- Sync tracking
    last_synced_at TIMESTAMP WITH TIME ZONE,
    hubspot_sync_needed BOOLEAN DEFAULT FALSE,
    mobile_sync_needed BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(organization_id, hubspot_contact_id)
);

-- Meeting/interaction history
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    
    -- Interaction details
    interaction_type TEXT DEFAULT 'meeting', -- meeting, call, email, text, etc.
    date DATE NOT NULL,
    location TEXT,
    notes TEXT,
    duration_minutes INTEGER,
    follow_up_needed BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync logs for tracking data synchronization
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Sync details
    sync_type TEXT NOT NULL, -- 'hubspot_to_mobile', 'mobile_to_hubspot', 'full_sync'
    status sync_status DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Results
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    error_details JSONB,
    
    -- Metadata
    triggered_by TEXT, -- 'manual', 'scheduled', 'webhook', 'mobile_app'
    metadata JSONB DEFAULT '{}'
);

-- Custom properties mapping for HubSpot
CREATE TABLE hubspot_custom_properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Property details
    property_name TEXT NOT NULL,
    property_type TEXT NOT NULL,
    hubspot_property_name TEXT NOT NULL,
    field_mapping TEXT NOT NULL, -- maps to contacts table column
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(organization_id, property_name)
);

-- Create indexes for performance
CREATE INDEX idx_organizations_hubspot_portal_id ON organizations(hubspot_portal_id);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX idx_contacts_hubspot_contact_id ON contacts(hubspot_contact_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_sync_needed ON contacts(hubspot_sync_needed, mobile_sync_needed);
CREATE INDEX idx_contacts_next_followup ON contacts(next_followup_date) WHERE next_followup_date IS NOT NULL;
CREATE INDEX idx_interactions_contact_id ON interactions(contact_id);
CREATE INDEX idx_interactions_date ON interactions(date);
CREATE INDEX idx_sync_logs_organization_id ON sync_logs(organization_id);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
CREATE INDEX idx_sync_logs_started_at ON sync_logs(started_at);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interactions_updated_at BEFORE UPDATE ON interactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hubspot_custom_properties_updated_at BEFORE UPDATE ON hubspot_custom_properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample networking scenarios for development
INSERT INTO events (name, description, location, start_date, event_type, tags) VALUES
('TechCrunch Disrupt 2024', 'Premier startup and technology conference', 'San Francisco, CA', '2024-09-07', 'conference', ARRAY['tech', 'startup', 'vc', 'networking']),
('DevCon 2024', 'Developer conference focused on modern web technologies', 'Austin, TX', '2024-09-05', 'conference', ARRAY['development', 'javascript', 'react', 'tech']),
('SF Tech Meetup', 'Monthly networking meetup for San Francisco tech professionals', 'San Francisco, CA', '2024-08-15', 'meetup', ARRAY['networking', 'tech', 'monthly']),
('Y Combinator Demo Day', 'Startup pitch event and networking opportunity', 'Mountain View, CA', '2024-08-20', 'demo_day', ARRAY['startup', 'vc', 'demo', 'networking']);