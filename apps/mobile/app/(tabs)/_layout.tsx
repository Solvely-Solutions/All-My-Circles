import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { A11Y_ROLES } from '@/utils/accessibility';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: (props) => (
          <HapticTab 
            {...props}
            tabLabel={props.children?.props?.children?.props?.title}
            isSelected={props.accessibilityState?.selected}
          />
        ),
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
        // Add accessibility props to the tab bar itself
        tabBarAccessibilityRole: A11Y_ROLES.TAB_LIST,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={28} 
              name="house.fill" 
              color={color}
              // Add accessibility props to icons
              accessible={false} // Icon is decorative, tab itself handles accessibility
            />
          ),
          // Add accessibility label for the screen
          tabBarAccessibilityLabel: 'Home tab, navigate to home screen',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={28} 
              name="paperplane.fill" 
              color={color}
              // Add accessibility props to icons  
              accessible={false} // Icon is decorative, tab itself handles accessibility
            />
          ),
          // Add accessibility label for the screen
          tabBarAccessibilityLabel: 'Explore tab, navigate to explore screen',
        }}
      />
      <Tabs.Screen
        name="linkedin-demo"
        options={{
          title: 'LinkedIn',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={28} 
              name="link" 
              color={color}
              // Add accessibility props to icons  
              accessible={false} // Icon is decorative, tab itself handles accessibility
            />
          ),
          // Add accessibility label for the screen
          tabBarAccessibilityLabel: 'LinkedIn demo tab, test LinkedIn enrichment',
        }}
      />
    </Tabs>
  );
}
