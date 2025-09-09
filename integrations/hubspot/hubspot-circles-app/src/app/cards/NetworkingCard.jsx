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

      // TODO: Replace with actual API call to fetch networking data
      // This would integrate with the mobile app's API to get real networking data
      // Example API call structure:
      // const response = await hubspot.fetch(`https://api.solvely.com/circles/contacts/${objectId}/networking`);
      // const networkingData = await response.json();

      // Enhanced mock data with more realistic networking scenarios
      const mockNetworkingScenarios = [
        {
          connectionStrength: 'Strong',
          lastInteraction: '2024-09-07',
          networkingSource: 'TechCrunch Disrupt 2024',
          tags: ['Conference', 'Startup', 'AI', 'Venture Capital', 'Hot Lead'],
          meetingHistory: [
            {
              date: '2024-09-07',
              event: 'TechCrunch Disrupt 2024',
              notes: 'CEO of AI startup, very interested in our networking solution. Asked for demo next week.',
              location: 'San Francisco, CA'
            },
            {
              date: '2024-08-15',
              event: 'SF Tech Meetup',
              notes: 'Initial connection, discussed AI trends and networking challenges',
              location: 'San Francisco, CA'
            }
          ],
          totalInteractions: 2,
          nextFollowUp: '2024-09-14',
          contactValue: 'High'
        },
        {
          connectionStrength: 'Medium',
          lastInteraction: '2024-09-05',
          networkingSource: 'DevCon 2024',
          tags: ['Conference', 'Tech', 'JavaScript', 'Networking', 'Developer'],
          meetingHistory: [
            {
              date: '2024-09-05',
              event: 'DevCon 2024',
              notes: 'Met at the React Native workshop, exchanged ideas about mobile development',
              location: 'Austin, TX'
            },
            {
              date: '2024-06-15',
              event: 'Tech Meetup SF',
              notes: 'Coffee chat about mobile development trends',
              location: 'San Francisco, CA'
            }
          ],
          totalInteractions: 3,
          nextFollowUp: '2024-09-20',
          contactValue: 'Medium'
        },
        {
          connectionStrength: 'Weak',
          lastInteraction: '2024-08-20',
          networkingSource: 'LinkedIn Event',
          tags: ['Online', 'Remote', 'Consulting', 'Follow-up Needed'],
          meetingHistory: [
            {
              date: '2024-08-20',
              event: 'LinkedIn Live: Future of Work',
              notes: 'Brief interaction during Q&A session, mentioned interest in networking tools',
              location: 'Virtual'
            }
          ],
          totalInteractions: 1,
          nextFollowUp: '2024-09-10',
          contactValue: 'Low'
        }
      ];

      // Randomly select a scenario for demo purposes
      const randomScenario = mockNetworkingScenarios[Math.floor(Math.random() * mockNetworkingScenarios.length)];

      // Simulate API delay
      setTimeout(() => {
        setNetworkingData(randomScenario);
        setLoading(false);
      }, 800);

    } catch (err) {
      console.error('Error fetching networking data:', err);
      setError('Failed to load networking information');
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
    return (
      <Alert title="Error" variant="error">
        {error}
        <Button onClick={fetchNetworkingData} variant="secondary">
          Retry
        </Button>
      </Alert>
    );
  }

  if (!networkingData) {
    return (
      <Flex direction="column" gap="medium" align="center">
        <EmptyState 
          title="No Networking Data Available"
          layout="vertical"
        >
          <Text>This contact hasn't been synced from your All My Circles mobile app yet.</Text>
          <Text variant="micro" format={{ color: 'secondary' }}>
            To see networking context, connection history, and relationship insights, sync this contact from your mobile app.
          </Text>
          <Flex gap="xs" justify="center" wrap="wrap">
            <Button variant="primary" onClick={() => console.log('Import clicked for contact:', objectId)}>
              📱 Import from Mobile App
            </Button>
            <Button variant="secondary" onClick={() => console.log('Manual entry clicked for contact:', objectId)}>
              ✏️ Add Manually
            </Button>
          </Flex>
        </EmptyState>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="medium">
      <Flex justify="between" align="center">
        <Heading>Networking Profile</Heading>
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