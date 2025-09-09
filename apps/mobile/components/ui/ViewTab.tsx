import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface ViewTabProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onPress: () => void;
}

export const ViewTab = memo<ViewTabProps>(function ViewTab({ icon, label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.viewTab, active ? styles.viewTabActive : styles.viewTabInactive]}> 
      <View style={styles.viewTabContent}>
        {icon}
        <Text 
          style={[styles.viewTabText, active ? styles.viewTabTextActive : styles.viewTabTextInactive]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  viewTab: {
    borderRadius: 12,
    overflow: 'hidden',
    flex: 1,
  },
  viewTabActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  viewTabInactive: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  viewTabContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    gap: 1,
    minHeight: 48,
  },
  viewTabText: {
    fontSize: 9,
    fontWeight: '500',
    flexShrink: 1,
    lineHeight: 10,
    textAlign: 'center',
    numberOfLines: 1,
    maxWidth: '100%',
  },
  viewTabTextActive: {
    color: '#93c5fd',
  },
  viewTabTextInactive: {
    color: 'rgba(255,255,255,0.7)',
  },
});