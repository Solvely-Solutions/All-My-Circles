import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { X as XIcon, Check as CheckIcon } from 'lucide-react-native';
import { GlassCard } from '../ui/GlassCard';
import { Contact, ContactSuggestion } from '../../types/contact';

interface SuggestionCardProps {
  s: ContactSuggestion;
  contact: Contact;
  onAccept: () => void;
  onReject: () => void;
}

export const SuggestionCard = memo<SuggestionCardProps>(function SuggestionCard({ s, contact, onAccept, onReject }) {
  return (
    <GlassCard noPadding style={styles.suggestionCard}>
      <View style={styles.suggestionContent}>
        <View style={styles.suggestionInfo}>
          <View style={styles.suggestionHeader}>
            <Text style={styles.suggestionName}>{contact.name}</Text>
            <Text style={styles.suggestionSource}>({s.source})</Text>
          </View>
          <Text style={styles.suggestionText}>
            Propose <Text style={styles.suggestionField}>{s.field}</Text> → <Text style={styles.suggestionProposed}>{s.proposed}</Text>
          </Text>
          <Text style={styles.suggestionConfidence}>Confidence: {(s.confidence * 100).toFixed(0)}%</Text>
        </View>
        <View style={styles.suggestionActions}>
          <Pressable onPress={onReject} style={[styles.actionButton, styles.rejectButton]}>
            <XIcon size={16} color="white" />
          </Pressable>
          <Pressable onPress={onAccept} style={styles.actionButton}>
            <CheckIcon size={16} color="white" />
          </Pressable>
        </View>
      </View>
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  suggestionCard: {
    marginBottom: 8,
    padding: 16,
  },
  suggestionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  suggestionName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  suggestionSource: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  suggestionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginBottom: 4,
  },
  suggestionField: {
    fontWeight: '600',
    color: '#93c5fd',
  },
  suggestionProposed: {
    fontWeight: '600',
    color: '#34d399',
  },
  suggestionConfidence: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  suggestionActions: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 12,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
});