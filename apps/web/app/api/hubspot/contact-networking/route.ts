import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@hubspot/api-client';
import { withAuth, createApiResponse, createErrorResponse } from '../../../../lib/api-utils';

// GET /api/hubspot/contact-networking - Get networking data for a specific HubSpot contact
export async function GET(request: NextRequest) {
  return withAuth(request, async ({ organization }) => {
    try {
      const { searchParams } = request.nextUrl;
      const hubspotContactId = searchParams.get('contact_id');

      if (!hubspotContactId) {
        return createErrorResponse('contact_id parameter is required', 400);
      }

      if (!organization.hubspot_access_token) {
        return createErrorResponse('HubSpot not connected', 400);
      }

      // Initialize HubSpot client
      const hubspotClient = new Client({ accessToken: organization.hubspot_access_token });

      // Fetch contact from HubSpot with networking properties
      const hubspotContact = await hubspotClient.crm.contacts.basicApi.getById(
        hubspotContactId,
        [
          'firstname', 'lastname', 'email', 'phone', 'company', 'jobtitle',
          'amc_connection_strength', 'amc_contact_value', 'amc_first_met_location',
          'amc_first_met_date', 'amc_networking_tags', 'amc_networking_notes',
          'amc_last_interaction_date', 'amc_next_followup_date', 'amc_total_interactions',
          'amc_contact_id', 'createdate', 'lastmodifieddate'
        ]
      );

      const props = hubspotContact.properties;

      // Check if this contact has networking data from All My Circles
      const hasNetworkingData = props.amc_contact_id || props.amc_connection_strength;

      if (!hasNetworkingData) {
        return createApiResponse({
          hasData: false,
          contact: {
            id: hubspotContact.id,
            firstName: props.firstname || null,
            lastName: props.lastname || null,
            email: props.email || null,
            company: props.company || null,
          },
          message: 'No All My Circles networking data found for this contact'
        });
      }

      // Parse tags from comma-separated string
      const tags = props.amc_networking_tags 
        ? props.amc_networking_tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
        : [];

      // Fetch detailed networking data from our database if we have the contact ID
      let meetingHistory: any[] = [];
      let detailedNotes = null;

      if (props.amc_contact_id) {
        try {
          const { supabase } = await import('../../../../lib/api-utils');
          
          // Fetch interactions/meeting history
          const { data: interactions } = await supabase
            .from('interactions')
            .select(`
              id, interaction_type, date, notes, location,
              event:events(name, location, date)
            `)
            .eq('contact_id', props.amc_contact_id)
            .order('date', { ascending: false })
            .limit(10);

          meetingHistory = interactions?.map(interaction => ({
            date: interaction.date,
            event: interaction.event?.name || interaction.interaction_type,
            notes: interaction.notes,
            location: interaction.location || interaction.event?.location
          })) || [];

        } catch (dbError) {
          console.warn('Failed to fetch detailed networking data from database:', dbError);
          // Continue with basic HubSpot data only
        }
      }

      // Build networking data response
      const networkingData = {
        hasData: true,
        connectionStrength: props.amc_connection_strength || 'Unknown',
        contactValue: props.amc_contact_value || null,
        firstMetLocation: props.amc_first_met_location || null,
        firstMetDate: props.amc_first_met_date || null,
        lastInteractionDate: props.amc_last_interaction_date || null,
        nextFollowUpDate: props.amc_next_followup_date || null,
        totalInteractions: parseInt(props.amc_total_interactions || '0'),
        tags,
        notes: props.amc_networking_notes || null,
        meetingHistory: meetingHistory.length > 0 ? meetingHistory : [
          // Fallback to basic data if no detailed history available
          {
            date: props.amc_first_met_date || props.createdate,
            event: props.amc_first_met_location || 'Initial contact',
            notes: props.amc_networking_notes || null,
            location: props.amc_first_met_location || null
          }
        ].filter(item => item.date),
        contact: {
          id: hubspotContact.id,
          firstName: props.firstname || null,
          lastName: props.lastname || null,
          email: props.email || null,
          phone: props.phone || null,
          company: props.company || null,
          jobTitle: props.jobtitle || null,
        },
        // Metadata
        lastSyncedAt: props.lastmodifieddate || null,
        allMyCirclesContactId: props.amc_contact_id || null
      };

      return createApiResponse(networkingData);

    } catch (error) {
      console.error('Contact networking API error:', error);
      
      if (error.code === 404) {
        return createErrorResponse('Contact not found in HubSpot', 404);
      }
      
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch contact networking data',
        500
      );
    }
  });
}

// POST /api/hubspot/contact-networking - Update networking data for a HubSpot contact
export async function POST(request: NextRequest) {
  return withAuth(request, async ({ organization }) => {
    try {
      const { contactId, networkingData } = await request.json();

      if (!contactId) {
        return createErrorResponse('contactId is required', 400);
      }

      if (!organization.hubspot_access_token) {
        return createErrorResponse('HubSpot not connected', 400);
      }

      // Initialize HubSpot client
      const hubspotClient = new Client({ accessToken: organization.hubspot_access_token });

      // Prepare HubSpot property updates
      const propertiesToUpdate: any = {};

      if (networkingData.connectionStrength) {
        propertiesToUpdate.amc_connection_strength = networkingData.connectionStrength;
      }
      if (networkingData.contactValue) {
        propertiesToUpdate.amc_contact_value = networkingData.contactValue;
      }
      if (networkingData.firstMetLocation) {
        propertiesToUpdate.amc_first_met_location = networkingData.firstMetLocation;
      }
      if (networkingData.firstMetDate) {
        propertiesToUpdate.amc_first_met_date = networkingData.firstMetDate;
      }
      if (networkingData.tags && Array.isArray(networkingData.tags)) {
        propertiesToUpdate.amc_networking_tags = networkingData.tags.join(', ');
      }
      if (networkingData.notes) {
        propertiesToUpdate.amc_networking_notes = networkingData.notes;
      }
      if (networkingData.lastInteractionDate) {
        propertiesToUpdate.amc_last_interaction_date = networkingData.lastInteractionDate;
      }
      if (networkingData.nextFollowUpDate) {
        propertiesToUpdate.amc_next_followup_date = networkingData.nextFollowUpDate;
      }
      if (networkingData.totalInteractions !== undefined) {
        propertiesToUpdate.amc_total_interactions = networkingData.totalInteractions.toString();
      }

      if (Object.keys(propertiesToUpdate).length === 0) {
        return createErrorResponse('No networking data provided to update', 400);
      }

      // Update contact in HubSpot
      await hubspotClient.crm.contacts.basicApi.update(
        contactId,
        { properties: propertiesToUpdate }
      );

      return createApiResponse({
        message: 'Networking data updated successfully',
        updatedProperties: Object.keys(propertiesToUpdate),
        contactId
      });

    } catch (error) {
      console.error('Update contact networking API error:', error);
      
      if (error.code === 404) {
        return createErrorResponse('Contact not found in HubSpot', 404);
      }
      
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to update contact networking data',
        500
      );
    }
  });
}