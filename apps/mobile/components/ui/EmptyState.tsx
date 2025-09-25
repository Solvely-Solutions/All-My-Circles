import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { 
  Users, 
  Star, 
  Calendar, 
  Search,
  Inbox,
  Plus,
  Wifi,
  WifiOff 
} from 'lucide-react-native';

interface EmptyStateProps {
  text: string;
  type?: 'contacts' | 'starred' | 'groups' | 'search' | 'inbox' | 'offline' | 'default';
  actionText?: string;
  onAction?: () => void;
}

const getEmptyStateConfig = (type: EmptyStateProps['type']) => {
  switch (type) {
    case 'contacts':
      return {
        icon: <Users size={48} color="rgba(255,255,255,0.3)" />,
        title: 'No contacts yet',
        subtitle: 'Start growing your professional network by adding your first contact',
        actionIcon: <Plus size={16} color="white" />,
      };
    case 'starred':
      return {
        icon: <Star size={48} color="rgba(255,255,255,0.3)" />,
        title: 'No starred contacts',
        subtitle: 'Star your important contacts to keep them handy',
        actionIcon: null,
      };
    case 'groups':
      return {
        icon: <Calendar size={48} color="rgba(255,255,255,0.3)" />,
        title: 'No circles created',
        subtitle: 'Organize contacts by conferences, clients, prospects, or teams',
        actionIcon: <Plus size={16} color="white" />,
      };
    case 'search':
      return {
        icon: <Search size={48} color="rgba(255,255,255,0.3)" />,
        title: 'No results found',
        subtitle: 'Try adjusting your search or filters',
        actionIcon: null,
      };
    case 'inbox':
      return {
        icon: <Inbox size={48} color="rgba(255,255,255,0.3)" />,
        title: "You're all caught up!",
        subtitle: 'No pending follow-ups or tasks',
        actionIcon: null,
      };
    case 'offline':
      return {
        icon: <WifiOff size={48} color="rgba(255,255,255,0.3)" />,
        title: 'Working offline',
        subtitle: 'Changes will sync when you reconnect',
        actionIcon: null,
      };
    default:
      return {
        icon: <Users size={48} color="rgba(255,255,255,0.3)" />,
        title: 'Nothing here yet',
        subtitle: 'Get started by adding some content',
        actionIcon: null,
      };
  }
};

export function EmptyState({ text, type = 'default', actionText, onAction }: EmptyStateProps) {
  const config = getEmptyStateConfig(type);
  
  return (
    <Animated.View 
      entering={FadeIn.delay(200).duration(600)}
      style={styles.emptyState}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${config.title}. ${config.subtitle}${actionText ? ` ${actionText} button available.` : ''}`}
    >
      <Animated.View
        entering={SlideInUp.delay(300).duration(400)}
        style={styles.iconContainer}
      >
        {config.icon}
      </Animated.View>
      
      <Animated.View
        entering={FadeIn.delay(500).duration(800)}
        style={styles.textContainer}
      >
        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.subtitle}>{config.subtitle}</Text>
      </Animated.View>
      
      {actionText && onAction && config.actionIcon && (
        <Animated.View
          entering={SlideInUp.delay(700).duration(400)}
        >
          <Pressable 
            style={styles.actionButton} 
            onPress={onAction}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={actionText}
            accessibilityHint="Double tap to activate"
          >
            {config.actionIcon}
            <Text style={styles.actionText}>{actionText}</Text>
          </Pressable>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  iconContainer: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 250,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    borderWidth: 1,
    borderRadius: 12,
    gap: 8,
    minWidth: 48,
    minHeight: 48,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});