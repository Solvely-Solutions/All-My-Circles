import React, { memo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { StarIcon, Trash2, Edit3 } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS,
  interpolate,
  interpolateColor
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// Haptics import with Platform check
const HapticsModule = Platform.OS !== 'web' ? require('expo-haptics') : null;
import { ContactCard } from '../cards/ContactCard';
import { Contact } from '../../types/contact';

interface SwipeAction {
  id: string;
  icon: React.ReactNode;
  backgroundColor: string;
  onPress: () => void;
  threshold: number;
}

interface SwipeableContactCardProps {
  contact: Contact;
  onStar: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  onSendToHubSpot: () => void;
}

export const SwipeableContactCard = memo<SwipeableContactCardProps>(function SwipeableContactCard({
  contact,
  onStar,
  onEdit,
  onDelete,
  onView,
  onSendToHubSpot
}) {
  const translateX = useSharedValue(0);
  const actionTriggered = useSharedValue(false);

  // Haptic feedback function
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (Platform.OS !== 'web' && HapticsModule) {
      const hapticType = type === 'light' ? HapticsModule.ImpactFeedbackStyle.Light :
                        type === 'medium' ? HapticsModule.ImpactFeedbackStyle.Medium :
                        HapticsModule.ImpactFeedbackStyle.Heavy;
      HapticsModule.impactAsync(hapticType);
    }
  };

  // Define swipe actions
  const leftActions: SwipeAction[] = [
    {
      id: 'star',
      icon: <StarIcon 
        size={20} 
        color={contact.starred ? "#fbbf24" : "white"} 
        fill={contact.starred ? "#fbbf24" : undefined} 
      />,
      backgroundColor: contact.starred ? '#fbbf24' : '#059669',
      onPress: onStar,
      threshold: 80,
    },
  ];

  const rightActions: SwipeAction[] = [
    {
      id: 'edit',
      icon: <Edit3 size={20} color="white" />,
      backgroundColor: '#3b82f6',
      onPress: onEdit,
      threshold: 80,
    },
    {
      id: 'delete',
      icon: <Trash2 size={20} color="white" />,
      backgroundColor: '#ef4444',
      onPress: onDelete,
      threshold: 120,
    },
  ];

  const panGesture = Gesture.Pan()
    .onStart(() => {
      actionTriggered.value = false;
    })
    .onUpdate((event) => {
      // Allow swiping in both directions but limit the distance
      const maxLeftSwipe = leftActions.length * 80;
      const maxRightSwipe = rightActions.length * 80;
      
      translateX.value = Math.max(
        -maxRightSwipe, 
        Math.min(maxLeftSwipe, event.translationX)
      );

      // Trigger haptic feedback when crossing action thresholds
      if (!actionTriggered.value) {
        if (event.translationX > 60 || event.translationX < -60) {
          runOnJS(triggerHaptic)('medium');
          actionTriggered.value = true;
        }
      }
    })
    .onEnd((event) => {
      const { translationX, velocityX } = event;
      const shouldTriggerAction = Math.abs(translationX) > 80 || Math.abs(velocityX) > 500;

      if (shouldTriggerAction) {
        if (translationX > 0) {
          // Left swipe (star action)
          runOnJS(triggerHaptic)('heavy');
          runOnJS(onStar)();
        } else {
          // Right swipe (edit or delete)
          if (Math.abs(translationX) > 120) {
            // Delete action
            runOnJS(triggerHaptic)('heavy');
            runOnJS(onDelete)();
          } else {
            // Edit action
            runOnJS(triggerHaptic)('medium');
            runOnJS(onEdit)();
          }
        }
      }

      // Animate back to center
      translateX.value = withSpring(0, {
        damping: 15,
        stiffness: 300,
      });
    });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const leftActionsAnimatedStyle = useAnimatedStyle(() => {
    const width = interpolate(
      translateX.value,
      [0, 80],
      [0, 80],
      'clamp'
    );
    
    const opacity = interpolate(
      translateX.value,
      [0, 40, 80],
      [0, 0.5, 1],
      'clamp'
    );

    return {
      width,
      opacity,
    };
  });

  const rightActionsAnimatedStyle = useAnimatedStyle(() => {
    const width = interpolate(
      translateX.value,
      [-160, 0],
      [160, 0],
      'clamp'
    );
    
    const opacity = interpolate(
      translateX.value,
      [-160, -80, -40, 0],
      [1, 1, 0.5, 0],
      'clamp'
    );

    return {
      width,
      opacity,
    };
  });

  const editActionStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      translateX.value,
      [-120, -80, -40, 0],
      [1, 1, 0.8, 0.5],
      'clamp'
    );

    return {
      transform: [{ scale }],
    };
  });

  const deleteActionStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      translateX.value,
      [-160, -120, -80, 0],
      [1, 1, 0.8, 0.5],
      'clamp'
    );

    const backgroundColor = interpolateColor(
      translateX.value,
      [-160, -120, -80],
      ['#dc2626', '#ef4444', '#f87171']
    );

    return {
      transform: [{ scale }],
      backgroundColor,
    };
  });

  return (
    <View style={styles.container}>
      {/* Left Actions */}
      <Animated.View style={[styles.leftActions, leftActionsAnimatedStyle]}>
        {leftActions.map((action) => (
          <Animated.View
            key={action.id}
            style={[
              styles.actionButton,
              { backgroundColor: action.backgroundColor },
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={action.id === 'star' ? (contact.starred ? "Remove from starred" : "Add to starred") : action.id}
            accessibilityHint="Swipe right to access this action"
          >
            {action.icon}
          </Animated.View>
        ))}
      </Animated.View>

      {/* Right Actions */}
      <Animated.View style={[styles.rightActions, rightActionsAnimatedStyle]}>
        <Animated.View
          style={[
            styles.actionButton,
            styles.editAction,
            editActionStyle,
          ]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Edit contact"
          accessibilityHint="Swipe left to access this action"
        >
          <Edit3 size={20} color="white" />
        </Animated.View>
        <Animated.View
          style={[
            styles.actionButton,
            styles.deleteAction,
            deleteActionStyle,
          ]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Delete contact"
          accessibilityHint="Swipe left further to access this action"
        >
          <Trash2 size={20} color="white" />
        </Animated.View>
      </Animated.View>

      {/* Contact Card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View 
          style={[cardAnimatedStyle]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Contact: ${contact.name}. Swipe left or right for quick actions.`}
          accessibilityHint="Swipe right to star, swipe left to edit or delete"
        >
          <ContactCard
            contact={contact}
            onStar={onStar}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            onSendToHubSpot={onSendToHubSpot}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 12,
  },
  leftActions: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  rightActions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  actionButton: {
    width: 80,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    marginHorizontal: 2,
  },
  editAction: {
    backgroundColor: '#3b82f6',
  },
  deleteAction: {
    backgroundColor: '#ef4444',
  },
});