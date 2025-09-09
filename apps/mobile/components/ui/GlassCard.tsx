import React from 'react';
import { View, StyleSheet } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  style?: any;
  noPadding?: boolean;
}

export function GlassCard({ children, style, noPadding }: GlassCardProps) {
  return (
    <View style={[styles.glassCard, noPadding && styles.noPadding, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  noPadding: {
    padding: 0,
  },
});