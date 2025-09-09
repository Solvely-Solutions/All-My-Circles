import React from 'react';
import { View, Text, Modal, Pressable } from 'react-native';

interface ContactsImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImportContacts: (contacts: any[]) => void;
}

export function ContactsImportModal({ 
  visible, 
  onClose, 
  onImportContacts 
}: ContactsImportModalProps) {
  console.log('MINIMAL Modal render, visible:', visible);
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'blue',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
      }}>
        <View style={{
          backgroundColor: 'white',
          padding: 40,
          borderRadius: 12,
          width: '90%'
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: 'black',
            textAlign: 'center',
            marginBottom: 20
          }}>
            IMPORT CONTACTS
          </Text>
          
          <Text style={{
            fontSize: 16,
            color: 'black',
            textAlign: 'center',
            marginBottom: 30
          }}>
            This is a minimal test modal
          </Text>
          
          <Pressable
            onPress={() => {
              console.log('Close button pressed');
              onClose();
            }}
            style={{
              backgroundColor: 'red',
              padding: 15,
              borderRadius: 8,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
              CLOSE
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}