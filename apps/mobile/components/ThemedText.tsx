import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { createTextA11yProps, createHeaderA11yProps, createLinkA11yProps, A11Y_ROLES } from '@/utils/accessibility';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
  /**
   * Accessibility label override. If not provided, uses the text content.
   */
  accessibilityLabel?: string;
  /**
   * For title type, specify the heading level (1-6) for proper accessibility
   */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * For link type, specify where the link leads for better accessibility
   */
  linkDestination?: string;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  accessibilityLabel,
  headingLevel = 1,
  linkDestination,
  children,
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  
  // Extract text content for accessibility
  const textContent = typeof children === 'string' ? children : '';
  
  // Create appropriate accessibility props based on type
  const getA11yProps = () => {
    switch (type) {
      case 'title':
        return createHeaderA11yProps(headingLevel, accessibilityLabel || textContent);
      case 'link':
        return createLinkA11yProps(accessibilityLabel || textContent, linkDestination);
      default:
        return createTextA11yProps(textContent, accessibilityLabel);
    }
  };

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...getA11yProps()}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});
