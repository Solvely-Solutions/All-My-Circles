import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@hubspot/api-client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function getOrganizationFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const deviceId = request.headers.get('x-device-id');
  
  if (!authHeader && !deviceId) {
    throw new Error('Authentication required');
  }

  let organizationId;

  if (deviceId) {
    const { data: user } = await supabase
      .from('users')
      .select('organization_id')
      .eq('mobile_device_id', deviceId)
      .single();
    
    if (!user) throw new Error('Device not authorized');
    organizationId = user.organization_id;
  } else {
    const portalId = request.cookies.get('hubspot_portal_id')?.value;
    if (!portalId) throw new Error('Portal ID not found');

    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('hubspot_portal_id', parseInt(portalId))
      .single();
    
    if (!org) throw new Error('Organization not found');
    organizationId = org.id;
  }

  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single();

  if (!organization) throw new Error('Organization not found');
  return organization;
}

async function createSyncLog(organizationId: string, syncType: string, triggeredBy: string) {
  const { data: syncLog } = await supabase
    .from('sync_logs')
    .insert({
      organization_id: organizationId,
      sync_type: syncType,
      status: 'syncing',
      triggered_by: triggeredBy,
    })
    .select()
    .single();

  return syncLog;
}

async function updateSyncLog(syncLogId: string, updates: any) {
  await supabase
    .from('sync_logs')
    .update(updates)
    .eq('id', syncLogId);
}

