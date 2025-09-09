import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Calendar, Star as StarIcon } from 'lucide-react-native';
import { GlassCard } from '../ui/GlassCard';
import { Chip } from '../ui/Chip';
import { Contact } from '../../types/contact';

interface TimelineContactCardProps {
  contact: Contact;
  onView: () => void;
  onStar: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function getRelativeTimeString(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export const TimelineContactCard = memo<TimelineContactCardProps>(function TimelineContactCard({ contact: c, onView, onStar, onEdit, onDelete }) {
  return (
    <Pressable onPress={onView}>
      <GlassCard noPadding style={styles.contactCard}>
        <View style={styles.contactCardContent}>
          <View style={styles.contactInfo}>
            <View style={styles.contactName}>
              <Text style={styles.nameText}>{c.name}</Text>
              {c.starred && <StarIcon size={14} color="white" fill="white" style={{ marginLeft: 6 }} />}
            </View>
            <Text style={styles.contactTitle}>{c.title || "—"}{c.company ? ` · ${c.company}` : ""}</Text>

            <View style={styles.timelineRow}>
              <Calendar size={12} color="rgba(255,255,255,0.6)" />
              <Text style={styles.timelineText}>{getRelativeTimeString(c.lastInteraction)}</Text>
            </View>

            <View style={styles.tagsRow}>
              {c.tags.slice(0, 3).map((t) => (
                <View key={t} style={styles.tagContainer}>
                  <Chip>{t}</Chip>
                </View>
              ))}
              {c.tags.length > 3 && (
                <View style={styles.tagContainer}>
                  <Chip>+{c.tags.length - 3}</Chip>
                </View>
              )}
            </View>
          </View>
          <View style={styles.contactActions}>
            <Pressable onPress={onStar} style={styles.actionButton}>
              <StarIcon size={16} color={c.starred ? "white" : "rgba(255,255,255,0.7)"} fill={c.starred ? "white" : "transparent"} />
            </Pressable>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  contactCard: {
    marginBottom: 8,
    padding: 16,
  },
  contactCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  contactTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginBottom: 6,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginLeft: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tagContainer: {
    marginRight: 4,
    marginBottom: 2,
  },
  contactActions: {
    paddingLeft: 8,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});