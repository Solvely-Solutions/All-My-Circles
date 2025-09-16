#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://xoibeirouqmdesxessnt.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvaWJlaXJvdXFtZGVzeGVzc250Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQ1ODI0OSwiZXhwIjoyMDczMDM0MjQ5fQ.5M91YIXtXa93gI8ZO-3aIqp3RFnwXLXzG7M8zH6tIBE";

async function fixSchema() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log('Adding missing columns...');

  // Add plan column to organizations
  try {
    const { data: planResult, error: planError } = await supabase
      .rpc('exec_sql', {
        sql: `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'free';`
      });

    if (planError) {
      console.error('Failed to add plan column:', planError);
    } else {
      console.log('Added plan column to organizations');
    }
  } catch (e) {
    console.error('Plan column error:', e);
  }

  // Add device_info column to users
  try {
    const { data: deviceResult, error: deviceError } = await supabase
      .rpc('exec_sql', {
        sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}';`
      });

    if (deviceError) {
      console.error('Failed to add device_info column:', deviceError);
    } else {
      console.log('Added device_info column to users');
    }
  } catch (e) {
    console.error('Device info column error:', e);
  }

  console.log('Schema fixes completed!');
}

fixSchema();