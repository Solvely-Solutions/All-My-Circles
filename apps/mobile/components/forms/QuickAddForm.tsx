import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Chip } from '../ui/Chip';
import { Contact } from '../../types/contact';
import { useAppState } from '../../contexts/AppStateContext';

interface QuickAddFormProps {
  editingContact?: Contact | null;
  onCancel: () => void;
  onSave: (data: { 
    name: string; 
    identifier: string; 
    company?: string; 
    title?: string; 
    note?: string; 
    tags: string[]; 
    groups: string[] 
  }) => void;
}

export function QuickAddForm({ editingContact, onCancel, onSave }: QuickAddFormProps) {
  const { contacts } = useAppState();
  const [name, setName] = useState(editingContact?.name || "");
  const [identifier, setIdentifier] = useState(editingContact?.identifiers?.[0]?.value || "");
  const [company, setCompany] = useState(editingContact?.company || "");
  const [title, setTitle] = useState(editingContact?.title || "");
  const [note, setNote] = useState(editingContact?.note || "");
  const [tags, setTags] = useState<string[]>(editingContact?.tags || []);
  const [groupInput, setGroupInput] = useState("");
  const [groups, setGroups] = useState<string[]>(editingContact?.groups || []);

  // Get unique tags from all existing contacts
  const availableTags = React.useMemo(() => {
    const allTags = new Set<string>();
    if (contacts && Array.isArray(contacts)) {
      contacts.forEach(contact => {
        if (contact.tags && Array.isArray(contact.tags)) {
          contact.tags.forEach(tag => allTags.add(tag));
        }
      });
    }
    return Array.from(allTags).sort();
  }, [contacts]);

  // Reset form when editingContact changes
  useEffect(() => {
    if (editingContact) {
      setName(editingContact.name);
      setIdentifier(editingContact.identifiers[0]?.value || "");
      setCompany(editingContact.company || "");
      setTitle(editingContact.title || "");
      setNote(editingContact.note || "");
      setTags(editingContact.tags || []);
      setGroups(editingContact.groups || []);
    } else {
      setName("");
      setIdentifier("");
      setCompany("");
      setTitle("");
      setNote("");
      setTags([]);
      setGroups([]);
    }
    setGroupInput("");
  }, [editingContact]);

  function toggleTag(t: string) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function addGroupChip() {
    const g = groupInput.trim();
    if (!g) return;
    if (!groups.includes(g)) setGroups((prev) => [...prev, g]);
    setGroupInput("");
  }

  return (
    <View>
      <View style={styles.formField}>
        <Text style={styles.formLabel}>Name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Jane Smith" placeholderTextColor="rgba(255,255,255,0.6)" style={styles.formInput} />
      </View>

      <View style={styles.formField}>
        <Text style={styles.formLabel}>Email / Phone / URL</Text>
        <TextInput value={identifier} onChangeText={setIdentifier} placeholder="jane@company.com" placeholderTextColor="rgba(255,255,255,0.6)" style={styles.formInput} />
      </View>

      <View style={styles.formField}>
        <Text style={styles.formLabel}>Note</Text>
        <TextInput value={note} onChangeText={setNote} placeholder="Met at booth…" placeholderTextColor="rgba(255,255,255,0.6)" style={[styles.formInput, styles.formTextArea]} multiline numberOfLines={4} />
      </View>

      <View style={styles.formField}>
        <Text style={styles.formLabel}>Tags</Text>
        <View style={styles.tagsContainer}>
          {availableTags.length > 0 ? availableTags.map((t) => (
            <Pressable key={t} onPress={() => toggleTag(t)} style={styles.tagButton}>
              <Chip active={tags.includes(t)}>{t}</Chip>
            </Pressable>
          )) : (
            <Text style={styles.emptyText}>No tags yet - create your first contact to see tags here</Text>
          )}
        </View>
      </View>

      <View style={styles.formField}>
        <Text style={styles.formLabel}>Groups</Text>
        <View style={styles.groupInputRow}>
          <TextInput value={groupInput} onChangeText={setGroupInput} placeholder="e.g., DevCon 2026" placeholderTextColor="rgba(255,255,255,0.6)" style={styles.groupInput} />
          <Pressable onPress={addGroupChip} style={styles.addButton}>
            <Text style={styles.buttonText}>Add</Text>
          </Pressable>
        </View>
        <View style={styles.tagsContainer}>
          {groups.map((g) => (
            <View key={g} style={styles.tagButton}>
              <Chip active>{g}</Chip>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.formActions}>
        <Pressable onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.buttonText}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (!name || !identifier) return;
            onSave({ name, identifier, company, title, note, tags, groups });
          }}
          style={styles.saveButton}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formField: {
    marginBottom: 16,
  },
  formLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    color: 'white',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagButton: {
    marginBottom: 4,
  },
  groupInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  groupInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    color: 'white',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  addButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  saveButton: {
    flex: 1,
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontStyle: 'italic',
  },
});