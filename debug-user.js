#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://xoibeirouqmdesxessnt.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvaWJlaXJvdXFtZGVzeGVzc250Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQ1ODI0OSwiZXhwIjoyMDczMDM0MjQ5fQ.5M91YIXtXa93gI8ZO-3aIqp3RFnwXLXzG7M8zH6tIBE";

async function debugUser() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log('Checking for device ID: simulator-test-123');

  // Check if user exists with device ID
  const { data: userByDevice, error: deviceError } = await supabase
    .from('users')
    .select('*')
    .eq('mobile_device_id', 'simulator-test-123');

  console.log('User by device ID:', { userByDevice, deviceError });

  // Check all users
  const { data: allUsers, error: allError } = await supabase
    .from('users')
    .select('id, email, mobile_device_id, organization_id');

  console.log('All users:', { allUsers, allError });

  // If we have the user but no device ID, update it
  if (allUsers && allUsers.length > 0) {
    const userWithoutDevice = allUsers.find(u => u.email === 'colin@solvely.net' && !u.mobile_device_id);

    if (userWithoutDevice) {
      console.log('Found user without device ID, updating:', userWithoutDevice.id);

      const { error: updateError } = await supabase
        .from('users')
        .update({ mobile_device_id: 'simulator-test-123' })
        .eq('id', userWithoutDevice.id);

      if (updateError) {
        console.error('Update failed:', updateError);
      } else {
        console.log('Successfully updated user with device ID');
      }
    }
  }

  // Check organizations
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, hubspot_portal_id');

  console.log('Organizations:', { orgs, orgError });
}

debugUser();