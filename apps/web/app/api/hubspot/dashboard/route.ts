import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@hubspot/api-client';
import { withAuth, createApiResponse, createErrorResponse } from '../../../../lib/api-utils';

// GET /api/hubspot/dashboard - Get dashboard statistics and recent activity
export async function GET(request: NextRequest) {
  return withAuth(request, async ({ organization }) => {
    try {
      if (!organization.hubspot_access_token) {
        return createErrorResponse('HubSpot not connected', 400);
      }

      // Initialize HubSpot client
      const hubspotClient = new Client({ accessToken: organization.hubspot_access_token });

      // Get All My Circles contacts from HubSpot (those with amc_contact_id property)
      const allMyCirclesContacts = await hubspotClient.crm.contacts.basicApi.getPage(
        100, // limit
        undefined, // after
        [
          'firstname', 'lastname', 'email', 'company',
          'amc_connection_strength', 'amc_contact_value', 'amc_contact_id',
          'amc_total_interactions', 'amc_last_interaction_date', 'amc_next_followup_date',
          'createdate', 'lastmodifieddate'
        ],
        undefined, // propertiesWithHistory
        undefined, // associations
        false, // archived
        undefined // filterGroups
      );

      // Filter contacts that have All My Circles data
      const networkingContacts = allMyCirclesContacts.results.filter(contact => 
        contact.properties.amc_contact_id || contact.properties.amc_connection_strength
      );

      // Calculate connection strength distribution
      const connectionStats = {
        strong: 0,
        medium: 0,
        weak: 0,
        unknown: 0
      };

      networkingContacts.forEach(contact => {
        const strength = contact.properties.amc_connection_strength?.toLowerCase();
        switch (strength) {
          case 'strong':
            connectionStats.strong++;
            break;
          case 'medium':
            connectionStats.medium++;
            break;
          case 'weak':
            connectionStats.weak++;
            break;
          default:
            connectionStats.unknown++;
        }
      });

      // Calculate sync statistics
      const totalHubSpotContacts = allMyCirclesContacts.total;
      const syncedContacts = networkingContacts.length;
      const syncProgress = totalHubSpotContacts > 0 ? (syncedContacts / totalHubSpotContacts) * 100 : 0;

      // Get contacts that need follow-up (next_followup_date is in the past)
      const now = new Date();
      const contactsDueForFollowUp = networkingContacts.filter(contact => {
        const followUpDate = contact.properties.amc_next_followup_date;
        return followUpDate && new Date(followUpDate) <= now;
      });

      // Get recent activity from database if available
      let recentActivity: any[] = [];
      const { supabase } = await import('../../../../lib/api-utils');
      
      try {
        // Get recent sync logs
        const { data: syncLogs } = await supabase
          .from('sync_logs')
          .select('*')
          .eq('organization_id', organization.id)
          .order('started_at', { ascending: false })
          .limit(5);

        // Get recent contacts created
        const { data: recentContacts } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, created_at, first_met_location')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false })
          .limit(10);

        // Build activity feed
        const activities: any[] = [];

        // Add sync activities
        syncLogs?.forEach(log => {
          if (log.status === 'completed' && log.records_created > 0) {
            activities.push({
              id: `sync-${log.id}`,
              type: 'contact_synced',
              message: `Synced ${log.records_created} new contacts from mobile app`,
              timestamp: new Date(log.completed_at),
              icon: '👥'
            });
          }
        });

        // Add follow-up reminders
        if (contactsDueForFollowUp.length > 0) {
          activities.push({
            id: 'follow-up-due',
            type: 'follow_up_due',
            message: `${contactsDueForFollowUp.length} high-value contacts are due for follow-up`,
            timestamp: new Date(),
            icon: '⏰'
          });
        }

        // Add recent contact additions
        recentContacts?.slice(0, 3).forEach(contact => {
          activities.push({
            id: `contact-${contact.id}`,
            type: 'contact_added',
            message: `New contact added: ${contact.first_name} ${contact.last_name}${contact.first_met_location ? ` from ${contact.first_met_location}` : ''}`,
            timestamp: new Date(contact.created_at),
            icon: '✨'
          });
        });

        // Sort activities by timestamp
        recentActivity = activities
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 8); // Limit to 8 most recent activities

      } catch (dbError) {
        console.warn('Failed to fetch detailed activity from database:', dbError);
        
        // Fallback activity based on HubSpot data only
        recentActivity = [
          {
            id: 'hubspot-sync',
            type: 'contact_synced',
            message: `Found ${syncedContacts} contacts with All My Circles networking data`,
            timestamp: new Date(),
            icon: '📊'
          }
        ];

        if (contactsDueForFollowUp.length > 0) {
          recentActivity.unshift({
            id: 'follow-up-due',
            type: 'follow_up_due',
            message: `${contactsDueForFollowUp.length} contacts are due for follow-up`,
            timestamp: new Date(),
            icon: '⏰'
          });
        }
      }

      // Calculate estimated events (unique first_met_locations)
      const uniqueLocations = new Set(
        networkingContacts
          .map(c => c.properties.amc_first_met_location)
          .filter(Boolean)
      );

      // Get last sync time from most recent sync log
      let lastSyncTime = null;
      try {
        const { data: lastSync } = await supabase
          .from('sync_logs')
          .select('completed_at')
          .eq('organization_id', organization.id)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(1)
          .single();
        
        lastSyncTime = lastSync?.completed_at ? new Date(lastSync.completed_at) : null;
      } catch {
        // No sync history available
      }

      const dashboardData = {
        connectionStatus: 'connected',
        syncStats: {
          totalContacts: totalHubSpotContacts,
          syncedContacts,
          pendingSync: Math.max(0, totalHubSpotContacts - syncedContacts),
          totalEvents: uniqueLocations.size,
          strongConnections: connectionStats.strong,
          mediumConnections: connectionStats.medium,
          weakConnections: connectionStats.weak,
          unknownConnections: connectionStats.unknown,
          lastSyncTime: lastSyncTime || new Date(Date.now() - 3600000), // Default to 1 hour ago
          syncProgress: Math.round(syncProgress * 10) / 10 // Round to 1 decimal place
        },
        recentActivity,
        alerts: [
          ...(contactsDueForFollowUp.length > 0 ? [{
            type: 'follow_up_due',
            title: 'Follow-ups Due',
            message: `${contactsDueForFollowUp.length} contacts are ready for follow-up`,
            contactCount: contactsDueForFollowUp.length
          }] : []),
          ...(connectionStats.strong > 10 ? [{
            type: 'hot_leads',
            title: 'Strong Connections',
            message: `You have ${connectionStats.strong} strong connections - great networking!`,
            contactCount: connectionStats.strong
          }] : [])
        ]
      };

      return createApiResponse(dashboardData);

    } catch (error) {
      console.error('Dashboard API error:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch dashboard data',
        500
      );
    }
  });
}