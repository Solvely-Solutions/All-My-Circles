/**
 * Script to clear cached HubSpot user IDs to force re-lookup with correct API
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function clearHubSpotUserIds() {
  try {
    console.log('Clearing cached HubSpot user IDs...');

    const { data, error } = await supabase
      .from('users')
      .update({ hubspot_user_id: null })
      .not('hubspot_user_id', 'is', null);

    if (error) {
      console.error('Error clearing HubSpot user IDs:', error);
      return;
    }

    console.log('Successfully cleared HubSpot user IDs for users:', data);
    console.log('Next contact creation will trigger new user ID lookup');
  } catch (error) {
    console.error('Script failed:', error);
  }
}

clearHubSpotUserIds();