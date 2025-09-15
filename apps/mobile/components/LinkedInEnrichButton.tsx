import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { devLog } from '../utils/logger';

interface LinkedInEnrichButtonProps {
  contactId?: string;
  linkedInUrl?: string;
  onEnrichComplete?: (data: any) => void;
}

const LinkedInEnrichButton: React.FC<LinkedInEnrichButtonProps> = ({
  contactId,
  linkedInUrl,
  onEnrichComplete
}) => {
  const [isEnriching, setIsEnriching] = useState(false);

  const handleEnrich = async () => {
    if (!linkedInUrl) {
      Alert.alert('Error', 'No LinkedIn URL provided');
      return;
    }

    setIsEnriching(true);
    devLog('Starting LinkedIn enrichment for:', linkedInUrl);

    try {
      // Mock enrichment for demo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockData = {
        name: 'John Doe',
        title: 'Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco, CA',
        experience: '5+ years',
        skills: ['React', 'TypeScript', 'Node.js']
      };

      devLog('LinkedIn enrichment completed:', mockData);
      onEnrichComplete?.(mockData);
      
      Alert.alert('Success', 'LinkedIn profile enriched successfully!');
    } catch (error) {
      devLog('LinkedIn enrichment failed:', error);
      Alert.alert('Error', 'Failed to enrich LinkedIn profile');
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleEnrich}
      disabled={isEnriching || !linkedInUrl}
      className={`px-4 py-2 rounded-lg ${
        isEnriching || !linkedInUrl 
          ? 'bg-gray-300' 
          : 'bg-blue-600'
      }`}
    >
      <Text className={`text-center font-medium ${
        isEnriching || !linkedInUrl 
          ? 'text-gray-500' 
          : 'text-white'
      }`}>
        {isEnriching ? 'Enriching...' : 'Enrich from LinkedIn'}
      </Text>
    </TouchableOpacity>
  );
};

export default LinkedInEnrichButton;