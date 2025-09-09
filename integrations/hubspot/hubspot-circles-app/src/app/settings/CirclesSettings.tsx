import React, { useState, useEffect } from 'react';
import {
  Button,
  Divider,
  ErrorState,
  Flex,
  LoadingSpinner,
  Text,
  StepIndicator,
  Input,
  Form,
  Alert,
  Heading,
  Toggle,
  Select,
  Tag,
  Link,
  Box,
  Textarea,
  DateInput,
  NumberInput
} from '@hubspot/ui-extensions';

const CirclesSettings = () => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [mobileAppConnected, setMobileAppConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Advanced sync settings
  const [syncSettings, setSyncSettings] = useState({
    autoSync: true,
    syncFrequency: '15', // minutes
    bidirectionalSync: true,
    syncOnMobileAppUpdate: true,
    syncContactPhotos: true,
    syncCustomFields: true,
    maxSyncBatchSize: 100,
    syncDeletedContacts: false,
    lastSyncTime: null
  });

  // Filter settings
  const [filterSettings, setFilterSettings] = useState({
    minConnectionStrength: 'weak',
    excludeTags: [],
    includeOnlyTags: [],
    dateRangeFilter: {
      enabled: false,
      startDate: '',
      endDate: ''
    },
    eventTypeFilter: []
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    syncComplete: true,
    syncErrors: true,
    newContacts: true,
    followUpReminders: true,
    duplicateDetection: true
  });

  const [currentUser, setCurrentUser] = useState(null);
  const [apiHealth, setApiHealth] = useState({
    hubspotApi: 'checking',
    mobileApi: 'checking'
  });

  useEffect(() => {
    // TODO: Check connection status with mobile app
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual API calls to check connection status
      // This would call both HubSpot API and mobile app API
      // Example: 
      // const hubspotStatus = await hubspot.fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1');
      // const mobileStatus = await hubspot.fetch('https://api.solvely.com/circles/health');
      
      // Simulate connection check with realistic data
      setTimeout(() => {
        setConnectionStatus('connected');
        setMobileAppConnected(true);
        setApiHealth({
          hubspotApi: 'connected',
          mobileApi: 'connected'
        });
        setCurrentUser({
          name: 'John Doe',
          email: 'john@example.com',
          mobileAppVersion: '2.1.0',
          lastSync: new Date(Date.now() - 3600000) // 1 hour ago
        });
        setSyncSettings(prev => ({
          ...prev,
          lastSyncTime: new Date(Date.now() - 3600000)
        }));
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error checking connection:', error);
      setApiHealth({
        hubspotApi: 'error',
        mobileApi: 'error'
      });
      setLoading(false);
    }
  };

  const handleSyncSettingsChange = (key, value) => {
    setSyncSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleFilterSettingsChange = (key, value) => {
    setFilterSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNotificationSettingsChange = (key, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleManualSync = async () => {
    console.log('Starting manual sync...');
    // TODO: Implement manual sync functionality
    setSyncSettings(prev => ({
      ...prev,
      lastSyncTime: new Date()
    }));
  };

  const handleResetConnection = async () => {
    console.log('Resetting connection...');
    setMobileAppConnected(false);
    setConnectionStatus('disconnected');
    // TODO: Implement connection reset
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <Flex direction="column" align="center" gap="medium">
        <LoadingSpinner />
        <Text>Checking connection status...</Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="large" style={{ padding: '20px' }}>
      <Flex justify="between" align="center">
        <Heading>All My Circles Integration Settings</Heading>
        <Button size="xs" variant="secondary" onClick={checkConnectionStatus}>
          🔄 Refresh Status
        </Button>
      </Flex>
      
      {/* Connection Status Overview */}
      <Box style={{ 
        padding: '16px',
        border: '1px solid #e1e5e9',
        borderRadius: '8px',
        backgroundColor: mobileAppConnected ? '#f3f9f3' : '#fff8f0'
      }}>
        <Flex direction="column" gap="medium">
          <Flex justify="between" align="center">
            <Heading level={3}>Connection Status</Heading>
            <Tag variant={mobileAppConnected ? 'success' : 'warning'}>
              {mobileAppConnected ? 'Connected' : 'Disconnected'}
            </Tag>
          </Flex>
          
          {currentUser && (
            <Flex direction="column" gap="xs">
              <Text format={{ fontWeight: 'bold' }}>Connected User: {currentUser.name}</Text>
              <Text variant="micro">Email: {currentUser.email}</Text>
              <Text variant="micro">Mobile App Version: {currentUser.mobileAppVersion}</Text>
              <Text variant="micro">Last Activity: {formatTimeAgo(currentUser.lastSync)}</Text>
            </Flex>
          )}

          <Flex justify="between">
            <Flex direction="column" gap="xs">
              <Text variant="micro" format={{ fontWeight: 'bold' }}>API Health</Text>
              <Flex gap="xs">
                <Tag variant={apiHealth.hubspotApi === 'connected' ? 'success' : 'danger'} size="xs">
                  HubSpot API
                </Tag>
                <Tag variant={apiHealth.mobileApi === 'connected' ? 'success' : 'danger'} size="xs">
                  Mobile API
                </Tag>
              </Flex>
            </Flex>
            
            {mobileAppConnected && (
              <Button size="xs" variant="secondary" onClick={handleResetConnection}>
                Reset Connection
              </Button>
            )}
          </Flex>

          <StepIndicator 
            currentStep={mobileAppConnected ? 2 : 0}
            stepNames={[
              'Download All My Circles App',
              'Authenticate with HubSpot',
              'Start Syncing Contacts'
            ]}
          />
        </Flex>
      </Box>

      <Divider />

      {/* Advanced Sync Settings */}
      <Flex direction="column" gap="medium">
        <Heading level={3}>Sync Configuration</Heading>
        
        {!mobileAppConnected ? (
          <Alert title="Setup Required" variant="info">
            Connect your mobile app first to configure sync settings.
          </Alert>
        ) : (
          <Flex direction="column" gap="large">
            {/* Basic Sync Settings */}
            <Box style={{ 
              padding: '16px',
              border: '1px solid #e1e5e9',
              borderRadius: '8px'
            }}>
              <Flex direction="column" gap="medium">
                <Heading level={4}>Basic Settings</Heading>
                
                <Flex justify="between" align="center">
                  <Flex direction="column" gap="xs">
                    <Text format={{ fontWeight: 'bold' }}>Auto Sync</Text>
                    <Text variant="micro">Automatically sync contacts when changes are detected</Text>
                  </Flex>
                  <Toggle 
                    checked={syncSettings.autoSync}
                    onChange={(checked) => handleSyncSettingsChange('autoSync', checked)}
                  />
                </Flex>

                {syncSettings.autoSync && (
                  <Flex direction="column" gap="xs">
                    <Text format={{ fontWeight: 'bold' }}>Sync Frequency</Text>
                    <Select
                      value={syncSettings.syncFrequency}
                      onChange={(value) => handleSyncSettingsChange('syncFrequency', value)}
                      options={[
                        { label: 'Every 5 minutes', value: '5' },
                        { label: 'Every 15 minutes', value: '15' },
                        { label: 'Every 30 minutes', value: '30' },
                        { label: 'Every hour', value: '60' },
                        { label: 'Every 4 hours', value: '240' }
                      ]}
                    />
                  </Flex>
                )}

                <Flex justify="between" align="center">
                  <Flex direction="column" gap="xs">
                    <Text format={{ fontWeight: 'bold' }}>Bidirectional Sync</Text>
                    <Text variant="micro">Sync changes both ways (HubSpot ↔ Mobile App)</Text>
                  </Flex>
                  <Toggle 
                    checked={syncSettings.bidirectionalSync}
                    onChange={(checked) => handleSyncSettingsChange('bidirectionalSync', checked)}
                  />
                </Flex>

                <Flex direction="column" gap="xs">
                  <Text format={{ fontWeight: 'bold' }}>Batch Size</Text>
                  <Text variant="micro">Maximum contacts to sync in one batch</Text>
                  <NumberInput
                    value={syncSettings.maxSyncBatchSize}
                    onChange={(value) => handleSyncSettingsChange('maxSyncBatchSize', value)}
                    min={10}
                    max={500}
                  />
                </Flex>
              </Flex>
            </Box>

            {/* Advanced Options */}
            <Box style={{ 
              padding: '16px',
              border: '1px solid #e1e5e9',
              borderRadius: '8px'
            }}>
              <Flex direction="column" gap="medium">
                <Heading level={4}>Advanced Options</Heading>
                
                <Flex justify="between" align="center">
                  <Flex direction="column" gap="xs">
                    <Text format={{ fontWeight: 'bold' }}>Sync Contact Photos</Text>
                    <Text variant="micro">Include profile photos in sync</Text>
                  </Flex>
                  <Toggle 
                    checked={syncSettings.syncContactPhotos}
                    onChange={(checked) => handleSyncSettingsChange('syncContactPhotos', checked)}
                  />
                </Flex>

                <Flex justify="between" align="center">
                  <Flex direction="column" gap="xs">
                    <Text format={{ fontWeight: 'bold' }}>Sync Custom Fields</Text>
                    <Text variant="micro">Include networking-specific custom properties</Text>
                  </Flex>
                  <Toggle 
                    checked={syncSettings.syncCustomFields}
                    onChange={(checked) => handleSyncSettingsChange('syncCustomFields', checked)}
                  />
                </Flex>

                <Flex justify="between" align="center">
                  <Flex direction="column" gap="xs">
                    <Text format={{ fontWeight: 'bold' }}>Sync Deleted Contacts</Text>
                    <Text variant="micro">Remove contacts from HubSpot when deleted in mobile app</Text>
                  </Flex>
                  <Toggle 
                    checked={syncSettings.syncDeletedContacts}
                    onChange={(checked) => handleSyncSettingsChange('syncDeletedContacts', checked)}
                  />
                </Flex>
              </Flex>
            </Box>

            {/* Sync Filters */}
            <Box style={{ 
              padding: '16px',
              border: '1px solid #e1e5e9',
              borderRadius: '8px'
            }}>
              <Flex direction="column" gap="medium">
                <Heading level={4}>Sync Filters</Heading>
                
                <Flex direction="column" gap="xs">
                  <Text format={{ fontWeight: 'bold' }}>Minimum Connection Strength</Text>
                  <Text variant="micro">Only sync contacts with this connection level or higher</Text>
                  <Select
                    value={filterSettings.minConnectionStrength}
                    onChange={(value) => handleFilterSettingsChange('minConnectionStrength', value)}
                    options={[
                      { label: 'All connections (Weak+)', value: 'weak' },
                      { label: 'Medium+ connections only', value: 'medium' },
                      { label: 'Strong connections only', value: 'strong' }
                    ]}
                  />
                </Flex>
              </Flex>
            </Box>

            {/* Manual Sync Actions */}
            <Box style={{ 
              padding: '16px',
              border: '1px solid #e1e5e9',
              borderRadius: '8px'
            }}>
              <Flex direction="column" gap="medium">
                <Heading level={4}>Manual Actions</Heading>
                
                <Flex justify="between" align="center">
                  <Flex direction="column" gap="xs">
                    <Text format={{ fontWeight: 'bold' }}>Last Sync</Text>
                    <Text variant="micro">{formatTimeAgo(syncSettings.lastSyncTime)}</Text>
                  </Flex>
                  <Button variant="primary" onClick={handleManualSync}>
                    🔄 Sync Now
                  </Button>
                </Flex>

                <Flex wrap="wrap" gap="xs">
                  <Button size="xs" variant="secondary">
                    📊 Export Sync Report
                  </Button>
                  <Button size="xs" variant="secondary">
                    🧹 Clear Sync Cache
                  </Button>
                  <Button size="xs" variant="secondary">
                    📋 View Sync Logs
                  </Button>
                </Flex>
              </Flex>
            </Box>
          </Flex>
        )}
      </Flex>

      <Divider />

      {/* Notifications */}
      {mobileAppConnected && (
        <>
          <Flex direction="column" gap="medium">
            <Heading level={3}>Notification Settings</Heading>
            
            <Box style={{ 
              padding: '16px',
              border: '1px solid #e1e5e9',
              borderRadius: '8px'
            }}>
              <Flex direction="column" gap="medium">
                <Flex justify="between" align="center">
                  <Text>Sync completion notifications</Text>
                  <Toggle 
                    checked={notificationSettings.syncComplete}
                    onChange={(checked) => handleNotificationSettingsChange('syncComplete', checked)}
                  />
                </Flex>
                
                <Flex justify="between" align="center">
                  <Text>Error notifications</Text>
                  <Toggle 
                    checked={notificationSettings.syncErrors}
                    onChange={(checked) => handleNotificationSettingsChange('syncErrors', checked)}
                  />
                </Flex>
                
                <Flex justify="between" align="center">
                  <Text>New contact notifications</Text>
                  <Toggle 
                    checked={notificationSettings.newContacts}
                    onChange={(checked) => handleNotificationSettingsChange('newContacts', checked)}
                  />
                </Flex>
                
                <Flex justify="between" align="center">
                  <Text>Follow-up reminders</Text>
                  <Toggle 
                    checked={notificationSettings.followUpReminders}
                    onChange={(checked) => handleNotificationSettingsChange('followUpReminders', checked)}
                  />
                </Flex>
              </Flex>
            </Box>
          </Flex>

          <Divider />
        </>
      )}

      {/* Support */}
      <Flex direction="column" gap="medium">
        <Heading level={3}>Support & Documentation</Heading>
        
        <Box style={{ 
          padding: '16px',
          border: '1px solid #e1e5e9',
          borderRadius: '8px'
        }}>
          <Flex direction="column" gap="medium">
            <Text>
              Need help with your integration? Our support team is here to assist you.
            </Text>
            
            <Flex wrap="wrap" gap="medium">
              <Button variant="secondary">
                📚 View Documentation
              </Button>
              <Button variant="secondary">
                💬 Contact Support
              </Button>
              <Button variant="secondary">
                🎥 Watch Tutorials
              </Button>
            </Flex>
            
            <Flex direction="column" gap="xs">
              <Text variant="micro" format={{ fontWeight: 'bold' }}>Quick Links</Text>
              <Link href="https://docs.solvely.com/circles/hubspot-integration">
                Integration Guide
              </Link>
              <Link href="https://support.solvely.com">
                Support Portal
              </Link>
              <Link href="mailto:support@solvely.com">
                support@solvely.com
              </Link>
            </Flex>
          </Flex>
        </Box>
      </Flex>
    </Flex>
  );
};

export default CirclesSettings;