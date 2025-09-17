import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createApiResponse, createErrorResponse, supabase } from '../../../../lib/api-utils';
import { setupHubSpotProperties } from '../../../../scripts/setup-hubspot-properties';

// POST /api/setup/hubspot-properties - Create custom properties in HubSpot
export async function POST(request: NextRequest) {
  return withAuth(request, async ({ organization }) => {
    try {
      if (!organization.hubspot_access_token) {
        return createErrorResponse('HubSpot not connected. Please authenticate first.', 400);
      }

      console.log(`Setting up HubSpot properties for organization ${organization.id}...`);
      
      const results = await setupHubSpotProperties(organization.id);
      
      const createdCount = results.filter(r => r !== null).length;
      const skippedCount = results.length - createdCount;

      return createApiResponse({
        message: 'HubSpot properties setup completed',
        results: {
          created: createdCount,
          skipped: skippedCount,
          total: results.length
        },
        properties: results.filter(r => r !== null).map(r => ({
          name: r?.name,
          label: r?.label,
          type: r?.type
        }))
      });

    } catch (error) {
      console.error('Setup properties error:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to setup properties',
        500
      );
    }
  });
}

// GET /api/setup/hubspot-properties - Check property setup status
export async function GET(request: NextRequest) {
  return withAuth(request, async ({ organization }) => {
    try {
      if (!organization.hubspot_access_token) {
        return createApiResponse({
          isSetup: false,
          message: 'HubSpot not connected'
        });
      }

      // Check if properties have been created by querying the mapping table
      const { data: properties, error } = await supabase
        .from('hubspot_custom_properties')
        .select('*')
        .eq('organization_id', organization.id);

      if (error) {
        console.error('Database error:', error);
        return createErrorResponse('Failed to check setup status', 500);
      }

      const expectedProperties = [
        'amc_first_met_date',
        'amc_first_met_location',
        'amc_networking_notes',
        'amc_networking_tags',
        'amc_total_interactions'
      ];

      const setupProperties = properties?.map(p => p.property_name) || [];
      const missingProperties = expectedProperties.filter(prop => !setupProperties.includes(prop));
      
      const isSetup = missingProperties.length === 0;

      return createApiResponse({
        isSetup,
        setupProperties,
        missingProperties,
        totalExpected: expectedProperties.length,
        totalSetup: setupProperties.length,
        message: isSetup 
          ? 'All networking properties are set up in HubSpot'
          : `${missingProperties.length} properties need to be created`
      });

    } catch (error) {
      console.error('Check setup status error:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to check setup status',
        500
      );
    }
  });
}