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

      // TODO: Replace with actual API calls to fetch dashboard data
      // This would integrate with both HubSpot API and mobile app API
      const mockStats = {
        totalContacts: 1247,
        syncedContacts: 892,
        pendingSync: 23,
        totalEvents: 15,
        strongConnections: 156,
        mediumConnections: 423,
        weakConnections: 313,
        lastSyncTime: new Date(Date.now() - 3600000), // 1 hour ago
        syncProgress: 71.6
      };

      const mockActivity = [
        {
          id: 1,
          type: 'contact_synced',
          message: 'Synced 12 new contacts from TechCrunch Disrupt 2024',
          timestamp: new Date(Date.now() - 900000), // 15 minutes ago
          icon: '👥'
        },
        {
          id: 2,
          type: 'follow_up_due',
          message: '3 high-value contacts are due for follow-up',
          timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
          icon: '⏰'
        },
        {
          id: 3,
          type: 'deal_created',
          message: 'Deal created for Sarah Chen - $50k potential',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          icon: '💰'
        },
        {
          id: 4,
          type: 'event_added',
          message: 'New event added: Y Combinator Demo Day',
          timestamp: new Date(Date.now() - 7200000), // 2 hours ago
          icon: '🎯'
        }
      ];

      // Simulate API delay
      setTimeout(() => {
        setSyncStats(mockStats);
        setRecentActivity(mockActivity);
        setConnectionStatus('connected');
        setLoading(false);
      }, 1000);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard information');
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

  const handleManualSync = () => {
    console.log('Manual sync triggered');
    setConnectionStatus('syncing');
    setTimeout(() => {
      setConnectionStatus('connected');
      setSyncStats(prev => ({
        ...prev,
        lastSyncTime: new Date(),
        pendingSync: 0
      }));
    }, 3000);
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
