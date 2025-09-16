#!/usr/bin/env node

// Use the fresh token from the logs
const accessToken = "CKCaw5SVMxIXQlNQMl8kQEwrAgoACAkHDxIFAwEiAQEYnNCZCyD4_NMnKMzFqQkyFIrsvdI-BNNL73v-4X6c4s2CWxejOixCU1AyXyRATCsCHwAIGQYcVU4MAQoEAQEBEgEBAToBAQEBAQEBASIBAQEBAUIUP1jk9HHQPhc4IYv5gIYc90wl91pKA25hMVIAWgBgAGjY89AYcAF4AQ";

async function createPropertiesDirectly() {
  console.log('Creating properties directly via HubSpot API...');

  // First create the property group
  try {
    const groupResponse = await fetch('https://api.hubapi.com/crm/v3/properties/contacts/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: 'all_my_circles',
        label: 'All My Circles',
        displayOrder: -1
      }),
    });

    const groupResult = await groupResponse.json();
    console.log('Property group result:', groupResponse.status, groupResult);
  } catch (error) {
    console.log('Group creation error (may already exist):', error.message);
  }

  // Create the basic properties that are failing
  const properties = [
    {
      name: 'amc_networking_notes',
      label: 'Networking Notes',
      description: 'Notes about networking interactions and relationship context',
      groupName: 'all_my_circles',
      type: 'string',
      fieldType: 'textarea'
    },
    {
      name: 'amc_total_interactions',
      label: 'Total Interactions',
      description: 'Total number of interactions with this contact',
      groupName: 'all_my_circles',
      type: 'number',
      fieldType: 'number'
    }
  ];

  for (const property of properties) {
    try {
      console.log(`Creating property: ${property.name}`);

      const response = await fetch('https://api.hubapi.com/crm/v3/properties/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(property),
      });

      const result = await response.json();
      console.log(`Property ${property.name} result:`, response.status, result.name || result.message || result);

      if (response.ok) {
        console.log(`✅ ${property.name} created successfully`);
      } else {
        console.log(`❌ ${property.name} failed:`, result);
      }
    } catch (error) {
      console.log(`❌ ${property.name} error:`, error.message);
    }
  }
}

createPropertiesDirectly();