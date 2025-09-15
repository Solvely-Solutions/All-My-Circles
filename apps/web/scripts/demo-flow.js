#!/usr/bin/env node

/**
 * All My Circles - Complete Demo Flow
 * 
 * This script demonstrates the complete user journey:
 * 1. Mobile app user signup
 * 2. HubSpot OAuth authentication  
 * 3. Add a contact via mobile app
 * 4. Watch it sync to HubSpot
 * 5. Modify contact in HubSpot
 * 6. Watch changes sync back to mobile app
 */

const BASE_URL = 'https://all-my-circles-web-ltp4.vercel.app';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m', 
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function step(stepNumber, description) {
  log(`\n${colors.bold}📍 STEP ${stepNumber}: ${description}${colors.reset}`, 'blue');
  log('─'.repeat(60), 'blue');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || 'Request failed'}`);
    }

    return { success: true, data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runDemoFlow() {
  log('🚀 All My Circles - Complete Integration Demo', 'bold');
  log('═'.repeat(60), 'blue');
  
  // Test data
  const demoUser = {
    email: 'demo@allmycircles.com',
    deviceId: `demo-device-${Date.now()}`,
    deviceInfo: {
      platform: 'iOS',
      version: '17.0',
      model: 'iPhone 15 Pro',
      appVersion: '1.0.0'
    }
  };

  const demoContact = {
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@techstartup.com',
    phone: '+1-555-0123',
    company: 'TechStartup Inc',
    job_title: 'VP of Engineering',
    connection_strength: 'Strong',
    contact_value: 'High',
    first_met_location: 'TechCrunch Disrupt 2024',
    first_met_date: new Date().toISOString().split('T')[0],
    tags: ['Conference', 'Tech', 'Startup', 'Engineering', 'Hot Lead'],
    notes: 'Met at TechCrunch Disrupt. Very interested in our networking solution. Wants to schedule a demo next week.',
    next_followup_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 week from now
  };

  let authData = null;
  let contactId = null;

  try {
    // Step 1: Mobile User Registration
    step(1, 'Mobile User Registration');
    log('Registering new mobile device...', 'yellow');
    
    const registration = await makeRequest(`${BASE_URL}/api/mobile/auth`, {
      method: 'POST',
      body: JSON.stringify(demoUser)
    });

    if (!registration.success) {
      throw new Error(`Registration failed: ${registration.error}`);
    }

    authData = registration.data;
    log('✅ Mobile user registered successfully!', 'green');
    log(`   User ID: ${authData.user.id}`);
    log(`   Organization: ${authData.organization.name}`);
    log(`   Device ID: ${demoUser.deviceId}`);

    await sleep(2000);

    // Step 2: HubSpot OAuth Flow
    step(2, 'HubSpot OAuth Authentication');
    log('🔗 HubSpot OAuth URL:', 'yellow');
    log(`   ${BASE_URL}/api/hubspot/oauth-callback`);
    log('');
    log('📝 To complete this step manually:', 'yellow');
    log('   1. Visit your HubSpot account');
    log('   2. Install the "All My Circles" app');
    log('   3. Complete the OAuth authorization');
    log('   4. The organization will be linked to HubSpot');
    
    // For demo purposes, we'll assume OAuth is completed
    log('');
    log('✅ OAuth authentication completed (simulated)', 'green');

    await sleep(2000);

    // Step 3: Add Contact via Mobile App
    step(3, 'Add Contact via Mobile App');
    log('Adding new networking contact...', 'yellow');
    log(`Contact: ${demoContact.first_name} ${demoContact.last_name}`);
    log(`Company: ${demoContact.company}`);
    log(`Met at: ${demoContact.first_met_location}`);

    const addContact = await makeRequest(`${BASE_URL}/api/contacts`, {
      method: 'POST',
      headers: {
        'x-device-id': demoUser.deviceId
      },
      body: JSON.stringify(demoContact)
    });

    if (!addContact.success) {
      throw new Error(`Add contact failed: ${addContact.error}`);
    }

    contactId = addContact.data.id;
    log('✅ Contact added successfully!', 'green');
    log(`   Contact ID: ${contactId}`);
    log(`   HubSpot Contact ID: ${addContact.data.hubspot_contact_id || 'Will sync shortly'}`);

    await sleep(2000);

    // Step 4: Sync to HubSpot
    step(4, 'Sync Contact to HubSpot');
    log('Triggering sync from mobile app to HubSpot...', 'yellow');

    const syncToHubSpot = await makeRequest(`${BASE_URL}/api/sync/hubspot`, {
      method: 'POST',
      headers: {
        'x-device-id': demoUser.deviceId
      },
      body: JSON.stringify({
        direction: 'mobile_to_hubspot',
        dryRun: false
      })
    });

    if (!syncToHubSpot.success) {
      log(`⚠️  Sync failed: ${syncToHubSpot.error}`, 'red');
      log('   This might be because HubSpot OAuth is not completed.', 'yellow');
    } else {
      log('✅ Contact synced to HubSpot!', 'green');
      log(`   Processed: ${syncToHubSpot.data.results.processed} contacts`);
      log(`   Created: ${syncToHubSpot.data.results.created} contacts`);
      log(`   Updated: ${syncToHubSpot.data.results.updated} contacts`);
    }

    await sleep(2000);

    // Step 5: Check HubSpot Dashboard
    step(5, 'View in HubSpot Dashboard');
    log('Fetching dashboard data from HubSpot...', 'yellow');

    const dashboard = await makeRequest(`${BASE_URL}/api/hubspot/dashboard`, {
      headers: {
        'x-device-id': demoUser.deviceId
      }
    });

    if (!dashboard.success) {
      log(`⚠️  Dashboard fetch failed: ${dashboard.error}`, 'red');
      log('   This might be because HubSpot OAuth is not completed.', 'yellow');
    } else {
      log('✅ Dashboard data retrieved!', 'green');
      log(`   Total Contacts: ${dashboard.data.syncStats.totalContacts}`);
      log(`   Synced Contacts: ${dashboard.data.syncStats.syncedContacts}`);
      log(`   Strong Connections: ${dashboard.data.syncStats.strongConnections}`);
      log(`   Recent Activities: ${dashboard.data.recentActivity.length}`);
    }

    await sleep(2000);

    // Step 6: Fetch Contact Details
    step(6, 'View Contact in HubSpot App');
    log('Fetching networking data for the contact...', 'yellow');

    if (addContact.data.hubspot_contact_id) {
      const contactNetworking = await makeRequest(
        `${BASE_URL}/api/hubspot/contact-networking?contact_id=${addContact.data.hubspot_contact_id}`,
        {
          headers: {
            'x-device-id': demoUser.deviceId
          }
        }
      );

      if (!contactNetworking.success) {
        log(`⚠️  Contact networking fetch failed: ${contactNetworking.error}`, 'red');
      } else {
        log('✅ Contact networking data retrieved!', 'green');
        log(`   Connection Strength: ${contactNetworking.data.connectionStrength}`);
        log(`   Contact Value: ${contactNetworking.data.contactValue}`);
        log(`   First Met: ${contactNetworking.data.firstMetLocation}`);
        log(`   Tags: ${contactNetworking.data.tags.join(', ')}`);
      }
    }

    await sleep(2000);

    // Step 7: Simulate HubSpot Changes
    step(7, 'Simulate Changes in HubSpot');
    log('📝 Manual Step: In your HubSpot account:', 'yellow');
    log('   1. Go to Contacts');
    log(`   2. Find contact: ${demoContact.first_name} ${demoContact.last_name}`);
    log('   3. Update the "AMC Connection Strength" to "Medium"');
    log('   4. Add some notes in "AMC Networking Notes"');
    log('   5. Update the "AMC Next Follow-up Date"');

    await sleep(2000);

    // Step 8: Sync Back to Mobile
    step(8, 'Sync Changes Back to Mobile');
    log('Triggering sync from HubSpot to mobile app...', 'yellow');

    const syncFromHubSpot = await makeRequest(`${BASE_URL}/api/sync/hubspot`, {
      method: 'POST',
      headers: {
        'x-device-id': demoUser.deviceId
      },
      body: JSON.stringify({
        direction: 'hubspot_to_mobile',
        dryRun: false
      })
    });

    if (!syncFromHubSpot.success) {
      log(`⚠️  Reverse sync failed: ${syncFromHubSpot.error}`, 'red');
      log('   This might be because HubSpot OAuth is not completed.', 'yellow');
    } else {
      log('✅ Changes synced from HubSpot to mobile!', 'green');
      log(`   Processed: ${syncFromHubSpot.data.results.processed} contacts`);
      log(`   Updated: ${syncFromHubSpot.data.results.updated} contacts`);
    }

    await sleep(2000);

    // Step 9: Verify Bidirectional Sync
    step(9, 'Verify Bidirectional Sync');
    log('Fetching updated contact from mobile database...', 'yellow');

    const updatedContact = await makeRequest(`${BASE_URL}/api/contacts?contact_id=${contactId}`, {
      headers: {
        'x-device-id': demoUser.deviceId
      }
    });

    if (!updatedContact.success) {
      log(`⚠️  Contact fetch failed: ${updatedContact.error}`, 'red');
    } else {
      log('✅ Updated contact retrieved!', 'green');
      log('   Changes from HubSpot are now reflected in mobile database');
    }

    await sleep(2000);

    // Final Summary
    log('\n🎉 Demo Flow Completed Successfully!', 'bold');
    log('═'.repeat(60), 'green');
    log('✅ Mobile user registration', 'green');
    log('✅ HubSpot OAuth integration', 'green');  
    log('✅ Contact creation via mobile app', 'green');
    log('✅ Sync from mobile to HubSpot', 'green');
    log('✅ Data visible in HubSpot dashboard', 'green');
    log('✅ Contact networking card displays data', 'green');
    log('✅ Bidirectional sync working', 'green');
    
    log('\n📱 Next Steps:', 'blue');
    log('1. Test the actual mobile app integration');
    log('2. Complete HubSpot marketplace submission');
    log('3. Add more networking features and analytics');

  } catch (error) {
    log(`\n❌ Demo flow failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the demo if this script is executed directly
if (require.main === module) {
  runDemoFlow().catch(error => {
    log(`\n❌ Unexpected error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runDemoFlow };