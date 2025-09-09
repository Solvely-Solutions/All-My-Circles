import React, { memo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { StarIcon, MapPin, Mail, Phone, Trash2, ArrowRight } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  runOnJS,
  interpolate
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// Haptics import with Platform check
const HapticsModule = Platform.OS !== 'web' ? require('expo-haptics') : null;
import { GlassCard } from '../ui/GlassCard';
import { Chip } from '../ui/Chip';
import { Contact } from '../../types/contact';

interface ContactCardProps {
  contact: Contact;
  onStar: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}

export const ContactCard = memo<ContactCardProps>(function ContactCard({ contact, onStar, onEdit, onDelete, onView }) {
  const primaryEmail = contact.identifiers.find(id => id.type === 'email')?.value;
  const primaryPhone = contact.identifiers.find(id => id.type === 'phone')?.value;

  // Animation values
  const scale = useSharedValue(1);
  const starScale = useSharedValue(1);
  const deleteScale = useSharedValue(1);

  // Haptic feedback function
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (Platform.OS !== 'web' && HapticsModule) {
      const hapticType = type === 'light' ? HapticsModule.ImpactFeedbackStyle.Light :
                        type === 'medium' ? HapticsModule.ImpactFeedbackStyle.Medium :
                        HapticsModule.ImpactFeedbackStyle.Heavy;
      HapticsModule.impactAsync(hapticType);
    }
  };

  // Main card press gesture
  const cardPressGesture = Gesture.Tap()
    .onBegin(() => {
      runOnJS(triggerHaptic)('light');
      scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    })
    .onFinalize((event) => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      if (event.state === 5) { // GESTURE_STATE.END
        runOnJS(onView)();
      }
    });

  // Star button press gesture
  const starPressGesture = Gesture.Tap()
    .onBegin(() => {
      runOnJS(triggerHaptic)('medium');
      starScale.value = withSequence(
        withSpring(0.8, { damping: 15, stiffness: 400 }),
        withSpring(1.1, { damping: 15, stiffness: 400 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );
    })
    .onFinalize(() => {
      runOnJS(onStar)();
    });

  // Delete button press gesture
  const deletePressGesture = Gesture.Tap()
    .onBegin(() => {
      runOnJS(triggerHaptic)('heavy');
      deleteScale.value = withSequence(
        withSpring(0.9, { damping: 15, stiffness: 400 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );
    })
    .onFinalize(() => {
      runOnJS(onDelete)();
    });

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const starAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: starScale.value }],
    };
  });

  const deleteAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: deleteScale.value }],
    };
  });

  return (
    <GestureDetector gesture={cardPressGesture}>
      <Animated.View 
        style={[cardAnimatedStyle]}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Contact: ${contact.name}`}
        accessibilityHint="Tap to view contact details"
      >
        <GlassCard noPadding style={styles.contactCard}>
        <View style={styles.contactCardContent}>
          <View style={styles.contactInfo}>
            <View style={styles.contactName}>
              <Text style={styles.nameText}>{contact.name}</Text>
              {contact.starred && <StarIcon size={14} color="white" fill="white" style={{ marginLeft: 6 }} />}
            </View>
            {(contact.title || contact.company) && (
              <Text style={styles.contactTitle}>
                {contact.title && <Text style={styles.titleText}>{contact.title}</Text>}
                {contact.title && contact.company && <Text style={styles.separator}> at </Text>}
                {contact.company && <Text style={styles.companyText}>{contact.company}</Text>}
              </Text>
            )}
            <View style={styles.tagsRow}>
              {contact.tags.map((tag) => (
                <View key={tag} style={styles.tagContainer}>
                  <Chip>{tag}</Chip>
                </View>
              ))}
              {contact.city && (
                <View style={styles.cityChip}>
                  <MapPin size={12} color="white" />
                  <Text style={styles.cityText}>{contact.city}</Text>
                </View>
              )}
            </View>
            {contact.note && <Text style={styles.noteText}>{contact.note}</Text>}
            <View style={styles.identifierRow}>
              {primaryEmail && (
                <View style={styles.identifier}>
                  <Mail size={12} color="white" />
                  <Text style={styles.identifierText}>{primaryEmail}</Text>
                </View>
              )}
              {primaryPhone && (
                <View style={styles.identifier}>
                  <Phone size={12} color="white" />
                  <Text style={styles.identifierText}>{primaryPhone}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.contactActions}>
            <GestureDetector gesture={starPressGesture}>
              <Animated.View 
                style={[styles.actionButton, starAnimatedStyle]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={contact.starred ? "Remove from starred" : "Add to starred"}
                accessibilityHint={contact.starred ? "Removes this contact from your starred list" : "Adds this contact to your starred list"}
              >
                <StarIcon 
                  size={16} 
                  color={contact.starred ? "#fbbf24" : "white"} 
                  fill={contact.starred ? "#fbbf24" : undefined} 
                />
              </Animated.View>
            </GestureDetector>
            <GestureDetector gesture={deletePressGesture}>
              <Animated.View 
                style={[styles.actionButton, styles.deleteButton, deleteAnimatedStyle]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Delete contact"
                accessibilityHint="Permanently removes this contact from your list"
              >
                <Trash2 size={16} color="#ef4444" />
              </Animated.View>
            </GestureDetector>
            <Animated.View 
              style={styles.actionButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="View contact details"
              accessibilityHint="Opens the detailed view for this contact"
            >
              <ArrowRight size={16} color="white" />
            </Animated.View>
          </View>
        </View>
        </GlassCard>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  contactCard: {
    marginBottom: 12,
    padding: 20,
  },
  contactCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  contactInfo: {
    flex: 1,
    marginRight: 12,
  },
  contactName: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  nameText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  contactTitle: {
    marginBottom: 12,
    lineHeight: 20,
  },
  titleText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    fontWeight: '500',
  },
  separator: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontWeight: '400',
  },
  companyText: {
    color: 'rgba(59, 130, 246, 0.9)',
    fontSize: 15,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tagContainer: {
    marginRight: 4,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  cityText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  noteText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(59, 130, 246, 0.6)',
  },
  identifierRow: {
    flexDirection: 'column',
    gap: 8,
  },
  identifier: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  identifierText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  contactActions: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    minWidth: 44,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: 'rgba(239,68,68,0.4)',
  },
});