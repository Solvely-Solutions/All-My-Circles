#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://xoibeirouqmdesxessnt.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvaWJlaXJvdXFtZGVzeGVzc250Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQ1ODI0OSwiZXhwIjoyMDczMDM0MjQ5fQ.5M91YIXtXa93gI8ZO-3aIqp3RFnwXLXzG7M8zH6tIBE";

async function checkSchema() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Check organizations table schema
  const { data: orgColumns, error: orgError } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'organizations'
        ORDER BY ordinal_position;
      `
    });

  console.log('Organizations table columns:', orgColumns);

  // Check users table schema
  const { data: userColumns, error: userError } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `
    });

  console.log('Users table columns:', userColumns);

  // Check if the columns we need exist
  const orgColumnNames = orgColumns?.map(c => c.column_name) || [];
  const userColumnNames = userColumns?.map(c => c.column_name) || [];

  console.log('Missing columns:');
  console.log('Organizations missing plan?', !orgColumnNames.includes('plan'));
  console.log('Users missing device_info?', !userColumnNames.includes('device_info'));
}

checkSchema();