/**
 * Device contacts import service
 * Handles importing and mapping contacts from device address book
 */

import { Platform } from 'react-native';
import { Contact, ContactIdentifier, ImportedContact, ContactsImportResult } from '../types/contact';
import { devLog, devError } from '../utils/config';

// Conditional native module import
const ContactsModule = Platform.OS !== 'web' ? require('expo-contacts') : null;
const Contacts = ContactsModule;


/**
 * Request permission to access device contacts
 */
export async function requestContactsPermission(): Promise<boolean> {
  if (Platform.OS === 'web' || !Contacts) {
    devLog('Contacts permission not available on web platform');
    return false;
  }
  
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    devLog('Contacts permission status:', { status });
    return status === 'granted';
  } catch (error) {
    devError('Failed to request contacts permission', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/**
 * Get current contacts permission status
 */
export async function getContactsPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  if (Platform.OS === 'web' || !Contacts) {
    return 'denied';
  }
  
  try {
    const { status } = await Contacts.getPermissionsAsync();
    return status;
  } catch (error) {
    devError('Failed to get contacts permission status', error instanceof Error ? error : new Error(String(error)));
    return 'denied';
  }
}

/**
 * Map device contact identifier to our ContactIdentifier format
 */
function mapContactIdentifier(identifier: any): ContactIdentifier | null {
  if (!identifier.label || !identifier.value) return null;

  const value = identifier.value.trim();
  if (!value) return null;

  // Determine identifier type based on value and label
  const label = identifier.label.toLowerCase();
  
  if (value.includes('@')) {
    return { type: 'email', value };
  }
  
  if (value.match(/^\+?[\d\s\-\(\)]+$/)) {
    return { type: 'phone', value };
  }
  
  if (value.includes('linkedin.com')) {
    return { type: 'linkedin', value };
  }
  
  if (value.startsWith('http') || value.includes('.')) {
    return { type: 'url', value };
  }

  // Default to email if looks like email, otherwise URL
  return { type: value.includes('@') ? 'email' : 'url', value };
}

/**
 * Import contacts from device
 */
export async function importDeviceContacts(): Promise<ContactsImportResult> {
  if (Platform.OS === 'web' || !Contacts) {
    return {
      success: false,
      contacts: [],
      totalFound: 0,
      error: 'Device contacts not available on web platform'
    };
  }
  
  try {
    devLog('Starting device contacts import');
    
    const hasPermission = await requestContactsPermission();
    if (!hasPermission) {
      return {
        success: false,
        contacts: [],
        totalFound: 0,
        error: 'Permission to access contacts was denied'
      };
    }

    // Fetch contacts with relevant fields
    const response = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name,
        Contacts.Fields.FirstName,
        Contacts.Fields.LastName,
        Contacts.Fields.Company,
        Contacts.Fields.JobTitle,
        Contacts.Fields.Emails,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Note,
      ],
      sort: Contacts.SortTypes.FirstName,
    });

    if (!response || !response.data) {
      devError('No contacts data returned', new Error('getContactsAsync returned null or no data'));
      return {
        success: false,
        contacts: [],
        totalFound: 0,
        error: 'No contacts found or unable to access contacts'
      };
    }

    const data = response.data;
    devLog('Retrieved device contacts', { count: data.length });

    const importedContacts: ImportedContact[] = data
      .map((contact): ImportedContact | null => {
        // Skip contacts without name
        const name = contact.name || 
          [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim();
        
        if (!name) {
          devLog('Skipping contact without name', { id: contact.id });
          return null;
        }

        // Collect all identifiers
        const identifiers: ContactIdentifier[] = [];
        
        // Add emails
        if (contact.emails) {
          contact.emails.forEach(email => {
            const mapped = mapContactIdentifier({ label: 'email', value: email.email });
            if (mapped) identifiers.push(mapped);
          });
        }
        
        // Add phone numbers
        if (contact.phoneNumbers) {
          contact.phoneNumbers.forEach(phone => {
            const mapped = mapContactIdentifier({ label: 'phone', value: phone.number });
            if (mapped) identifiers.push(mapped);
          });
        }
        
        // URLs are not available in this version of expo-contacts
        // TODO: Add URL support when available

        // Skip contacts with no identifiers
        if (identifiers.length === 0) {
          devLog('Skipping contact without identifiers', { name, id: contact.id });
          return null;
        }

        // Generate tags based on available data
        const tags: string[] = [];
        if (contact.company) tags.push('work');
        if (contact.jobTitle) tags.push('professional');
        
        return {
          id: `imported_${contact.id}_${Date.now()}`,
          name,
          identifiers,
          company: contact.company || '',
          title: contact.jobTitle || '',
          city: '',
          country: '',
          note: contact.note || '',
          tags,
          groups: [], // Groups will be created separately if needed
          starred: false,
          lastInteraction: Date.now(),
        } as ImportedContact;
      })
      .filter((contact): contact is ImportedContact => contact !== null);

    devLog('Successfully imported contacts', { 
      imported: importedContacts.length, 
      total: data.length 
    });

    return {
      success: true,
      contacts: importedContacts,
      totalFound: data.length,
    };

  } catch (error) {
    devError('Failed to import device contacts', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      contacts: [],
      totalFound: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Preview device contacts for import selection
 */
export async function previewDeviceContacts(limit: number = 20): Promise<ContactsImportResult> {
  try {
    const result = await importDeviceContacts();
    
    if (!result.success) {
      return result;
    }

    // Return limited preview
    return {
      ...result,
      contacts: result.contacts.slice(0, limit),
    };
  } catch (error) {
    devError('Failed to preview device contacts', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      contacts: [],
      totalFound: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}