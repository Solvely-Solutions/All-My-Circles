import React, { memo } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';

interface CreateGroupButtonProps {
  onPress: () => void;
}

export const CreateGroupButton = memo<CreateGroupButtonProps>(function CreateGroupButton({ onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.createGroupButton}
    >
      <Plus size={16} color="rgba(59, 130, 246, 1)" />
      <Text style={styles.createGroupButtonText}>Create New Group</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  createGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderStyle: 'dashed',
  },
  createGroupButtonText: {
    color: 'rgba(59, 130, 246, 1)',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});