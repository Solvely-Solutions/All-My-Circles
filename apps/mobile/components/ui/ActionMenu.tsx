import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Platform, Pressable } from 'react-native';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInUp, 
  SlideOutUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// Haptics import
const HapticsModule = Platform.OS !== 'web' ? require('expo-haptics') : null;
import {
  Plus,
  Users,
  Camera,
  LogOut,
  Wifi,
  WifiOff,
  X as XIcon,
  Upload,
} from 'lucide-react-native';
import { GlassCard } from './GlassCard';

// Animated Menu Item Component
interface AnimatedMenuItemProps {
  item: {
    icon: React.ReactNode;
    label: string;
    onPress: () => void;
    style: any;
  };
  index: number;
}

const AnimatedMenuItem = ({ item, index }: AnimatedMenuItemProps) => {
  const scale = useSharedValue(1);
  
  const triggerHaptic = () => {
    if (Platform.OS !== 'web' && HapticsModule) {
      HapticsModule.impactAsync(HapticsModule.ImpactFeedbackStyle.Light);
    }
  };

  const pressGesture = Gesture.Tap()
    .onBegin(() => {
      runOnJS(triggerHaptic)();
      scale.value = withSpring(0.95);
    })
    .onFinalize(() => {
      scale.value = withSpring(1);
      runOnJS(item.onPress)();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <GestureDetector gesture={pressGesture}>
      <Animated.View
        entering={SlideInUp.delay(index * 50).duration(300)}
        exiting={FadeOut}
        style={[animatedStyle]}
      >
        <View style={[styles.menuItem, item.style]}>
          <View style={styles.menuItemIcon}>
            {item.icon}
          </View>
          <Text style={styles.menuItemText}>{item.label}</Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

export interface ActionMenuProps {
  visible: boolean;
  onClose: () => void;
  isOnline: boolean;
  onOfflineToggle: () => void;
  onAddContact: () => void;
  onImportContacts: () => void;
  onBadgeScanner?: () => void;
  onCRMSetup?: () => void;
  onSignOut: () => void;
  showBadgeScanner?: boolean;
}

export function ActionMenu({
  visible,
  onClose,
  isOnline,
  onOfflineToggle,
  onAddContact,
  onImportContacts,
  onBadgeScanner,
  onCRMSetup,
  onSignOut,
  showBadgeScanner = true,
}: ActionMenuProps) {
  console.log('🔧 ActionMenu render - visible:', visible);
  const menuItems = [
    {
      icon: <Plus size={18} color="white" />,
      label: 'Add Contact',
      onPress: () => {
        console.log('🔧 ActionMenu: Add Contact tapped, calling onClose()');
        onClose();
        setTimeout(() => {
          console.log('🔧 ActionMenu: Calling onAddContact() after 50ms delay');
          onAddContact();
        }, 50);
      },
      style: styles.primaryAction,
    },
    {
      icon: <Users size={18} color="white" />,
      label: 'Import Contacts',
      onPress: () => {
        onClose();
        setTimeout(() => onImportContacts(), 50);
      },
      style: styles.importAction,
    },
    ...(showBadgeScanner ? [{
      icon: <Camera size={18} color="white" />,
      label: 'Scan Badge',
      onPress: () => {
        onClose();
        setTimeout(() => {
          if (onBadgeScanner) {
            onBadgeScanner();
          }
        }, 50);
      },
      style: styles.scannerAction,
    }] : []),
    ...(onCRMSetup ? [{
      icon: <Upload size={18} color="white" />,
      label: 'Connect CRM',
      onPress: () => {
        onClose();
        setTimeout(() => onCRMSetup(), 50);
      },
      style: styles.crmAction,
    }] : []),
    {
      icon: isOnline ? <Wifi size={18} color="white" /> : <WifiOff size={18} color="white" />,
      label: isOnline ? 'Go Offline' : 'Go Online',
      onPress: () => {
        onClose();
        setTimeout(() => onOfflineToggle(), 50);
      },
      style: isOnline ? styles.onlineAction : styles.offlineAction,
    },
    {
      icon: <LogOut size={18} color="white" />,
      label: 'Sign Out',
      onPress: () => {
        onClose();
        setTimeout(() => onSignOut(), 50);
      },
      style: styles.signOutAction,
    },
  ];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.backdrop}
        />
      </Pressable>
      
      <Animated.View
        entering={SlideInUp.duration(300)}
        exiting={SlideOutUp.duration(200)}
        style={styles.menuContainer}
      >
        <GlassCard style={styles.menu}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Actions</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <XIcon size={16} color="white" />
            </Pressable>
          </View>
          
          <View style={styles.menuItems}>
            {menuItems.map((item, index) => (
              <AnimatedMenuItem
                key={index}
                item={item}
                index={index}
              />
            ))}
          </View>
        </GlassCard>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 18, 32, 0.7)',
  },
  menuContainer: {
    position: 'absolute',
    top: 120, // Position below header
    right: 20,
    width: 200,
    zIndex: 2000, // Higher than other modals
  },
  menu: {
    padding: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuItems: {
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  menuItemIcon: {
    marginRight: 12,
  },
  menuItemText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  primaryAction: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  importAction: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  scannerAction: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  crmAction: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  onlineAction: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  offlineAction: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  signOutAction: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
});