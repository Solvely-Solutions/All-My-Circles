/**
 * Script to create custom properties in HubSpot for networking data
 * Run this after connecting to HubSpot to set up required custom fields
 */

import { Client } from '@hubspot/api-client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface CustomProperty {
  name: string;
  label: string;
  description: string;
  groupName: string;
  type: 'enumeration' | 'string' | 'date';
  fieldType: 'text' | 'textarea' | 'select' | 'date';
  options?: Array<{
    label: string;
    value: string;
    description?: string;
  }>;
}

const networkingProperties: CustomProperty[] = [
  {
    name: 'amc_first_met_date',
    label: 'First Met Date',
    description: 'When you first met this contact (All My Circles)',
    groupName: 'all_my_circles_information',
    type: 'date',
    fieldType: 'date'
  },
  {
    name: 'amc_first_met_location',
    label: 'First Met Location',
    description: 'Where you first met this contact (All My Circles)',
    groupName: 'all_my_circles_information',
    type: 'string',
    fieldType: 'text'
  },
  {
    name: 'amc_networking_notes',
    label: 'Networking Notes',
    description: 'Personal notes about this contact and your interactions (All My Circles)',
    groupName: 'all_my_circles_information',
    type: 'string',
    fieldType: 'textarea'
  },
  {
    name: 'amc_networking_tags',
    label: 'Networking Tags',
    description: 'Tags to categorize this contact (All My Circles, comma-separated)',
    groupName: 'all_my_circles_information',
    type: 'string',
    fieldType: 'textarea'
  },
  {
    name: 'amc_total_interactions',
    label: 'Total Interactions',
    description: 'Number of times you have interacted with this contact (All My Circles)',
    groupName: 'all_my_circles_information',
    type: 'string',
    fieldType: 'text'
  }
];

async function createCustomProperty(hubspotClient: Client, property: CustomProperty) {
  try {
    const propertyConfig: any = {
      name: property.name,
      label: property.label,
      description: property.description,
      groupName: property.groupName,
      type: property.type,
      fieldType: property.fieldType,
      formField: true,
    };

    if (property.options) {
      propertyConfig.options = property.options.map((option, index) => ({
        label: option.label,
        value: option.value,
        description: option.description,
        displayOrder: index
      }));
    }

    const response = await hubspotClient.crm.properties.coreApi.create(
      'contacts',
      propertyConfig
    );

    console.log(`✅ Created property: ${property.name} (${response.name})`);
    return response;
  } catch (error: any) {
    if (error.code === 409) {
      console.log(`⚠️  Property already exists: ${property.name}`);
      return null;
    } else {
      console.error(`❌ Failed to create property ${property.name}:`, error.message);
      console.error(`   Error details:`, error.body || error);
      // Don't throw - continue with other properties
      return null;
    }
  }
}

async function createPropertyGroup(hubspotClient: Client) {
  try {
    const groupConfig = {
      name: 'all_my_circles_information',
      label: 'All My Circles Information',
      displayOrder: 10
    };

    const response = await hubspotClient.crm.properties.groupsApi.create(
      'contacts',
      groupConfig
    );

    console.log(`✅ Created property group: all_my_circles_information`);
    return response;
  } catch (error: any) {
    if (error.code === 409) {
      console.log(`⚠️  Property group already exists: all_my_circles_information`);
      return null;
    } else {
      console.error(`❌ Failed to create property group:`, error.message);
      throw error;
    }
  }
}

export async function setupHubSpotProperties(organizationId: string) {
  try {
    // Get organization with HubSpot credentials
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (error || !organization) {
      throw new Error('Organization not found');
    }

    if (!organization.hubspot_access_token) {
      throw new Error('HubSpot not connected for this organization');
    }

    const hubspotClient = new Client({ accessToken: organization.hubspot_access_token });

    console.log(`🚀 Setting up custom properties for HubSpot portal ${organization.hubspot_portal_id}...`);

    // Create property group first
    await createPropertyGroup(hubspotClient);

    // Create all networking properties
    const results = [];
    for (const property of networkingProperties) {
      const result = await createCustomProperty(hubspotClient, property);
      results.push(result);
      
      // Store property mapping in database
      if (result) {
        await supabase
          .from('hubspot_custom_properties')
          .upsert({
            organization_id: organizationId,
            property_name: property.name,
            property_type: property.type,
            hubspot_property_name: result.name,
            field_mapping: property.name, // maps to contacts table column
          }, { onConflict: 'organization_id,property_name' });
      }
    }

    console.log(`\n🎉 Setup complete! Created ${results.filter(r => r !== null).length} new properties.`);
    console.log(`\n📋 Summary of networking properties:`);
    networkingProperties.forEach(prop => {
      console.log(`   • ${prop.label} (${prop.name})`);
    });

    return results;

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  }
}

// CLI usage
if (require.main === module) {
  const organizationId = process.argv[2];
  
  if (!organizationId) {
    console.error('Usage: ts-node setup-hubspot-properties.ts <organization-id>');
    process.exit(1);
  }

  setupHubSpotProperties(organizationId)
    .then(() => {
      console.log('\n✅ All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Setup failed:', error);
      process.exit(1);
    });
}