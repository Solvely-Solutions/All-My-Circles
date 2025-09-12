import React, { useState, useEffect } from 'react';
import {
  Alert,
  Button,
  Divider,
  Flex,
  Heading,
  LoadingSpinner,
  Text,
  Tag,
  Link,
  EmptyState,
  Box,
  ProgressBar,
  hubspot
} from '@hubspot/ui-extensions';
import { HeaderActions, PrimaryHeaderActionButton, SecondaryHeaderActionButton } from '@hubspot/ui-extensions/pages/home';

hubspot.extend<"home">(({ context }) => {
  return <AllMyCirclesHomePage context={context} />;
});

const AllMyCirclesHomePage = ({ context }) => {
  const [loading, setLoading] = useState(true);
  const [syncStats, setSyncStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch real dashboard data from API
      const response = await hubspot.fetch(
        `https://all-my-circles-web-ltp4.vercel.app/api/hubspot/dashboard`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const dashboardData = await response.json();
      
      setSyncStats(dashboardData.syncStats);
      setRecentActivity(dashboardData.recentActivity);
      setConnectionStatus(dashboardData.connectionStatus);
      setLoading(false);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(`Failed to load dashboard information: ${err.message}`);
      setLoading(false);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getConnectionStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'success';
      case 'syncing': return 'warning';
      case 'error': return 'danger';
      default: return 'default';
    }
  };

  const handleManualSync = async () => {
    try {
      console.log('Manual sync triggered');
      setConnectionStatus('syncing');

      const response = await hubspot.fetch(
        `https://all-my-circles-web-ltp4.vercel.app/api/sync/hubspot`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            direction: 'bidirectional',
            dryRun: false
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      const syncResult = await response.json();
      console.log('Sync completed:', syncResult);

      setConnectionStatus('connected');
      
      // Refresh dashboard data to show updated stats
      await fetchDashboardData();

    } catch (err) {
      console.error('Manual sync error:', err);
      setConnectionStatus('error');
      setError(`Sync failed: ${err.message}`);
    }
  };

  const handleExportData = () => {
    console.log('Export data triggered');
  };

  const handleViewSettings = () => {
    console.log('View settings triggered');
  };

  if (loading) {
    return (
      <>
        <HeaderActions>
          <PrimaryHeaderActionButton disabled>
            🔄 Sync Now
          </PrimaryHeaderActionButton>
          <SecondaryHeaderActionButton disabled>
            📊 Export Data
          </SecondaryHeaderActionButton>
          <SecondaryHeaderActionButton disabled>
            ⚙️ Settings
          </SecondaryHeaderActionButton>
        </HeaderActions>
        <Flex direction="column" align="center" gap="medium" style={{ padding: '40px' }}>
          <LoadingSpinner />
          <Text>Loading your networking dashboard...</Text>
        </Flex>
      </>
    );
  }

  if (error) {
    return (
      <>
        <HeaderActions>
          <PrimaryHeaderActionButton onClick={fetchDashboardData}>
            🔄 Retry
          </PrimaryHeaderActionButton>
        </HeaderActions>
        <Alert title="Error" variant="error">
          {error}
        </Alert>
      </>
    );
  }

  return (
    <>
      <HeaderActions>
        <PrimaryHeaderActionButton onClick={handleManualSync}>
          🔄 Sync Now
        </PrimaryHeaderActionButton>
        <SecondaryHeaderActionButton onClick={handleExportData}>
          📊 Export Data
        </SecondaryHeaderActionButton>
        <SecondaryHeaderActionButton onClick={handleViewSettings}>
          ⚙️ Settings
        </SecondaryHeaderActionButton>
        <SecondaryHeaderActionButton href="https://docs.solvely.com/circles/hubspot-integration">
          📚 Help Docs
        </SecondaryHeaderActionButton>
      </HeaderActions>

      <Flex direction="column" gap="large" style={{ padding: '20px' }}>
        {/* Connection Status */}
        <Alert 
          title={`Mobile App ${connectionStatus === 'connected' ? 'Connected' : 'Status'}`} 
          variant={getConnectionStatusColor(connectionStatus)}
        >
          {connectionStatus === 'connected' 
            ? 'Your mobile app is successfully syncing with HubSpot'
            : connectionStatus === 'syncing'
            ? 'Syncing contacts with mobile app...'
            : 'Checking connection status...'
          }
        </Alert>

        {/* Sync Progress */}
        {syncStats && (
          <Flex direction="column" gap="medium">
            <Heading level={3}>Sync Overview</Heading>
            <Flex direction="column" gap="xs">
              <Flex justify="between">
                <Text format={{ fontWeight: 'bold' }}>Contact Sync Progress</Text>
                <Text>{syncStats.syncedContacts}/{syncStats.totalContacts} contacts</Text>
              </Flex>
              <ProgressBar value={syncStats.syncProgress} />
              <Text variant="micro" format={{ color: 'secondary' }}>
                Last synced {formatTimeAgo(syncStats.lastSyncTime)}
                {syncStats.pendingSync > 0 && ` • ${syncStats.pendingSync} pending`}
              </Text>
            </Flex>
          </Flex>
        )}

        {/* Stats Grid */}
        {syncStats && (
          <Flex direction="column" gap="medium">
            <Heading level={3}>Network Statistics</Heading>
            <Flex wrap="wrap" gap="medium">
              {/* Total Contacts */}
              <Box style={{ 
                flex: '1 1 200px', 
                minWidth: '200px',
                padding: '16px',
                border: '1px solid #e1e5e9',
                borderRadius: '8px'
              }}>
                <Flex direction="column" gap="xs" align="center">
                  <Text variant="micro" format={{ fontWeight: 'bold', color: 'secondary' }}>
                    TOTAL CONTACTS
                  </Text>
                  <Text format={{ fontSize: '24px', fontWeight: 'bold' }}>
                    {syncStats.totalContacts.toLocaleString()}
                  </Text>
                  <Tag variant="default">{syncStats.totalEvents} events</Tag>
                </Flex>
              </Box>

              {/* Connection Strength Breakdown */}
              <Box style={{ 
                flex: '1 1 200px', 
                minWidth: '200px',
                padding: '16px',
                border: '1px solid #e1e5e9',
                borderRadius: '8px'
              }}>
                <Flex direction="column" gap="xs">
                  <Text variant="micro" format={{ fontWeight: 'bold', color: 'secondary' }}>
                    CONNECTION STRENGTH
                  </Text>
                  <Flex direction="column" gap="xs">
                    <Flex justify="between">
                      <Tag variant="success" size="xs">Strong</Tag>
                      <Text>{syncStats.strongConnections}</Text>
                    </Flex>
                    <Flex justify="between">
                      <Tag variant="warning" size="xs">Medium</Tag>
                      <Text>{syncStats.mediumConnections}</Text>
                    </Flex>
                    <Flex justify="between">
                      <Tag variant="default" size="xs">Weak</Tag>
                      <Text>{syncStats.weakConnections}</Text>
                    </Flex>
                  </Flex>
                </Flex>
              </Box>

              {/* Pending Actions */}
              <Box style={{ 
                flex: '1 1 200px', 
                minWidth: '200px',
                padding: '16px',
                border: '1px solid #e1e5e9',
                borderRadius: '8px'
              }}>
                <Flex direction="column" gap="xs" align="center">
                  <Text variant="micro" format={{ fontWeight: 'bold', color: 'secondary' }}>
                    PENDING SYNC
                  </Text>
                  <Text format={{ fontSize: '24px', fontWeight: 'bold' }}>
                    {syncStats.pendingSync}
                  </Text>
                  <Button size="xs" variant="primary" onClick={handleManualSync}>
                    Sync Now
                  </Button>
                </Flex>
              </Box>
            </Flex>
          </Flex>
        )}

        <Divider />

        {/* Recent Activity */}
        <Flex direction="column" gap="medium">
          <Flex justify="between" align="center">
            <Heading level={3}>Recent Activity</Heading>
            <Link href="#">View All</Link>
          </Flex>
          
          {recentActivity.length > 0 ? (
            <Flex direction="column" gap="xs">
              {recentActivity.map((activity) => (
                <Flex key={activity.id} justify="between" align="center" gap="medium">
                  <Flex align="center" gap="medium" style={{ flex: 1 }}>
                    <Text>{activity.icon}</Text>
                    <Text style={{ flex: 1 }}>{activity.message}</Text>
                  </Flex>
                  <Text variant="micro" format={{ color: 'secondary' }}>
                    {formatTimeAgo(activity.timestamp)}
                  </Text>
                </Flex>
              ))}
            </Flex>
          ) : (
            <EmptyState title="No Recent Activity" layout="vertical">
              <Text>Your networking activity will appear here once you start syncing contacts.</Text>
            </EmptyState>
          )}
        </Flex>
      </Flex>
    </>
  );
};
