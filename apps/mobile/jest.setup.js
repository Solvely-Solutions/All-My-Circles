// Mock expo modules first
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Stack: { Screen: 'StackScreen' },
  Tabs: { Screen: 'TabsScreen' },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  Feather: 'Feather',
}));

jest.mock('lucide-react-native', () => ({
  AlertTriangle: 'AlertTriangle',
  RefreshCw: 'RefreshCw',
  Search: 'Search',
  User: 'User',
  Mail: 'Mail',
  Phone: 'Phone',
}));

// Mock Platform before React Native
global.Platform = {
  OS: 'ios',
  select: (config) => config.ios || config.default,
};

// Mock AccessibilityInfo before React Native
global.mockAccessibilityInfo = {
  isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
  isReduceMotionEnabled: jest.fn(() => Promise.resolve(false)),
  announceForAccessibility: jest.fn(),
  setAccessibilityFocus: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Complete React Native mock
jest.mock('react-native', () => {
  return {
    Platform: global.Platform,
    AccessibilityInfo: global.mockAccessibilityInfo,
    StyleSheet: {
      create: (styles) => styles,
      flatten: (style) => style,
      compose: (style1, style2) => ({ ...style1, ...style2 }),
    },
    Dimensions: {
      get: () => ({ width: 375, height: 812 }),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    Alert: {
      alert: jest.fn(),
    },
    View: 'View',
    Text: 'Text',
    TextInput: 'TextInput',
    TouchableOpacity: 'TouchableOpacity',
    Pressable: 'Pressable',
    ScrollView: 'ScrollView',
    ActivityIndicator: 'ActivityIndicator',
    Modal: 'Modal',
    FlatList: 'FlatList',
    SectionList: 'SectionList',
  };
});

// Import testing library extension after all mocks are set up
require('@testing-library/jest-native/extend-expect');

// Global test utilities
global.mockContact = {
  id: 'test-contact-1',
  name: 'John Doe',
  identifiers: [
    { type: 'email', value: 'john.doe@example.com' },
    { type: 'phone', value: '+1234567890' },
  ],
  company: 'Test Company',
  title: 'Software Engineer',
  groups: ['Conference Attendees'],
  tags: ['developer', 'react-native'],
  note: 'Met at React Native conference',
  starred: false,
  lastInteraction: 1640995200000, // Jan 1, 2022
};

global.mockGroup = {
  id: 'test-group-1',
  name: 'Conference Attendees',
  type: 'event',
  location: 'San Francisco, CA',
  members: ['test-contact-1', 'test-contact-2'],
};

global.mockError = new Error('Test error message');

// Suppress console logs in tests unless debugging
if (process.env.NODE_ENV === 'test' && !process.env.DEBUG_TESTS) {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
}