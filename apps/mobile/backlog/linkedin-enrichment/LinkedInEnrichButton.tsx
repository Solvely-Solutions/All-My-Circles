import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { enrichContactWithLinkedIn, LinkedInEnrichmentResponse } from '../utils/linkedin-webhook';
import { LinkedInStore } from '../utils/linkedin-store';

interface LinkedInEnrichButtonProps {
  email: string;
  onEnrichmentComplete?: (data: LinkedInEnrichmentResponse) => void;
  style?: any;
}

export default function LinkedInEnrichButton({ 
  email, 
  onEnrichmentComplete,
  style = {}
}: LinkedInEnrichButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Searching...');
  const [result, setResult] = useState<LinkedInEnrichmentResponse | null>(null);

  const handleEnrich = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please provide a valid email address');
      return;
    }

    setIsLoading(true);
    setResult(null);
    
    // Progress messages during the wait
    const messages = [
      'Searching LinkedIn...',
      'Processing request...',
      'Waiting for results...',
      'Still searching...',
      'Almost done...'
    ];
    
    let messageIndex = 0;
    setLoadingMessage(messages[0]);
    
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setLoadingMessage(messages[messageIndex]);
    }, 3000); // Change message every 3 seconds

    try {
      const response = await enrichContactWithLinkedIn(email);
      
      // Handle pending async response
      if (response.error === 'PENDING') {
        setLoadingMessage('Request submitted, waiting for results...');
        
        // Start polling for results
        const pollForResults = async () => {
          let attempts = 0;
          const maxAttempts = 20; // Poll for up to 1 minute (3 seconds * 20)
          
          const poll = async () => {
            attempts++;
            
            // Poll the API endpoint for results
            try {
              const response = await fetch(`http://localhost:8083/api/linkedin-result/${encodeURIComponent(email)}`);
              
              if (response.ok) {
                const completedResult = await response.json();
                
                if (completedResult && completedResult.success !== false) {
                  clearInterval(messageInterval);
                  setResult(completedResult);
                  setIsLoading(false);
                  
                  if (completedResult.success && completedResult.data) {
                    Alert.alert(
                      'Success!', 
                      `Found LinkedIn data for ${completedResult.data.name || 'contact'}`,
                      [
                        {
                          text: 'View Details',
                          onPress: () => {
                            const details = Object.entries(completedResult.data || {})
                              .filter(([_, value]) => value && value !== '')
                              .map(([key, value]) => `${key}: ${value}`)
                              .join('\n');
                            Alert.alert('LinkedIn Data', details);
                          }
                        },
                        { text: 'OK' }
                      ]
                    );
                  } else {
                    Alert.alert('No Results', 'No LinkedIn profile found for this email');
                  }
                  
                  if (onEnrichmentComplete) {
                    onEnrichmentComplete(completedResult);
                  }
                  return;
                }
              }
              
              // No result yet, continue polling
              if (attempts < maxAttempts) {
                setTimeout(poll, 3000); // Poll every 3 seconds
              } else {
                // Timeout
                clearInterval(messageInterval);
                setIsLoading(false);
                const timeoutResult = {
                  success: false,
                  error: 'LinkedIn search timed out. Please try again later.'
                };
                setResult(timeoutResult);
                Alert.alert('Timeout', 'LinkedIn search is taking longer than expected. Please try again later.');
              }
            } catch (error) {
              console.error('Error polling for results:', error);
              if (attempts < maxAttempts) {
                setTimeout(poll, 3000); // Continue polling even if there's an error
              } else {
                // Timeout with error
                clearInterval(messageInterval);
                setIsLoading(false);
                const errorResult = {
                  success: false,
                  error: 'Failed to check for LinkedIn results'
                };
                setResult(errorResult);
                Alert.alert('Error', 'Failed to check for LinkedIn results');
              }
            }
          };
          
          poll();
        };
        
        pollForResults();
        return; // Don't proceed to immediate handling
      }
      
      // Handle immediate response (shouldn't happen with async webhooks, but just in case)
      clearInterval(messageInterval);
      setResult(response);
      
      if (response.success && response.data) {
        Alert.alert(
          'Success!', 
          `Found LinkedIn data for ${response.data.name || 'contact'}`,
          [
            {
              text: 'View Details',
              onPress: () => {
                const details = Object.entries(response.data || {})
                  .filter(([_, value]) => value && value !== '')
                  .map(([key, value]) => `${key}: ${value}`)
                  .join('\n');
                Alert.alert('LinkedIn Data', details);
              }
            },
            { text: 'OK' }
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to enrich contact');
      }
      
      if (onEnrichmentComplete) {
        onEnrichmentComplete(response);
      }
    } catch (error) {
      console.error('Enrichment failed:', error);
      clearInterval(messageInterval);
      const errorResult = {
        success: false,
        error: 'Failed to enrich contact'
      };
      setResult(errorResult);
      Alert.alert('Error', 'Failed to enrich contact');
    } finally {
      // Only set loading to false if we're not polling
      if (!isLoading) {
        setIsLoading(false);
      }
      if (!messageInterval) {
        setLoadingMessage('Searching...');
      }
    }
  };

  return (
    <View style={style}>
      <TouchableOpacity
        onPress={handleEnrich}
        disabled={isLoading || !email}
        className={`flex-row items-center justify-center px-6 py-4 rounded-xl ${
          isLoading || !email 
            ? 'bg-gray-400' 
            : 'bg-blue-500 active:bg-blue-600'
        }`}
        style={{
          shadowColor: '#3B82F6',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isLoading || !email ? 0 : 0.25,
          shadowRadius: 8,
          elevation: isLoading || !email ? 0 : 8,
        }}
      >
        {isLoading && (
          <ActivityIndicator 
            size="small" 
            color="white" 
            style={{ marginRight: 8 }} 
          />
        )}
        <Text className="text-white font-semibold text-base">
          {isLoading ? loadingMessage : '🔗 Enrich with LinkedIn'}
        </Text>
      </TouchableOpacity>
      
      {result && (
        <View className="mt-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
          {result.success ? (
            <View>
              <Text className="font-semibold text-green-600 mb-2">
                ✓ Enrichment Successful
              </Text>
              {result.data && (
                <View className="space-y-1">
                  {result.data.name && (
                    <Text className="text-sm">
                      <Text className="font-medium">Name:</Text> {result.data.name}
                    </Text>
                  )}
                  {result.data.title && (
                    <Text className="text-sm">
                      <Text className="font-medium">Title:</Text> {result.data.title}
                    </Text>
                  )}
                  {result.data.company && (
                    <Text className="text-sm">
                      <Text className="font-medium">Company:</Text> {result.data.company}
                    </Text>
                  )}
                </View>
              )}
            </View>
          ) : (
            <View>
              <Text className="font-semibold text-red-600 mb-1">
                ✗ Enrichment Failed
              </Text>
              <Text className="text-sm text-gray-600">{result.error}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}