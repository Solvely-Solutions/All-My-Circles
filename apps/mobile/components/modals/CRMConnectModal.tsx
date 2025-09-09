import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { X, ExternalLink, Check } from 'lucide-react-native';
import { GlassCard } from '../ui/GlassCard';
import type { CRMProvider, CRMConnection } from '../../types/crm';
import { crmService } from '../../services/crmService';

interface CRMConnectModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (connection: CRMConnection) => void;
}

type FormData = {
  provider: CRMProvider;
  name: string;
  isActive: boolean;
  // Salesforce
  salesforceInstanceUrl: string;
  salesforceAccessToken: string;
  // HubSpot
  hubspotAccessToken: string;
  hubspotPortalId: string;
  // Pipedrive
  pipedriveApiToken: string;
  pipedriveDomain: string;
  // Webhook
  webhookUrl: string;
  webhookHeaders: string; // JSON string
};

const providerInfo = {
  hubspot: {
    name: 'HubSpot',
    description: 'Connect with HubSpot CRM to sync contacts and manage your sales pipeline.',
    setupUrl: 'https://developers.hubspot.com/docs/api/private-apps',
  },
  salesforce: {
    name: 'Salesforce',
    description: 'Integrate with Salesforce to manage leads and customer relationships.',
    setupUrl: 'https://help.salesforce.com/s/articleView?id=sf.connected_app_create.htm',
  },
  pipedrive: {
    name: 'Pipedrive',
    description: 'Sync contacts with Pipedrive to track deals and sales activities.',
    setupUrl: 'https://pipedrive.readme.io/docs/how-to-find-the-api-token',
  },
  webhook: {
    name: 'Custom Webhook',
    description: 'Send contact data to any custom endpoint or integration service.',
    setupUrl: null,
  },
};

