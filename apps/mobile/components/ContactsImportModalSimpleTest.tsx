import React, { useState } from 'react';
import { View, Text, Modal, Pressable, Alert, ActivityIndicator, Platform } from 'react-native';
import { ImportedContact } from '../types/contact';

// Conditional native module import
const ContactsModule = Platform.OS !== 'web' ? require('expo-contacts') : null;

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

  const handleSimpleImport = async () => {
    if (Platform.OS === 'web' || !ContactsModule) {
      Alert.alert('Not Available', 'Contact import is not available on web platform');
      return;
    }

    setLoading(true);
    try {
      console.log('Requesting permissions...');
      const { status } = await ContactsModule.requestPermissionsAsync();
      console.log('Permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Cannot access contacts without permission');
        setLoading(false);
        return;
      }

      console.log('Fetching contacts...');
      const response = await ContactsModule.getContactsAsync({
        fields: [ContactsModule.Fields.Name, ContactsModule.Fields.Emails],
      });

      console.log('Contacts response:', response);

      if (!response) {
        throw new Error('No response from getContactsAsync');
      }

      const contacts = response.data || [];
      console.log('Contacts found:', contacts.length);

      // Create simple imported contacts
      const importedContacts: ImportedContact[] = contacts
        .filter((contact: any) => contact.name)
        .slice(0, 5) // Just take first 5 for testing
        .map((contact: any, index: number) => ({
          id: `test_import_${index}_${Date.now()}`,
          name: contact.name,
          identifiers: contact.emails ? contact.emails.map((email: any) => ({
            type: 'email' as const,
            value: email.email
          })) : [],
          company: '',
          title: '',
          city: '',
          country: '',
          note: 'Imported from device',
          tags: ['imported'],
          groups: [],
          starred: false,
          lastInteraction: Date.now(),
        }));

      console.log('Processed contacts:', importedContacts);

      if (importedContacts.length > 0) {
        onImportContacts(importedContacts);
        Alert.alert(
          'Success!', 
          `Imported ${importedContacts.length} contacts`,
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        Alert.alert('No Contacts', 'No contacts with names found');
      }

    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', `Failed to import contacts: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1500,
      elevation: 1500,
    }}>
      {/* Backdrop */}
      <Pressable 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(11, 18, 32, 0.95)',
        }}
        onPress={onClose}
      />
      
      {/* Modal Content */}
      <View style={{
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Pressable 
          style={{
            backgroundColor: '#0b1220',
            padding: 30,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
            width: '100%',
            maxWidth: 400,
            alignItems: 'center'
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={{
            color: 'white',
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 30,
            textAlign: 'center'
          }}>
            Import Device Contacts
          </Text>

          {loading ? (
            <>
              <ActivityIndicator size="large" color="white" />
              <Text style={{
                color: 'white',
                fontSize: 16,
                marginTop: 20,
                textAlign: 'center'
              }}>
                Importing contacts...
              </Text>
            </>
          ) : (
            <>
              <Text style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: 16,
                textAlign: 'center',
                marginBottom: 40,
                lineHeight: 24
              }}>
                This will import your device contacts. We'll ask for permission first.
              </Text>

              <Pressable
                onPress={handleSimpleImport}
                style={{
                  backgroundColor: '#3b82f6',
                  paddingVertical: 15,
                  paddingHorizontal: 30,
                  borderRadius: 12,
                  marginBottom: 20
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: 'bold'
                }}>
                  Import Contacts
                </Text>
              </Pressable>

              <Pressable
                onPress={onClose}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 8
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: 14
                }}>
                  Cancel
                </Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}