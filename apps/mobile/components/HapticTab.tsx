import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';

import { createTabA11yProps, ensureMinTouchTarget } from '@/utils/accessibility';

interface HapticTabProps extends BottomTabBarButtonProps {
  /** The tab label for accessibility */
  tabLabel?: string;
  /** Whether this tab is currently selected */
  isSelected?: boolean;
  /** Position information for accessibility (e.g., "tab 1 of 3") */
  tabPosition?: string;
}

export function HapticTab({ 
  tabLabel, 
  isSelected = false, 
  tabPosition,
  style,
  ...props 
}: HapticTabProps) {
  // Create accessibility props for the tab
  const a11yProps = tabLabel 
    ? createTabA11yProps(tabLabel, isSelected, tabPosition)
    : {};

  // Ensure minimum touch target size
  const touchTargetStyle = ensureMinTouchTarget(44, 44);

  return (
    <PlatformPressable
      {...props}
      style={[touchTargetStyle, style]}
      {...a11yProps}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
