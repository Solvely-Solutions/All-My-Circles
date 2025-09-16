/**
 * Create the hubspot_sync_queue table for bi-directional sync
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://doxjmhgjxmbfipqvsgcd.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSyncQueueTable() {
  console.log('📋 Creating hubspot_sync_queue table...');

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS hubspot_sync_queue (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      device_id TEXT NOT NULL,
      hubspot_contact_id TEXT NOT NULL,
      property_name TEXT NOT NULL,
      property_value JSONB,
      change_type TEXT DEFAULT 'property_update',
      processed BOOLEAN DEFAULT FALSE,
      processed_at TIMESTAMP,
      error_message TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, hubspot_contact_id, property_name)
    );

    CREATE INDEX IF NOT EXISTS idx_sync_queue_device_unprocessed
    ON hubspot_sync_queue(device_id, processed)
    WHERE processed = FALSE;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });

    if (error) {
      console.error('❌ Failed to create sync queue table:', error);
      process.exit(1);
    }

    console.log('✅ Sync queue table created successfully');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createSyncQueueTable();