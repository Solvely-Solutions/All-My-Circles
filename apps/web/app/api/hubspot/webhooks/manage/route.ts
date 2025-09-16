import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@hubspot/api-client';
import { withAuth, createApiResponse, createErrorResponse } from '../../../../../lib/api-utils';

// POST /api/hubspot/webhooks/manage - Create or update webhook subscriptions
export async function POST(request: NextRequest) {
  return withAuth(request, async ({ organization }) => {
    try {
      if (!organization.hubspot_access_token) {
        return createErrorResponse('HubSpot not connected', 400);
      }

      const body = await request.json();
      const { action = 'create' } = body;

      // Initialize HubSpot client
      const hubspotClient = new Client({ accessToken: organization.hubspot_access_token });

      if (action === 'create') {
        const subscriptions = await createWebhookSubscriptions(hubspotClient);
        return createApiResponse({
          message: 'Webhook subscriptions created successfully',
          subscriptions
        });
      } else if (action === 'list') {
        const subscriptions = await listWebhookSubscriptions(hubspotClient);
        return createApiResponse({
          subscriptions
        });
      } else if (action === 'delete') {
        const result = await deleteWebhookSubscriptions(hubspotClient, body.subscriptionIds);
        return createApiResponse({
          message: 'Webhook subscriptions deleted successfully',
          deleted: result
        });
      } else {
        return createErrorResponse('Invalid action. Supported actions: create, list, delete', 400);
      }

    } catch (error) {
      console.error('Webhook management API error:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to manage webhooks',
        500
      );
    }
  });
}

async function createWebhookSubscriptions(hubspotClient: Client) {
  const webhookUrl = 'https://all-my-circles-web-ltp4.vercel.app/api/hubspot/webhooks';

  // Define the webhook subscriptions we want to create
  const subscriptionConfigs = [
    {
      eventType: 'contact.propertyChange',
      propertyName: 'amc_connection_strength'
    },
    {
      eventType: 'contact.propertyChange',
      propertyName: 'amc_contact_value'
    },
    {
      eventType: 'contact.propertyChange',
      propertyName: 'amc_first_met_location'
    },
    {
      eventType: 'contact.propertyChange',
      propertyName: 'amc_first_met_date'
    },
    {
      eventType: 'contact.propertyChange',
      propertyName: 'amc_networking_tags'
    },
    {
      eventType: 'contact.propertyChange',
      propertyName: 'amc_networking_notes'
    },
    {
      eventType: 'contact.propertyChange',
      propertyName: 'amc_last_interaction_date'
    },
    {
      eventType: 'contact.propertyChange',
      propertyName: 'amc_next_followup_date'
    },
    {
      eventType: 'contact.propertyChange',
      propertyName: 'amc_total_interactions'
    },
    {
      eventType: 'contact.creation'
    },
    {
      eventType: 'contact.deletion'
    }
  ];

  const createdSubscriptions = [];

  for (const config of subscriptionConfigs) {
    try {
      const subscription = await hubspotClient.webhooks.subscriptionsApi.create({
        eventType: config.eventType,
        active: true,
        webhookUrl: webhookUrl,
        ...(config.propertyName && { propertyName: config.propertyName })
      });

      createdSubscriptions.push({
        id: subscription.id,
        eventType: config.eventType,
        propertyName: config.propertyName,
        webhookUrl: subscription.webhookUrl,
        active: subscription.active
      });

      console.log('Created webhook subscription:', {
        id: subscription.id,
        eventType: config.eventType,
        propertyName: config.propertyName
      });

    } catch (error: any) {
      // If subscription already exists, log but continue
      if (error?.code === 409) {
        console.log('Webhook subscription already exists:', config);
      } else {
        console.error('Failed to create webhook subscription:', config, error);
        throw error;
      }
    }
  }

  return createdSubscriptions;
}

async function listWebhookSubscriptions(hubspotClient: Client) {
  try {
    const response = await hubspotClient.webhooks.subscriptionsApi.getAll();

    // Filter to only our webhook subscriptions
    const ourWebhookUrl = 'https://all-my-circles-web-ltp4.vercel.app/api/hubspot/webhooks';
    const amcSubscriptions = response.results.filter(sub =>
      sub.webhookUrl === ourWebhookUrl
    );

    return amcSubscriptions.map(sub => ({
      id: sub.id,
      eventType: sub.eventType,
      propertyName: sub.propertyName,
      webhookUrl: sub.webhookUrl,
      active: sub.active,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt
    }));

  } catch (error) {
    console.error('Failed to list webhook subscriptions:', error);
    throw error;
  }
}

async function deleteWebhookSubscriptions(hubspotClient: Client, subscriptionIds?: string[]) {
  const deleted = [];

  if (!subscriptionIds || subscriptionIds.length === 0) {
    // Delete all our webhook subscriptions
    const subscriptions = await listWebhookSubscriptions(hubspotClient);
    subscriptionIds = subscriptions.map(sub => sub.id);
  }

  for (const subscriptionId of subscriptionIds) {
    try {
      await hubspotClient.webhooks.subscriptionsApi.archive(parseInt(subscriptionId));
      deleted.push(subscriptionId);
      console.log('Deleted webhook subscription:', subscriptionId);
    } catch (error) {
      console.error('Failed to delete webhook subscription:', subscriptionId, error);
      // Continue with other deletions
    }
  }

  return deleted;
}

// GET /api/hubspot/webhooks/manage - Get webhook subscription status
export async function GET(request: NextRequest) {
  return withAuth(request, async ({ organization }) => {
    try {
      if (!organization.hubspot_access_token) {
        return createErrorResponse('HubSpot not connected', 400);
      }

      // Initialize HubSpot client
      const hubspotClient = new Client({ accessToken: organization.hubspot_access_token });

      const subscriptions = await listWebhookSubscriptions(hubspotClient);

      // Determine if webhooks are properly configured
      const requiredEventTypes = [
        'contact.creation',
        'contact.deletion'
      ];

      const requiredPropertyWebhooks = [
        'amc_connection_strength',
        'amc_contact_value',
        'amc_first_met_location',
        'amc_networking_notes'
      ];

      const hasRequiredEvents = requiredEventTypes.every(eventType =>
        subscriptions.some(sub => sub.eventType === eventType)
      );

      const hasRequiredProperties = requiredPropertyWebhooks.every(propertyName =>
        subscriptions.some(sub =>
          sub.eventType === 'contact.propertyChange' &&
          sub.propertyName === propertyName
        )
      );

      const isFullyConfigured = hasRequiredEvents && hasRequiredProperties;

      return createApiResponse({
        subscriptions,
        status: {
          totalSubscriptions: subscriptions.length,
          activeSubscriptions: subscriptions.filter(sub => sub.active).length,
          hasRequiredEvents,
          hasRequiredProperties,
          isFullyConfigured
        },
        recommendations: isFullyConfigured ? [] : [
          ...(!hasRequiredEvents ? ['Missing contact creation/deletion webhooks'] : []),
          ...(!hasRequiredProperties ? ['Missing property change webhooks for All My Circles fields'] : [])
        ]
      });

    } catch (error) {
      console.error('Webhook status API error:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to get webhook status',
        500
      );
    }
  });
}