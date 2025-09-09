import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GlassCard } from './GlassCard';

interface OfflineIndicatorProps {
  isOnline: boolean;
  offlineQueueLength: number;
  showOfflineIndicator: boolean;
}

export const OfflineIndicator = memo<OfflineIndicatorProps>(function OfflineIndicator({ 
  isOnline, 
  offlineQueueLength, 
  showOfflineIndicator 
}) {
  const visible = !isOnline || offlineQueueLength > 0 || showOfflineIndicator;
  
  if (!visible) return null;

  const getMessage = () => {
    if (!isOnline) {
      return `Offline mode • ${offlineQueueLength} pending changes`;
    }
    if (offlineQueueLength > 0) {
      return `Syncing ${offlineQueueLength} changes...`;
    }
    return "Changes saved offline";
  };

  return (
    <Animated.View entering={FadeIn} style={styles.offlineIndicator}>
      <GlassCard>
        <View style={styles.offlineIndicatorContent}>
          <WifiOff size={16} color="#ef4444" />
          <Text style={styles.offlineIndicatorText}>
            {getMessage()}
          </Text>
        </View>
      </GlassCard>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  offlineIndicator: {
    marginTop: 16,
    marginBottom: 8,
  },
  offlineIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  offlineIndicatorText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
});