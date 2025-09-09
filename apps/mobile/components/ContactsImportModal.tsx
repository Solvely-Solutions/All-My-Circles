import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { X as XIcon, Smartphone, Users, CheckCircle, AlertCircle } from 'lucide-react-native';
import { AccessibleButton } from './ui/AccessibleButton';
import { GlassCard } from './ui/GlassCard';
import { SafeComponent } from './ErrorBoundary';
import { ImportedContact, ContactsImportResult } from '../types/contact';

interface ContactsImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImportContacts: (contacts: ImportedContact[]) => void;
}

function ContactsImportModalCore({ 
  visible, 
  onClose, 
  onImportContacts 
}: ContactsImportModalProps) {
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [importResult, setImportResult] = useState<ContactsImportResult | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (visible) {
      checkPermissionStatus();
      setImportResult(null);
      setSelectedContacts(new Set());
      setSelectAll(false);
    }
  }, [visible]);

  const checkPermissionStatus = async () => {
    const { getContactsPermissionStatus } = await import('../services/contactsImportService');
    const status = await getContactsPermissionStatus();
    setPermissionStatus(status);
  };

  const handlePreviewContacts = async () => {
    setLoading(true);
    try {
      const { previewDeviceContacts } = await import('../services/contactsImportService');
      const result = await previewDeviceContacts(50); // Preview first 50 contacts
      setImportResult(result);
      
      if (!result.success) {
        Alert.alert(
          'Import Error',
          result.error || 'Failed to access device contacts',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Import Error',
        'An unexpected error occurred while accessing contacts',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImportAll = async () => {
    setLoading(true);
    try {
      const { importDeviceContacts } = await import('../services/contactsImportService');
      const result = await importDeviceContacts();
      
      if (result.success) {
        onImportContacts(result.contacts);
        Alert.alert(
          'Import Successful',
          `Successfully imported ${result.contacts.length} contacts`,
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        Alert.alert(
          'Import Failed',
          result.error || 'Failed to import contacts',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Import Error',
        'An unexpected error occurred during import',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImportSelected = () => {
    if (!importResult || selectedContacts.size === 0) return;

    const contactsToImport = importResult.contacts.filter(contact =>
      selectedContacts.has(contact.id)
    );

    onImportContacts(contactsToImport);
    Alert.alert(
      'Import Successful',
      `Successfully imported ${contactsToImport.length} selected contacts`,
      [{ text: 'OK', onPress: onClose }]
    );
  };

  const toggleContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
    setSelectAll(newSelected.size === importResult?.contacts.length);
  };

  const toggleSelectAll = () => {
    if (!importResult) return;
    
    if (selectAll) {
      setSelectedContacts(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(importResult.contacts.map(c => c.id));
      setSelectedContacts(allIds);
      setSelectAll(true);
    }
  };

  const renderPermissionRequest = () => (
    <View style={styles.centeredContent}>
      <Smartphone size={64} color="rgba(255,255,255,0.6)" style={styles.icon} />
      <Text style={styles.title}>Import Device Contacts</Text>
      <Text style={styles.description}>
        Import contacts from your device's address book to quickly populate your network.
        We'll only access contacts you choose to import.
      </Text>
      
      <AccessibleButton
        onPress={handlePreviewContacts}
        variant="primary"
        size="large"
        title={loading ? "Loading..." : "Access Contacts"}
        accessibilityLabel="Request access to device contacts"
        buttonStyle={styles.primaryButton}
        textStyle={styles.primaryButtonText}
        disabled={loading}
        loading={loading}
      />
    </View>
  );

  const renderPermissionDenied = () => (
    <View style={styles.centeredContent}>
      <AlertCircle size={64} color="rgba(255,100,100,0.6)" style={styles.icon} />
      <Text style={styles.title}>Permission Required</Text>
      <Text style={styles.description}>
        To import contacts, please enable contacts permission in your device settings.
      </Text>
      
      <AccessibleButton
        onPress={handlePreviewContacts}
        variant="primary"
        size="large"
        title="Try Again"
        accessibilityLabel="Try again to access contacts"
        buttonStyle={styles.primaryButton}
        textStyle={styles.primaryButtonText}
      />
    </View>
  );

  const renderContactsList = () => {
    if (!importResult || !importResult.success) return null;

    return (
      <View style={styles.contactsList}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Found {importResult.totalFound} contacts
          </Text>
          <Text style={styles.listSubtitle}>
            Showing {importResult.contacts.length} • Select contacts to import
          </Text>
        </View>

        <View style={styles.selectAllRow}>
          <Text style={styles.selectAllText}>Select all contacts</Text>
          <Switch
            value={selectAll}
            onValueChange={toggleSelectAll}
            trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#3b82f6' }}
            thumbColor={selectAll ? '#ffffff' : 'rgba(255,255,255,0.8)'}
          />
        </View>

        <ScrollView style={styles.contactsScrollView} showsVerticalScrollIndicator={false}>
          {importResult.contacts.map((contact) => (
            <Pressable
              key={contact.id}
              style={[
                styles.contactItem,
                selectedContacts.has(contact.id) && styles.contactItemSelected
              ]}
              onPress={() => toggleContact(contact.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selectedContacts.has(contact.id) }}
              accessibilityLabel={`${contact.name}${contact.company ? ` at ${contact.company}` : ''}`}
            >
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                {contact.company && (
                  <Text style={styles.contactCompany}>{contact.company}</Text>
                )}
                <Text style={styles.contactIdentifiers}>
                  {contact.identifiers.map(id => id.value).join(' • ')}
                </Text>
              </View>
              <View style={styles.contactCheckbox}>
                {selectedContacts.has(contact.id) && (
                  <CheckCircle size={20} color="#3b82f6" />
                )}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <GlassCard style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Users size={24} color="white" />
              <Text style={styles.headerTitle}>Import Contacts</Text>
            </View>
            <AccessibleButton
              onPress={onClose}
              variant="ghost"
              size="small"
              title="✕"
              accessibilityLabel="Close import modal"
              buttonStyle={styles.closeButton}
              textStyle={{ fontSize: 20, color: 'white' }}
            />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {loading && !importResult && (
              <View style={styles.centeredContent}>
                <ActivityIndicator size="large" color="white" />
                <Text style={styles.loadingText}>Accessing contacts...</Text>
              </View>
            )}

            {!loading && permissionStatus === 'undetermined' && renderPermissionRequest()}
            {!loading && permissionStatus === 'denied' && renderPermissionDenied()}
            {!loading && importResult && renderContactsList()}
          </View>

          {/* Footer */}
          {importResult?.success && (
            <View style={styles.footer}>
              <View style={styles.footerInfo}>
                <Text style={styles.selectedCount}>
                  {selectedContacts.size} contact{selectedContacts.size === 1 ? '' : 's'} selected
                </Text>
              </View>
              
              <View style={styles.footerActions}>
                <AccessibleButton
                  onPress={handleImportAll}
                  variant="ghost"
                  size="medium"
                  title="Import All"
                  disabled={loading}
                  accessibilityLabel="Import all contacts"
                  buttonStyle={styles.secondaryButton}
                  textStyle={styles.secondaryButtonText}
                />

                <AccessibleButton
                  onPress={handleImportSelected}
                  variant="primary"
                  size="medium"
                  title={`Import Selected (${selectedContacts.size})`}
                  disabled={loading || selectedContacts.size === 0}
                  accessibilityLabel={`Import ${selectedContacts.size} selected contacts`}
                  buttonStyle={styles.primaryButton}
                  textStyle={styles.primaryButtonText}
                />
              </View>
            </View>
          )}
        </GlassCard>
      </View>
    </Modal>
  );
}

export function ContactsImportModal(props: ContactsImportModalProps) {
  return (
    <SafeComponent componentName="ContactsImportModal">
      <ContactsImportModalCore {...props} />
    </SafeComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  modalCard: {
    flex: 1,
    margin: 0,
    borderRadius: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  description: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginTop: 16,
  },
  contactsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listHeader: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  listTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  listSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  selectAllText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  contactsScrollView: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  contactItemSelected: {
    backgroundColor: 'rgba(59,130,246,0.1)',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactCompany: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 4,
  },
  contactIdentifiers: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  contactCheckbox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  footerInfo: {
    marginBottom: 16,
  },
  selectedCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButton: {
    flex: 2,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});