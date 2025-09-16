#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://xoibeirouqmdesxessnt.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvaWJlaXJvdXFtZGVzeGVzc250Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQ1ODI0OSwiZXhwIjoyMDczMDM0MjQ5fQ.5M91YIXtXa93gI8ZO-3aIqp3RFnwXLXzG7M8zH6tIBE";

async function runMigration() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Read the migration file
  const migrationPath = path.join(__dirname, 'api/supabase/migrations/20250915120000_fix_schema_mismatches.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('Running schema migration...');
  console.log('Migration SQL:');
  console.log(migrationSQL);

  try {
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }

    console.log('Migration completed successfully!');
    console.log('Result:', data);

  } catch (err) {
    console.error('Error running migration:', err);
    process.exit(1);
  }
}

runMigration();