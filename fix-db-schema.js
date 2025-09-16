#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://xoibeirouqmdesxessnt.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvaWJlaXJvdXFtZGVzeGVzc250Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQ1ODI0OSwiZXhwIjoyMDczMDM0MjQ5fQ.5M91YIXtXa93gI8ZO-3aIqp3RFnwXLXzG7M8zH6tIBE";

async function fixSchema() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    db: { schema: 'public' },
    auth: { persistSession: false }
  });

  console.log('Attempting to update organization records...');

  // Instead of adding columns, let's update the existing record to have the missing fields
  try {
    // Get all organizations
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*');

    console.log('Organizations found:', orgs?.length);

    if (orgs && orgs.length > 0) {
      // Update each organization to have a plan if it doesn't exist
      for (const org of orgs) {
        if (!org.plan) {
          const { error: updateError } = await supabase
            .from('organizations')
            .update({ plan: 'free' })
            .eq('id', org.id);

          if (updateError) {
            console.error('Failed to update org:', org.id, updateError);
          } else {
            console.log('Updated org:', org.id, 'with plan: free');
          }
        }
      }
    }
  } catch (e) {
    console.error('Organization update error:', e);
  }

  console.log('Attempting to update user records...');

  try {
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    console.log('Users found:', users?.length);

    if (users && users.length > 0) {
      // Update each user to have device_info if it doesn't exist
      for (const user of users) {
        if (!user.device_info) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ device_info: {} })
            .eq('id', user.id);

          if (updateError) {
            console.error('Failed to update user:', user.id, updateError);
          } else {
            console.log('Updated user:', user.id, 'with device_info: {}');
          }
        }
      }
    }
  } catch (e) {
    console.error('User update error:', e);
  }

  console.log('Schema fix completed!');
}

fixSchema();