import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

const Skeleton = ({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.8, { duration: 1200 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

interface ContactCardSkeletonProps {
  style?: any;
}

export const ContactCardSkeleton = ({ style }: ContactCardSkeletonProps) => {
  return (
    <View style={[styles.contactCard, style]}>
      <View style={styles.contactCardContent}>
        <View style={styles.contactInfo}>
          {/* Name */}
          <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
          
          {/* Title/Company */}
          <Skeleton width="80%" height={14} style={{ marginBottom: 12 }} />
          
          {/* Tags */}
          <View style={styles.tagsRow}>
            <Skeleton width={60} height={24} borderRadius={12} />
            <Skeleton width={80} height={24} borderRadius={12} />
            <Skeleton width={70} height={24} borderRadius={12} />
          </View>
          
          {/* Contact info */}
          <View style={styles.identifierRow}>
            <Skeleton width="45%" height={12} style={{ marginBottom: 4 }} />
            <Skeleton width="35%" height={12} />
          </View>
        </View>
        
        {/* Actions */}
        <View style={styles.contactActions}>
          <Skeleton width={32} height={32} borderRadius={8} />
          <Skeleton width={32} height={32} borderRadius={8} />
          <Skeleton width={32} height={32} borderRadius={8} />
        </View>
      </View>
    </View>
  );
};

interface SearchSkeletonProps {
  count?: number;
}

export const SearchSkeleton = ({ count = 5 }: SearchSkeletonProps) => {
  return (
    <View style={styles.searchContainer}>
      {Array.from({ length: count }, (_, index) => (
        <ContactCardSkeleton key={index} style={{ marginBottom: 12 }} />
      ))}
    </View>
  );
};

interface GroupSkeletonProps {
  style?: any;
}

export const GroupSkeleton = ({ style }: GroupSkeletonProps) => {
  return (
    <View style={[styles.groupCard, style]}>
      <View style={styles.groupHeader}>
        <Skeleton width="50%" height={18} style={{ marginBottom: 6 }} />
        <Skeleton width="30%" height={14} />
      </View>
      <View style={styles.groupContent}>
        <Skeleton width="100%" height={12} style={{ marginBottom: 8 }} />
        <View style={styles.groupStats}>
          <Skeleton width={80} height={20} borderRadius={10} />
          <Skeleton width={60} height={20} borderRadius={10} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contactCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1,
    borderRadius: 16,
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
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  identifierRow: {
    flexDirection: 'column',
    gap: 4,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchContainer: {
    padding: 20,
  },
  groupCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  groupHeader: {
    marginBottom: 12,
  },
  groupContent: {
    gap: 8,
  },
  groupStats: {
    flexDirection: 'row',
    gap: 12,
  },
});