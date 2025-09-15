const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase config
const supabaseUrl = 'https://xoibeirouqmdesxessnt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvaWJlaXJvdXFtZGVzeGVzc250Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQ1ODI0OSwiZXhwIjoyMDczMDM0MjQ5fQ.5M91YIXtXa93gI8ZO-3aIqp3RFnwXLXzG7M8zH6tIBE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('Reading SQL file...');
    const sql = fs.readFileSync('./database/crm_connections.sql', 'utf8');

    console.log('Executing SQL in Supabase...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('Error executing SQL:', error);
      return;
    }

    console.log('✅ CRM connections table created successfully!');
    console.log('Response:', data);

  } catch (error) {
    console.error('Error:', error);
  }
}

setupDatabase();