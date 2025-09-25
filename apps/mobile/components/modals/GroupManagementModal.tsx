import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput, StyleSheet } from 'react-native';
import Animated, { SlideInUp } from 'react-native-reanimated';
import {
  X as XIcon,
  Calendar,
  MapPin,
  Tag as TagIcon,
  Trash2,
  Check as CheckIcon,
} from 'lucide-react-native';

interface Group {
  id: string;
  name: string;
  type: string;
  location?: string;
  members: string[];
}

interface GroupManagementModalProps {
  group: Group | null;
  visible: boolean;
  onClose: () => void;
  onSave: (data: { name: string; type: string; location?: string }) => void;
  onDelete?: () => void;
}

export function GroupManagementModal({ 
  group, 
  visible, 
  onClose, 
  onSave,
  onDelete 
}: GroupManagementModalProps) {
  const [name, setName] = useState(group?.name || "");
  const [type, setType] = useState(group?.type || "custom");
  const [location, setLocation] = useState(group?.location || "");

  useEffect(() => {
    if (group) {
      setName(group.name);
      setType(group.type);
      setLocation(group.location || "");
    } else {
      setName("");
      setType("custom");
      setLocation("");
    }
  }, [group]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), type, location: location.trim() });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <Animated.View 
          entering={SlideInUp.duration(300)}
          style={styles.detailModal}
        >
          {/* Header */}
          <View style={styles.detailHeader}>
            <Text style={styles.detailName}>{group ? 'Edit Group' : 'Create Group'}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <XIcon size={24} color="white" />
            </Pressable>
          </View>

          <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
            {/* Group Name */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Group Name</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., DevCon 2025, Lisbon Trip"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Group Type */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Group Type</Text>
              <View style={styles.typeButtonsContainer}>
                {[
                  { value: "event", label: "Event", icon: Calendar },
                  { value: "location", label: "Location", icon: MapPin },
                  { value: "custom", label: "Custom", icon: TagIcon }
                ].map((typeOption) => (
                  <Pressable 
                    key={typeOption.value}
                    onPress={() => setType(typeOption.value)}
                    style={[
                      styles.typeButton,
                      type === typeOption.value ? styles.typeButtonActive : styles.typeButtonInactive
                    ]}
                  >
                    <typeOption.icon size={16} color={type === typeOption.value ? "#1f2937" : "white"} />
                    <Text style={[
                      styles.typeButtonText,
                      type === typeOption.value ? styles.typeButtonTextActive : styles.typeButtonTextInactive
                    ]}>
                      {typeOption.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Location (optional) */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Location (Optional)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Barcelona, Spain"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={location}
                  onChangeText={setLocation}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Members (if editing) */}
            {group && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Members</Text>
                <Text style={styles.memberCountText}>
                  {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.detailFooter}>
            <View style={styles.footerButtonRow}>
              {group && onDelete && (
                <Pressable 
                  onPress={onDelete}
                  style={[styles.footerButton, styles.deleteButton]}
                >
                  <Trash2 size={16} color="rgba(220, 38, 38, 1)" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </Pressable>
              )}
              <View style={styles.footerButtonSpacer} />
              <Pressable 
                onPress={onClose}
                style={[styles.footerButton, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable 
                onPress={handleSave}
                style={[
                  styles.footerButton, 
                  styles.saveButton,
                  !name.trim() && styles.saveButtonDisabled
                ]}
                disabled={!name.trim()}
              >
                <CheckIcon size={16} color={name.trim() ? "#1f2937" : "rgba(255,255,255,0.5)"} />
                <Text style={[
                  styles.saveButtonText,
                  !name.trim() && styles.saveButtonTextDisabled
                ]}>
                  {group ? 'Update' : 'Create'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  detailModal: {
    backgroundColor: 'rgba(31, 41, 55, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: '90%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    padding: 8,
  },
  detailName: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  detailContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  detailSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    color: 'white',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  typeButtonInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#1f2937',
  },
  typeButtonTextInactive: {
    color: 'white',
  },
  memberCountText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  detailFooter: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  footerButtonSpacer: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  deleteButtonText: {
    color: 'rgba(220, 38, 38, 1)',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveButtonText: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
});