#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://xoibeirouqmdesxessnt.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvaWJlaXJvdXFtZGVzeGVzc250Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQ1ODI0OSwiZXhwIjoyMDczMDM0MjQ5fQ.5M91YIXtXa93gI8ZO-3aIqp3RFnwXLXzG7M8zH6tIBE";

async function checkDatabase() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Check if user exists
  console.log('Checking for user: colin@solvely.net');

  const { data: users, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'colin@solvely.net');

  console.log('User lookup result:', { users, userError });

  // Check all users
  const { data: allUsers, error: allUsersError } = await supabase
    .from('users')
    .select('email, id, first_name, last_name, mobile_device_id, organization_id');

  console.log('All users in database:', { allUsers, allUsersError });

  // Check organizations
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('*');

  console.log('Organizations:', { orgs, orgError });

  // Check CRM connections
  const { data: connections, error: connError } = await supabase
    .from('crm_connections')
    .select('*');

  console.log('CRM connections:', { connections, connError });
}

checkDatabase();