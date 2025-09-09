import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { X as XIcon } from 'lucide-react-native';

interface ContactsImportModalTestProps {
  visible: boolean;
  onClose: () => void;
  onImportContacts: (contacts: any[]) => void;
}

export function ContactsImportModalTest({ 
  visible, 
  onClose, 
  onImportContacts 
}: ContactsImportModalTestProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Import Contacts - Test</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <XIcon size={24} color="white" />
          </Pressable>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.message}>
            This is a test modal to verify modal display is working.
          </Text>
          
          <Pressable 
            style={styles.testButton} 
            onPress={() => {
              console.log('Test button pressed');
              onImportContacts([]);
              onClose();
            }}
          >
            <Text style={styles.buttonText}>Test Import</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  testButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});