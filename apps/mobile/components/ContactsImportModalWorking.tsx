import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ImportedContact, ContactsImportResult } from '../types/contact';

interface ContactsImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImportContacts: (contacts: ImportedContact[]) => void;
}

export function ContactsImportModal({ 
  visible, 
  onClose, 
  onImportContacts 
}: ContactsImportModalProps) {
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<ContactsImportResult | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) {
      setImportResult(null);
      setSelectedContacts(new Set());
    }
  }, [visible]);

  const handleImportContacts = async () => {
    setLoading(true);
    try {
      const { importDeviceContacts } = await import('../services/contactsImportService');
      const result = await importDeviceContacts();
      
      if (result.success) {
        setImportResult(result);
        // Auto-select all contacts
        const allIds = new Set(result.contacts.map(c => c.id));
        setSelectedContacts(allIds);
      } else {
        Alert.alert(
          'Import Error',
          result.error || 'Failed to access device contacts',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error importing contacts:', error);
      Alert.alert(
        'Import Error',
        'An unexpected error occurred while accessing contacts',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (!importResult || selectedContacts.size === 0) return;

    const contactsToImport = importResult.contacts.filter(contact =>
      selectedContacts.has(contact.id)
    );

    onImportContacts(contactsToImport);
    Alert.alert(
      'Import Successful',
      `Successfully imported ${contactsToImport.length} contacts`,
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
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: '#0b1220',
        padding: 20
      }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 30,
          marginTop: 50
        }}>
          <Text style={{
            color: 'white',
            fontSize: 24,
            fontWeight: 'bold'
          }}>
            Import Contacts
          </Text>
          <Pressable
            onPress={onClose}
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: 10,
              borderRadius: 20,
              minWidth: 40,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: 'white', fontSize: 16 }}>✕</Text>
          </Pressable>
        </View>

        {/* Content */}
        {!importResult && (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {loading ? (
              <>
                <ActivityIndicator size="large" color="white" />
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  marginTop: 20
                }}>
                  Accessing your contacts...
                </Text>
              </>
            ) : (
              <>
                <Text style={{
                  color: 'white',
                  fontSize: 18,
                  textAlign: 'center',
                  marginBottom: 30,
                  lineHeight: 24
                }}>
                  Import contacts from your device's address book to quickly populate your network.
                </Text>
                
                <Pressable
                  onPress={handleImportContacts}
                  style={{
                    backgroundColor: '#3b82f6',
                    paddingVertical: 15,
                    paddingHorizontal: 30,
                    borderRadius: 12,
                    minWidth: 200,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{
                    color: 'white',
                    fontSize: 16,
                    fontWeight: 'bold'
                  }}>
                    Access Contacts
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        )}

        {/* Contacts List */}
        {importResult?.success && (
          <View style={{ flex: 1 }}>
            <Text style={{
              color: 'white',
              fontSize: 18,
              marginBottom: 20
            }}>
              Found {importResult.totalFound} contacts
            </Text>

            <ScrollView style={{ flex: 1, marginBottom: 20 }}>
              {importResult.contacts.map((contact) => (
                <Pressable
                  key={contact.id}
                  onPress={() => toggleContact(contact.id)}
                  style={{
                    backgroundColor: selectedContacts.has(contact.id) 
                      ? 'rgba(59,130,246,0.2)' 
                      : 'rgba(255,255,255,0.1)',
                    padding: 15,
                    borderRadius: 8,
                    marginBottom: 10,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      color: 'white',
                      fontSize: 16,
                      fontWeight: 'bold',
                      marginBottom: 4
                    }}>
                      {contact.name}
                    </Text>
                    {contact.company && (
                      <Text style={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: 14,
                        marginBottom: 2
                      }}>
                        {contact.company}
                      </Text>
                    )}
                    <Text style={{
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: 12
                    }}>
                      {contact.identifiers.map(id => id.value).join(' • ')}
                    </Text>
                  </View>
                  
                  <View style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: selectedContacts.has(contact.id) ? '#3b82f6' : 'rgba(255,255,255,0.3)',
                    backgroundColor: selectedContacts.has(contact.id) ? '#3b82f6' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {selectedContacts.has(contact.id) && (
                      <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </ScrollView>

            {/* Import Button */}
            <Pressable
              onPress={handleConfirmImport}
              disabled={selectedContacts.size === 0}
              style={{
                backgroundColor: selectedContacts.size > 0 ? '#3b82f6' : 'rgba(255,255,255,0.3)',
                paddingVertical: 15,
                borderRadius: 12,
                alignItems: 'center',
                marginBottom: 20
              }}
            >
              <Text style={{
                color: selectedContacts.size > 0 ? 'white' : 'rgba(255,255,255,0.5)',
                fontSize: 16,
                fontWeight: 'bold'
              }}>
                Import {selectedContacts.size} Contact{selectedContacts.size === 1 ? '' : 's'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}