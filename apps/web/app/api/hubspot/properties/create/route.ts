import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@hubspot/api-client';
import { withAuth, createApiResponse, createErrorResponse } from '../../../../../lib/api-utils';

// Custom properties for All My Circles networking data
const NETWORKING_PROPERTIES = [
  {
    name: 'amc_connection_strength',
    label: 'Connection Strength',
    description: 'How strong the relationship is with this contact (Strong, Medium, Weak)',
    groupName: 'all_my_circles',
    type: 'enumeration',
    fieldType: 'select',
    options: [
      { label: 'Strong', value: 'Strong' },
      { label: 'Medium', value: 'Medium' },
      { label: 'Weak', value: 'Weak' }
    ]
  },
  {
    name: 'amc_contact_value',
    label: 'Contact Value',
    description: 'The potential business value of this contact (High, Medium, Low)',
    groupName: 'all_my_circles',
    type: 'enumeration',
    fieldType: 'select',
    options: [
      { label: 'High', value: 'High' },
      { label: 'Medium', value: 'Medium' },
      { label: 'Low', value: 'Low' }
    ]
  },
  {
    name: 'amc_first_met_location',
    label: 'First Met Location',
    description: 'Where you first met this contact (conference, event, etc.)',
    groupName: 'all_my_circles',
    type: 'string',
    fieldType: 'text'
  },
  {
    name: 'amc_first_met_date',
    label: 'First Met Date',
    description: 'When you first met this contact',
    groupName: 'all_my_circles',
    type: 'date',
    fieldType: 'date'
  },
  {
    name: 'amc_networking_tags',
    label: 'Networking Tags',
    description: 'Tags associated with this contact (comma-separated)',
    groupName: 'all_my_circles',
    type: 'string',
    fieldType: 'textarea'
  },
  {
    name: 'amc_networking_notes',
    label: 'Networking Notes',
    description: 'Notes about this contact and your interactions',
    groupName: 'all_my_circles',
    type: 'string',
    fieldType: 'textarea'
  },
  {
    name: 'amc_last_interaction_date',
    label: 'Last Interaction Date',
    description: 'When you last interacted with this contact',
    groupName: 'all_my_circles',
    type: 'date',
    fieldType: 'date'
  },
  {
    name: 'amc_next_followup_date',
    label: 'Next Follow-up Date',
    description: 'When you plan to follow up with this contact',
    groupName: 'all_my_circles',
    type: 'date',
    fieldType: 'date'
  },
  {
    name: 'amc_total_interactions',
    label: 'Total Interactions',
    description: 'Total number of recorded interactions with this contact',
    groupName: 'all_my_circles',
    type: 'number',
    fieldType: 'number'
  },
  {
    name: 'amc_contact_id',
    label: 'All My Circles Contact ID',
    description: 'Internal contact ID from All My Circles mobile app',
    groupName: 'all_my_circles',
    type: 'string',
    fieldType: 'text'
  }
];

// POST /api/hubspot/properties/create - Create custom properties for All My Circles
export async function POST(request: NextRequest) {
  return withAuth(request, async ({ organization }) => {
    try {
      if (!organization.hubspot_access_token) {
        return createErrorResponse('HubSpot not connected', 400);
      }

      // Initialize HubSpot client
      const hubspotClient = new Client({ accessToken: organization.hubspot_access_token });

      const results = {
        created: [] as string[],
        existed: [] as string[],
        errors: [] as { property: string; error: string }[]
      };

      // First, create the property group if it doesn't exist
      try {
        await hubspotClient.crm.properties.groupsApi.create('contacts', {
          name: 'all_my_circles',
          displayName: 'All My Circles',
          displayOrder: 10
        });
        console.log('Created property group: all_my_circles');
      } catch (groupError: any) {
        if (groupError?.code !== 409) { // 409 means group already exists
          console.warn('Failed to create property group:', groupError?.message);
        }
      }

      // Create each property
      for (const property of NETWORKING_PROPERTIES) {
        try {
          const propertyDefinition: any = {
            name: property.name,
            label: property.label,
            description: property.description,
            groupName: property.groupName,
            type: property.type,
            fieldType: property.fieldType,
            hasUniqueValue: false,
            hidden: false,
            displayOrder: -1
          };

          // Add options for enumeration properties
          if (property.type === 'enumeration' && property.options) {
            propertyDefinition.options = property.options.map((opt, index) => ({
              label: opt.label,
              value: opt.value,
              displayOrder: index,
              hidden: false
            }));
          }

          await hubspotClient.crm.properties.coreApi.create('contacts', propertyDefinition);
          results.created.push(property.name);
          console.log(`Created property: ${property.name}`);

        } catch (propertyError: any) {
          if (propertyError?.code === 409) {
            // Property already exists
            results.existed.push(property.name);
            console.log(`Property already exists: ${property.name}`);
          } else {
            results.errors.push({
              property: property.name,
              error: propertyError?.message || 'Unknown error'
            });
            console.error(`Failed to create property ${property.name}:`, propertyError?.message);
          }
        }
      }

      return createApiResponse({
        message: 'Property creation process completed',
        results: {
          total: NETWORKING_PROPERTIES.length,
          created: results.created.length,
          existed: results.existed.length,
          errors: results.errors.length
        },
        details: results
      });

    } catch (error) {
      console.error('Properties creation API error:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to create custom properties',
        500
      );
    }
  });
}

// GET /api/hubspot/properties/create - Check which properties exist
export async function GET(request: NextRequest) {
  return withAuth(request, async ({ organization }) => {
    try {
      if (!organization.hubspot_access_token) {
        return createErrorResponse('HubSpot not connected', 400);
      }

      // Initialize HubSpot client
      const hubspotClient = new Client({ accessToken: organization.hubspot_access_token });

      const existingProperties = await hubspotClient.crm.properties.coreApi.getAll('contacts');

      const amcProperties = existingProperties.results.filter(prop =>
        prop.name.startsWith('amc_')
      );

      const requiredProperties = NETWORKING_PROPERTIES.map(p => p.name);
      const missingProperties = requiredProperties.filter(required =>
        !amcProperties.find(existing => existing.name === required)
      );

      return createApiResponse({
        existingProperties: amcProperties.map(p => ({
          name: p.name,
          label: p.label,
          type: p.type
        })),
        missingProperties,
        allRequiredExist: missingProperties.length === 0,
        summary: {
          total: requiredProperties.length,
          existing: amcProperties.length,
          missing: missingProperties.length
        }
      });

    } catch (error) {
      console.error('Properties check API error:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to check custom properties',
        500
      );
    }
  });
}