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
  hubspot
} from '@hubspot/ui-extensions';

hubspot.extend(({ context, runServerlessFunction, objectId, objectType }) => {
  return <NetworkingCard objectId={objectId} objectType={objectType} />;
});

const NetworkingCard = ({ objectId, objectType }) => {
  const [loading, setLoading] = useState(true);
  const [networkingData, setNetworkingData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNetworkingData();
  }, [objectId]);

  const fetchNetworkingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      // Fetch real networking data from API
      const response = await hubspot.fetch(
        `https://all-my-circles-web-ltp4.vercel.app/api/hubspot/contact-networking?contact_id=${objectId}`,
        {
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const apiResponse = await response.json();

      // Handle API-level errors
      if (apiResponse.error) {
        throw new Error(apiResponse.error);
      }

      if (!apiResponse.hasData) {
        setNetworkingData(null);
        setLoading(false);
        return;
      }

      // Transform API response to component data format with validation
      const transformedData = {
        connectionStrength: apiResponse.connectionStrength || 'Unknown',
        lastInteraction: apiResponse.lastInteractionDate,
        networkingSource: apiResponse.firstMetLocation || 'Unknown source',
        tags: Array.isArray(apiResponse.tags) ? apiResponse.tags : [],
        meetingHistory: Array.isArray(apiResponse.meetingHistory) ? apiResponse.meetingHistory : [],
        totalInteractions: parseInt(apiResponse.totalInteractions) || 0,
        nextFollowUp: apiResponse.nextFollowUpDate,
        contactValue: apiResponse.contactValue,
        contact: apiResponse.contact || {},
        lastSyncedAt: apiResponse.lastSyncedAt
      };

      setNetworkingData(transformedData);
      setLoading(false);

    } catch (err) {
      console.error('Error fetching networking data:', err);

      let errorMessage = 'Failed to load networking information';

      if (err.name === 'AbortError') {
        errorMessage = 'Request timeout - please try again';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  const getConnectionStrengthColor = (strength) => {
    switch (strength?.toLowerCase()) {
      case 'strong': return 'success';
      case 'medium': return 'warning';
      case 'weak': return 'danger';
      default: return 'default';
    }
  };

  const getContactValueColor = (value) => {
    switch (value?.toLowerCase()) {
      case 'high': return 'success';
      case 'medium': return 'warning';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Flex direction="column" align="center" gap="medium">
        <LoadingSpinner />
        <Text>Loading networking information...</Text>
      </Flex>
    );
  }

  if (error) {
    // Provide more specific error messages based on error type
    const getErrorMessage = (errorText) => {
      if (errorText.includes('404')) {
        return 'Contact not found in our system. This contact may not have been synced from the mobile app yet.';
      }
      if (errorText.includes('403')) {
        return 'Permission denied. Please check your HubSpot integration settings.';
      }
      if (errorText.includes('500')) {
        return 'Server error occurred. Our team has been notified. Please try again in a few minutes.';
      }
      if (errorText.includes('network') || errorText.includes('fetch')) {
        return 'Network connection issue. Please check your internet connection and try again.';
      }
      return errorText;
    };

    return (
      <Alert title="Unable to Load Networking Data" variant="error">
        <Text>{getErrorMessage(error)}</Text>
        <Flex direction="row" gap="xs" style={{ marginTop: '12px' }}>
          <Button onClick={fetchNetworkingData} variant="primary" size="xs">
            🔄 Try Again
          </Button>
          <Button
            onClick={() => console.log('Report issue for contact:', objectId)}
            variant="secondary"
            size="xs"
          >
            📝 Report Issue
          </Button>
        </Flex>
      </Alert>
    );
  }

  if (!networkingData) {
    return (
      <Flex direction="column" gap="medium" align="center">
        <EmptyState
          title="Ready to Add Networking Context"
          layout="vertical"
        >
          <Text>Transform this contact into a valuable networking connection!</Text>
          <Text variant="micro" format={{ color: 'secondary' }}>
            Add meeting context, connection strength, and follow-up reminders to make this contact work for your business.
          </Text>

          <Flex direction="column" gap="xs" style={{ width: '100%', marginTop: '12px' }}>
            <Button
              variant="primary"
              onClick={() => console.log('Import clicked for contact:', objectId)}
              style={{ width: '100%' }}
            >
              📱 Sync from Mobile App
            </Button>
            <Button
              variant="secondary"
              onClick={() => console.log('Manual entry clicked for contact:', objectId)}
              style={{ width: '100%' }}
            >
              ✏️ Add Networking Details
            </Button>
            <Button
              variant="secondary"
              onClick={() => console.log('Create properties clicked')}
              size="xs"
              style={{ width: '100%' }}
            >
              ⚙️ Set Up Custom Properties
            </Button>
          </Flex>

          <Text variant="micro" format={{ color: 'secondary', fontStyle: 'italic' }} style={{ marginTop: '12px' }}>
            💡 Tip: Use the mobile app to capture networking context at events and conferences
          </Text>
        </EmptyState>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="medium">
      <Flex justify="between" align="center">
        <Heading>All My Circles - Networking Profile</Heading>
        <Button variant="secondary" size="xs" onClick={fetchNetworkingData}>
          Refresh
        </Button>
      </Flex>

      {/* Key Metrics Row */}
      <Flex justify="between" gap="medium">
        <Flex direction="column" gap="xs" style={{ flex: 1 }}>
          <Text variant="micro" format={{ fontWeight: 'bold' }}>
            Connection Strength
          </Text>
          <Tag variant={getConnectionStrengthColor(networkingData.connectionStrength)}>
            {networkingData.connectionStrength}
          </Tag>
        </Flex>
        
        {networkingData.contactValue && (
          <Flex direction="column" gap="xs" style={{ flex: 1 }}>
            <Text variant="micro" format={{ fontWeight: 'bold' }}>
              Contact Value
            </Text>
            <Tag variant={getContactValueColor(networkingData.contactValue)}>
              {networkingData.contactValue} Value
            </Tag>
          </Flex>
        )}
      </Flex>

      {/* Networking Source */}
      <Flex direction="column" gap="xs">
        <Text variant="micro" format={{ fontWeight: 'bold' }}>
          First Met At
        </Text>
        <Text format={{ fontWeight: 'demibold' }}>{networkingData.networkingSource}</Text>
      </Flex>

      {/* Date Information */}
      <Flex justify="between" gap="medium">
        <Flex direction="column" gap="xs" style={{ flex: 1 }}>
          <Text variant="micro" format={{ fontWeight: 'bold' }}>
            Last Interaction
          </Text>
          <Text>{formatDate(networkingData.lastInteraction)}</Text>
        </Flex>
        
        {networkingData.nextFollowUp && (
          <Flex direction="column" gap="xs" style={{ flex: 1 }}>
            <Text variant="micro" format={{ fontWeight: 'bold' }}>
              Next Follow-up
            </Text>
            <Text>{formatDate(networkingData.nextFollowUp)}</Text>
          </Flex>
        )}
      </Flex>

      {/* Tags */}
      {networkingData.tags && networkingData.tags.length > 0 && (
        <Flex direction="column" gap="xs">
          <Text variant="micro" format={{ fontWeight: 'bold' }}>
            Tags
          </Text>
          <Flex wrap="wrap" gap="xs">
            {networkingData.tags.map((tag, index) => (
              <Tag key={index} variant="default">
                {tag}
              </Tag>
            ))}
          </Flex>
        </Flex>
      )}

      <Divider />

      {/* Meeting History */}
      <Flex direction="column" gap="xs">
        <Text variant="micro" format={{ fontWeight: 'bold' }}>
          Meeting History ({networkingData.totalInteractions} total)
        </Text>
        {networkingData.meetingHistory.map((meeting, index) => (
          <Flex key={index} direction="column" gap="xs">
            <Flex justify="between" align="start">
              <Flex direction="column" gap="xs" style={{ flex: 1 }}>
                <Text format={{ fontWeight: 'demibold' }}>{meeting.event}</Text>
                {meeting.location && (
                  <Text variant="micro" format={{ color: 'secondary' }}>
                    📍 {meeting.location}
                  </Text>
                )}
              </Flex>
              <Text variant="micro" format={{ color: 'secondary' }}>
                {formatDate(meeting.date)}
              </Text>
            </Flex>
            {meeting.notes && (
              <Text variant="micro" format={{ fontStyle: 'italic' }}>
                "{meeting.notes}"
              </Text>
            )}
            {index < networkingData.meetingHistory.length - 1 && <Divider />}
          </Flex>
        ))}
      </Flex>

      {/* Quick Actions */}
      <Divider />
      <Flex direction="column" gap="xs">
        <Text variant="micro" format={{ fontWeight: 'bold' }}>
          Quick Actions
        </Text>
        <Flex gap="xs" wrap="wrap">
          <Button 
            size="xs" 
            variant="primary"
            onClick={() => console.log('Schedule follow-up for contact:', objectId)}
          >
            📅 Schedule Follow-up
          </Button>
          <Button 
            size="xs" 
            variant="secondary"
            onClick={() => console.log('Create deal for contact:', objectId)}
          >
            💰 Create Deal
          </Button>
          <Button 
            size="xs" 
            variant="secondary"
            onClick={() => console.log('Add to sequence for contact:', objectId)}
          >
            📧 Add to Sequence
          </Button>
          <Button 
            size="xs" 
            variant="secondary"
            onClick={() => console.log('Update networking data for contact:', objectId)}
          >
            🔄 Sync Mobile Data
          </Button>
        </Flex>
        
        {networkingData.nextFollowUp && new Date(networkingData.nextFollowUp) <= new Date() && (
          <Alert title="Follow-up Due" variant="warning">
            This contact is due for a follow-up. Consider reaching out soon to maintain the relationship.
          </Alert>
        )}
        
        {networkingData.contactValue === 'High' && networkingData.connectionStrength === 'Strong' && (
          <Alert title="Hot Lead" variant="success">
            This is a high-value contact with a strong connection. Perfect candidate for business opportunities!
          </Alert>
        )}
      </Flex>
    </Flex>
  );
};