import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Users, Trash2 } from 'lucide-react-native';
import { GlassCard } from '../ui/GlassCard';
import { ContactGroup } from '../../types/contact';

interface GroupCardProps {
  group: ContactGroup;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const GroupCard = memo<GroupCardProps>(function GroupCard({ group, onOpen, onEdit, onDelete }) {
  return (
    <GlassCard noPadding style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <Pressable onPress={onOpen} style={{ flex: 1 }}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupType}>{group.type} • {group.location || "No location"}</Text>
        </Pressable>
        <View style={styles.groupActions}>
          <Pressable onPress={onEdit} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Edit</Text>
          </Pressable>
          <Pressable onPress={onDelete} style={[styles.actionButton, styles.deleteActionButton]}>
            <Trash2 size={14} color="rgba(220, 38, 38, 0.8)" />
          </Pressable>
        </View>
      </View>
      <View style={styles.groupMembersRow}>
        <Users size={16} color="rgba(255,255,255,0.7)" />
        <Text style={styles.groupMembersText}>
          {group.members.length} member{group.members.length !== 1 ? "s" : ""}
        </Text>
      </View>
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  groupCard: {
    marginBottom: 12,
    padding: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  groupName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  groupType: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  groupActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  deleteActionButton: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
    paddingHorizontal: 8,
  },
  groupMembersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupMembersText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginLeft: 6,
  },
});