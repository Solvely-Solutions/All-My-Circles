import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { X, Upload, Check, ExternalLink } from 'lucide-react-native';
import { GlassCard } from '../ui/GlassCard';
import { Chip } from '../ui/Chip';
import type { Contact } from '../../types/contact';
import type { CRMConnection, CRMPushResult } from '../../types/crm';
import { crmService } from '../../services/crmService';

interface CRMPushModalProps {
  visible: boolean;
  contacts: Contact[];
  onClose: () => void;
  onSuccess: (result: CRMPushResult) => void;
}

export function CRMPushModal({ visible, contacts, onClose, onSuccess }: CRMPushModalProps) {
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [createAsLead, setCreateAsLead] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const connections = useMemo(() => crmService.getActiveConnections(), []);

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  };

  const selectAllContacts = () => {
    setSelectedContacts(new Set(contacts.map(c => c.id)));
  };

  const deselectAllContacts = () => {
    setSelectedContacts(new Set());
  };

  const handlePush = async () => {
    if (!selectedConnection) {
      Alert.alert('No CRM Selected', 'Please select a CRM connection.');
      return;
    }

    if (selectedContacts.size === 0) {
      Alert.alert('No Contacts Selected', 'Please select at least one contact to push.');
      return;
    }

    setIsLoading(true);
    try {
      const contactsToPush = contacts.filter(c => selectedContacts.has(c.id));
      
      const result = await crmService.pushContacts({
        contacts: contactsToPush,
        connectionId: selectedConnection,
        createAsLead,
      });

      onSuccess(result);
      
      if (result.success) {
        Alert.alert(
          'Success!', 
          `Successfully pushed ${result.successfulPushes} of ${result.totalContacts} contacts to your CRM.`
        );
      } else {
        Alert.alert(
          'Partial Success',
          `Pushed ${result.successfulPushes} of ${result.totalContacts} contacts. ${result.failedPushes} failed.`
        );
      }
      
      onClose();
    } catch (error) {
      Alert.alert('Push Failed', error instanceof Error ? error.message : 'Unknown error occurred');
    }
    setIsLoading(false);
  };

  const getContactDisplayInfo = (contact: Contact) => {
    const email = contact.identifiers.find(i => i.type === 'email')?.value;
    const phone = contact.identifiers.find(i => i.type === 'phone')?.value;
    return { email, phone };
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View entering={FadeIn} style={styles.overlay}>
        <Animated.View entering={SlideInDown.duration(300)} style={styles.container}>
          <GlassCard style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.title}>Push to CRM</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <X size={24} color="white" />
              </Pressable>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* CRM Connection Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select CRM Connection</Text>
                {connections.length === 0 ? (
                  <View style={styles.emptyCRM}>
                    <Text style={styles.emptyText}>No CRM connections found</Text>
                    <Text style={styles.emptySubtext}>Set up a CRM connection first</Text>
                  </View>
                ) : (
                  <View style={styles.connectionsList}>
                    {connections.map(connection => (
                      <Pressable
                        key={connection.id}
                        style={[
                          styles.connectionCard,
                          selectedConnection === connection.id && styles.connectionCardSelected
                        ]}
                        onPress={() => setSelectedConnection(connection.id)}
                      >
                        <View style={styles.connectionInfo}>
                          <Text style={styles.connectionName}>{connection.name}</Text>
                          <Text style={styles.connectionProvider}>{connection.provider}</Text>
                        </View>
                        {selectedConnection === connection.id && (
                          <Check size={20} color="#6ee7b7" />
                        )}
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {/* Options */}
              {selectedConnection && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Options</Text>
                  <View style={styles.optionRow}>
                    <View>
                      <Text style={styles.optionLabel}>Create as Leads</Text>
                      <Text style={styles.optionDescription}>
                        Create contacts as leads for sales follow-up
                      </Text>
                    </View>
                    <Switch
                      value={createAsLead}
                      onValueChange={setCreateAsLead}
                      trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(59, 130, 246, 0.6)' }}
                      thumbColor={createAsLead ? '#3b82f6' : 'rgba(255,255,255,0.8)'}
                    />
                  </View>
                </View>
              )}

              {/* Contact Selection */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Select Contacts ({selectedContacts.size}/{contacts.length})
                  </Text>
                  <View style={styles.selectionButtons}>
                    <Pressable onPress={selectAllContacts} style={styles.selectionButton}>
                      <Text style={styles.selectionButtonText}>All</Text>
                    </Pressable>
                    <Pressable onPress={deselectAllContacts} style={styles.selectionButton}>
                      <Text style={styles.selectionButtonText}>None</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.contactsList}>
                  {contacts.map(contact => {
                    const { email, phone } = getContactDisplayInfo(contact);
                    const isSelected = selectedContacts.has(contact.id);
                    
                    return (
                      <Pressable
                        key={contact.id}
                        style={[
                          styles.contactCard,
                          isSelected && styles.contactCardSelected
                        ]}
                        onPress={() => toggleContactSelection(contact.id)}
                      >
                        <View style={styles.contactInfo}>
                          <Text style={styles.contactName}>{contact.name}</Text>
                          {contact.company && (
                            <Text style={styles.contactCompany}>{contact.company}</Text>
                          )}
                          {email && (
                            <Text style={styles.contactDetail}>{email}</Text>
                          )}
                          {phone && (
                            <Text style={styles.contactDetail}>{phone}</Text>
                          )}
                        </View>
                        <View style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected
                        ]}>
                          {isSelected && <Check size={16} color="white" />}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Push Button */}
              <View style={styles.buttonContainer}>
                <Pressable 
                  style={[
                    styles.pushButton, 
                    (!selectedConnection || selectedContacts.size === 0 || isLoading) && styles.pushButtonDisabled
                  ]} 
                  onPress={handlePush}
                  disabled={!selectedConnection || selectedContacts.size === 0 || isLoading}
                >
                  <Upload size={20} color="white" />
                  <Text style={styles.pushButtonText}>
                    {isLoading ? 'Pushing...' : `Push ${selectedContacts.size} Contact${selectedContacts.size !== 1 ? 's' : ''}`}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </GlassCard>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  selectionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  selectionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
  },
  selectionButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyCRM: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  emptyText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 4,
  },
  connectionsList: {
    gap: 8,
  },
  connectionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  connectionCardSelected: {
    borderColor: 'rgba(34, 197, 94, 0.5)',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  connectionProvider: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  optionDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 2,
  },
  contactsList: {
    gap: 8,
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  contactCardSelected: {
    borderColor: 'rgba(59, 130, 246, 0.5)',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  contactCompany: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  contactDetail: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkboxSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  buttonContainer: {
    marginTop: 24,
  },
  pushButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  pushButtonDisabled: {
    opacity: 0.5,
  },
  pushButtonText: {
    color: '#93c5fd',
    fontSize: 16,
    fontWeight: '600',
  },
});