// POST /api/sync/hubspot - Trigger HubSpot sync
export async function POST(request: NextRequest) {
  try {
    const organization = await getOrganizationFromRequest(request);
    const { direction = 'bidirectional', dryRun = false } = await request.json();

    if (!organization.hubspot_access_token) {
      return NextResponse.json(
        { error: 'HubSpot not connected. Please authenticate first.' },
        { status: 400 }
      );
    }

    const hubspotClient = new Client({ accessToken: organization.hubspot_access_token });
    const syncLog = await createSyncLog(organization.id, direction, 'manual');
    
    let results = {
      processed: 0,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[]
    };

    try {
      // Sync from mobile to HubSpot
      if (direction === 'mobile_to_hubspot' || direction === 'bidirectional') {
        const { data: contactsToSync } = await supabase
          .from('contacts')
          .select('*')
          .eq('organization_id', organization.id)
          .eq('hubspot_sync_needed', true);

        for (const contact of contactsToSync || []) {
          results.processed++;
          try {
            const hubspotProperties = {
              firstname: contact.first_name || '',
              lastname: contact.last_name || '',
              email: contact.email || '',
              phone: contact.phone || '',
              company: contact.company || '',
              jobtitle: contact.job_title || '',
              // All My Circles custom networking properties
              amc_connection_strength: contact.connection_strength || '',
              amc_contact_value: contact.contact_value || '',
              amc_first_met_location: contact.first_met_location || '',
              amc_first_met_date: contact.first_met_date || '',
              amc_networking_tags: contact.tags?.join(', ') || '',
              amc_networking_notes: contact.notes || '',
              amc_last_interaction_date: contact.last_interaction_date || '',
              amc_next_followup_date: contact.next_followup_date || '',
              amc_total_interactions: contact.total_interactions?.toString() || '',
              amc_contact_id: contact.id || '',
            };

            if (!dryRun) {
              if (contact.hubspot_contact_id) {
                // Update existing contact
                await hubspotClient.crm.contacts.basicApi.update(
                  contact.hubspot_contact_id.toString(),
                  { properties: hubspotProperties }
                );
                results.updated++;
              } else {
                // Create new contact
                const hubspotResponse = await hubspotClient.crm.contacts.basicApi.create({
                  properties: hubspotProperties,
                  associations: []
                });
                
                await supabase
                  .from('contacts')
                  .update({
                    hubspot_contact_id: parseInt(hubspotResponse.id),
                    hubspot_sync_needed: false,
                    last_synced_at: new Date().toISOString(),
                  })
                  .eq('id', contact.id);
                
                results.created++;
              }

              if (contact.hubspot_contact_id) {
                await supabase
                  .from('contacts')
                  .update({
                    hubspot_sync_needed: false,
                    last_synced_at: new Date().toISOString(),
                  })
                  .eq('id', contact.id);
              }
            }
          } catch (error) {
            results.failed++;
            results.errors.push(`Contact ${contact.id}: ${error}`);
          }
        }
      }

      // Sync from HubSpot to mobile
      if (direction === 'hubspot_to_mobile' || direction === 'bidirectional') {
        try {
          const hubspotContacts = await hubspotClient.crm.contacts.basicApi.getPage(
            undefined, // limit
            undefined, // after
            [
              'firstname', 'lastname', 'email', 'phone', 'company', 'jobtitle',
              'createdate', 'lastmodifieddate', 'hs_object_id'
            ]
          );

          for (const hubspotContact of hubspotContacts.results) {
            results.processed++;
            try {
              const contactData = {
                organization_id: organization.id,
                hubspot_contact_id: parseInt(hubspotContact.id),
                first_name: hubspotContact.properties.firstname || null,
                last_name: hubspotContact.properties.lastname || null,
                email: hubspotContact.properties.email || null,
                phone: hubspotContact.properties.phone || null,
                company: hubspotContact.properties.company || null,
                job_title: hubspotContact.properties.jobtitle || null,
                last_synced_at: new Date().toISOString(),
                mobile_sync_needed: true,
              };

              if (!dryRun) {
                const { data: existingContact } = await supabase
                  .from('contacts')
                  .select('id')
                  .eq('organization_id', organization.id)
                  .eq('hubspot_contact_id', parseInt(hubspotContact.id))
                  .single();

                if (existingContact) {
                  await supabase
                    .from('contacts')
                    .update(contactData)
                    .eq('id', existingContact.id);
                  results.updated++;
                } else {
                  await supabase
                    .from('contacts')
                    .insert(contactData);
                  results.created++;
                }
              }
            } catch (error) {
              results.failed++;
              results.errors.push(`HubSpot contact ${hubspotContact.id}: ${error}`);
            }
          }
        } catch (hubspotError) {
          results.errors.push(`HubSpot API error: ${hubspotError}`);
        }
      }

      // Update sync log with results
      await updateSyncLog(syncLog.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        records_processed: results.processed,
        records_created: results.created,
        records_updated: results.updated,
        records_failed: results.failed,
        error_details: results.errors.length > 0 ? { errors: results.errors } : null,
      });

      return NextResponse.json({
        message: 'Sync completed successfully',
        results,
        dryRun,
        syncLogId: syncLog.id
      });

    } catch (error) {
      await updateSyncLog(syncLog.id, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
        records_processed: results.processed,
        records_created: results.created,
        records_updated: results.updated,
        records_failed: results.failed,
      });

      throw error;
    }

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/sync/hubspot - Get sync status and history
export async function GET(request: NextRequest) {
  try {
    const organization = await getOrganizationFromRequest(request);
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    const { data: syncLogs, error } = await supabase
      .from('sync_logs')
      .select('*')
      .eq('organization_id', organization.id)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch sync history' }, { status: 500 });
    }

    // Get counts of contacts needing sync
    const { data: syncStats } = await supabase
      .from('contacts')
      .select('hubspot_sync_needed, mobile_sync_needed')
      .eq('organization_id', organization.id);

    const pendingSyncCounts = {
      hubspot_sync_needed: syncStats?.filter(c => c.hubspot_sync_needed).length || 0,
      mobile_sync_needed: syncStats?.filter(c => c.mobile_sync_needed).length || 0,
    };

    return NextResponse.json({
      syncLogs,
      pendingSyncCounts,
      isConnected: !!organization.hubspot_access_token,
    });

  } catch (error) {
    console.error('Get sync status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}