export function CRMConnectModal({ visible, onClose, onSuccess }: CRMConnectModalProps) {
  // Debug modal visibility
  console.log('🔧 CRMConnectModal render - visible:', visible);
  
  // Early return if not visible - MUST be before any hooks
  if (!visible) return null;
  
  const [step, setStep] = useState<'select' | 'configure' | 'test'>('select');
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    provider: 'hubspot',
    name: '',
    isActive: true,
    salesforceInstanceUrl: '',
    salesforceAccessToken: '',
    hubspotAccessToken: '',
    hubspotPortalId: '',
    pipedriveApiToken: '',
    pipedriveDomain: '',
    webhookUrl: '',
    webhookHeaders: '{}',
  });

  const handleProviderSelect = (provider: CRMProvider) => {
    setFormData(prev => ({ ...prev, provider, name: providerInfo[provider].name }));
    setStep('configure');
  };

  const handleTest = async () => {
    setIsLoading(true);
    try {
      const connection: Omit<CRMConnection, 'id' | 'createdAt'> = {
        provider: formData.provider,
        name: formData.name,
        isActive: formData.isActive,
        credentials: {
          salesforceInstanceUrl: formData.salesforceInstanceUrl,
          salesforceAccessToken: formData.salesforceAccessToken,
          hubspotAccessToken: formData.hubspotAccessToken,
          hubspotPortalId: formData.hubspotPortalId,
          pipedriveApiToken: formData.pipedriveApiToken,
          pipedriveDomain: formData.pipedriveDomain,
          webhookUrl: formData.webhookUrl,
          webhookHeaders: formData.webhookHeaders ? JSON.parse(formData.webhookHeaders) : {},
        },
        fieldMappings: getDefaultFieldMappings(formData.provider),
      };

      const connectionId = await crmService.addConnection(connection);
      const fullConnection = crmService.getConnections().find(c => c.id === connectionId);
      
      if (fullConnection) {
        onSuccess(fullConnection);
        Alert.alert('Success!', 'CRM connection established successfully.');
        onClose();
      }
    } catch (error) {
      Alert.alert('Connection Failed', error instanceof Error ? error.message : 'Unknown error occurred');
    }
    setIsLoading(false);
  };

  const renderProviderSelection = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Connect Your CRM</Text>
      <Text style={styles.subtitle}>
        Choose a CRM provider to start syncing your professional contacts
      </Text>

      {(Object.keys(providerInfo) as CRMProvider[]).map(provider => (
        <Pressable
          key={provider}
          style={styles.providerCard}
          onPress={() => handleProviderSelect(provider)}
        >
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>{providerInfo[provider].name}</Text>
            <Text style={styles.providerDescription}>{providerInfo[provider].description}</Text>
          </View>
          <View style={styles.providerIcon}>
            <ExternalLink size={20} color="rgba(255,255,255,0.6)" />
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );

  const renderConfiguration = () => {
    const provider = providerInfo[formData.provider];
    
    return (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Configure {provider.name}</Text>
        <Text style={styles.subtitle}>{provider.description}</Text>

        {provider.setupUrl && (
          <Pressable 
            style={styles.helpLink}
            onPress={() => {/* Open setup URL */}}
          >
            <ExternalLink size={16} color="#60a5fa" />
            <Text style={styles.helpLinkText}>Setup Guide</Text>
          </Pressable>
        )}

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Connection Name</Text>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="My CRM Connection"
              placeholderTextColor="rgba(255,255,255,0.4)"
            />
          </View>

          {formData.provider === 'hubspot' && (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Access Token</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.hubspotAccessToken}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, hubspotAccessToken: text }))}
                  placeholder="pat-na1-..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  secureTextEntry
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Portal ID</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.hubspotPortalId}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, hubspotPortalId: text }))}
                  placeholder="12345678"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                />
              </View>
            </>
          )}

          {formData.provider === 'salesforce' && (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Instance URL</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.salesforceInstanceUrl}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, salesforceInstanceUrl: text }))}
                  placeholder="https://yourorg.my.salesforce.com"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Access Token</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.salesforceAccessToken}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, salesforceAccessToken: text }))}
                  placeholder="Access token..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  secureTextEntry
                />
              </View>
            </>
          )}

          <View style={styles.switchGroup}>
            <Text style={styles.fieldLabel}>Active Connection</Text>
            <Switch
              value={formData.isActive}
              onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value }))}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(59, 130, 246, 0.6)' }}
              thumbColor={formData.isActive ? '#3b82f6' : 'rgba(255,255,255,0.8)'}
            />
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <Pressable style={styles.secondaryButton} onPress={() => setStep('select')}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
          <Pressable 
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]} 
            onPress={handleTest}
            disabled={isLoading || !formData.name.trim()}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Testing...' : 'Connect'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable 
        style={styles.backdrop} 
        onPress={onClose}
      />
      <Animated.View entering={SlideInDown.springify()} style={styles.container}>
        <GlassCard style={styles.modal}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color="white" />
            </Pressable>
          </View>

          {step === 'select' ? renderProviderSelection() : renderConfiguration()}
        </GlassCard>
      </Animated.View>
    </View>
  );
}

function getDefaultFieldMappings(provider: CRMProvider) {
  // Return default field mappings based on provider
  const mappings = [
    { localField: 'name' as keyof any, crmField: 'name', isRequired: true, transform: 'none' as const },
    { localField: 'company' as keyof any, crmField: 'company', isRequired: false, transform: 'none' as const },
    { localField: 'title' as keyof any, crmField: 'title', isRequired: false, transform: 'none' as const },
  ];

  return mappings;
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1500,
    elevation: 1500,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 18, 32, 0.95)',
  },
  container: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modal: {
    padding: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  providerDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
  providerIcon: {
    marginLeft: 12,
  },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    gap: 6,
  },
  helpLinkText: {
    color: '#60a5fa',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  form: {
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: 'white',
    fontSize: 16,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#93c5fd',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});