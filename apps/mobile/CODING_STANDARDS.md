# Coding Standards & Guidelines

This document outlines the coding standards and best practices for the Circles project.

## Table of Contents

1. [Code Formatting](#code-formatting)
2. [TypeScript Guidelines](#typescript-guidelines)
3. [React/React Native Guidelines](#reactreact-native-guidelines)
4. [File Organization](#file-organization)
5. [Naming Conventions](#naming-conventions)
6. [Performance Guidelines](#performance-guidelines)
7. [Security Guidelines](#security-guidelines)
8. [Testing Guidelines](#testing-guidelines)

## Code Formatting

We use Prettier for consistent code formatting across the project.

### Key Formatting Rules

- **Line Length**: 100 characters max
- **Indentation**: 2 spaces (no tabs)
- **Semicolons**: Always use semicolons
- **Quotes**: Single quotes for strings, double quotes for JSX attributes
- **Trailing Commas**: ES5 compatible (objects, arrays, function parameters)
- **Bracket Spacing**: Always add spaces inside object brackets

### Usage

```bash
# Format all files
npm run format

# Check formatting without making changes
npm run format:check
```

## TypeScript Guidelines

### Type Safety

- **Strict Mode**: Always enabled
- **Explicit Typing**: Use explicit types for function parameters and return values
- **Type Assertions**: Prefer type guards over type assertions
- **Any Type**: Avoid `any`, use `unknown` instead

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User | null> {
  // Implementation
}

// Avoid
function getUser(id: any): any {
  // Implementation
}
```

### Import Organization

Imports should be organized in the following order:

1. React and React Native imports
2. Third-party library imports
3. Internal imports (components, utils, types)
4. Relative imports
5. Type-only imports (using `import type`)

```typescript
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Button } from 'third-party-library';

import { GlassCard } from '../../components/ui/GlassCard';
import { useAppState } from '../../contexts/AppStateContext';
import { formatDate } from '../../utils/dateHelpers';

import type { Contact } from '../../types/contact';
```

## React/React Native Guidelines

### Component Structure

```typescript
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import type { ComponentProps } from './types';

interface Props extends ComponentProps {
  title: string;
  onPress?: () => void;
}

export const ExampleComponent = memo<Props>(function ExampleComponent({
  title,
  onPress,
  ...props
}) {
  return (
    <View style={styles.container} {...props}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});
```

### Performance Optimization

- **React.memo**: Use for components that render frequently
- **useCallback**: Use for event handlers passed to child components
- **useMemo**: Use for expensive calculations
- **Avoid Inline Objects**: Don't create objects in render methods

```typescript
// Good
const handlePress = useCallback(() => {
  onItemPress(item.id);
}, [onItemPress, item.id]);

const expensiveValue = useMemo(() => {
  return performExpensiveCalculation(data);
}, [data]);

// Avoid
const handlePress = () => onItemPress(item.id);
const style = { marginTop: 10 };
```

### Hooks Guidelines

- **Custom Hooks**: Prefix with `use`
- **Dependencies**: Always include all dependencies in effect hooks
- **Cleanup**: Always cleanup subscriptions and timers

```typescript
function useApiData(id: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.getData(id, {
          signal: controller.signal,
        });
        setData(response.data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [id]);

  return { data, loading, error };
}
```

## File Organization

### Directory Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI components (Button, Input, etc.)
│   ├── cards/           # Card-style components
│   ├── modals/          # Modal components
│   └── forms/           # Form components
├── screens/             # Screen components
├── contexts/            # React contexts
├── hooks/               # Custom hooks
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
├── services/            # API and external services
├── constants/           # App constants
└── assets/              # Images, fonts, etc.
```

### File Naming

- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase starting with `use` (`useUserProfile.ts`)
- **Utilities**: camelCase (`dateHelpers.ts`)
- **Types**: camelCase (`userTypes.ts`)
- **Constants**: camelCase (`apiConstants.ts`)

## Naming Conventions

### Variables and Functions

- **camelCase** for variables and functions
- **Descriptive names** that explain purpose
- **Boolean variables** should start with `is`, `has`, `can`, `should`

```typescript
// Good
const isUserLoggedIn = true;
const hasPermission = false;
const canEditProfile = user.role === 'admin';
const shouldShowModal = isVisible && !isLoading;

function calculateTotalPrice(items: Item[]): number {
  // Implementation
}

// Avoid
const flag = true;
const data = {};
function calc(x: any): any {
  // Implementation
}
```

### Components and Interfaces

- **PascalCase** for components and interfaces
- **Descriptive names** that explain the component's purpose
- **Props interfaces** should end with `Props`

```typescript
// Good
interface UserProfileProps {
  user: User;
  onEdit: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onEdit }) => {
  // Implementation
};

// Avoid
interface Props {
  data: any;
}

export const Component = ({ data }: Props) => {
  // Implementation
};
```

## Performance Guidelines

### React Native Specific

1. **FlatList/SectionList**: Use for large lists instead of ScrollView
2. **Image Optimization**: Use appropriate image sizes and formats
3. **Bundle Size**: Keep bundle size small by lazy loading
4. **Memory Management**: Cleanup timers, subscriptions, and listeners

### State Management

1. **Local State**: Use `useState` for component-specific state
2. **Global State**: Use Context API for app-wide state
3. **Derived State**: Use `useMemo` instead of storing in state
4. **Async State**: Handle loading, error, and success states

## Security Guidelines

### Data Handling

1. **Input Validation**: Always validate user inputs
2. **Sensitive Data**: Never store sensitive data in plain text
3. **API Keys**: Never commit API keys to version control
4. **Deep Links**: Validate deep link parameters

### Code Security

```typescript
// Good: Input validation
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Good: Error handling without exposing sensitive info
function handleApiError(error: Error): string {
  if (__DEV__) {
    console.error('API Error:', error);
  }
  return 'An unexpected error occurred. Please try again.';
}

// Avoid: Exposing internal errors
function handleApiError(error: Error): string {
  return error.message; // Could expose sensitive info
}
```

## Testing Guidelines

### Test Structure

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { UserProfile } from '../UserProfile';
import { mockUser } from '../../__mocks__/userMocks';

describe('UserProfile', () => {
  it('renders user information correctly', () => {
    const { getByText } = render(<UserProfile user={mockUser} />);
    
    expect(getByText(mockUser.name)).toBeTruthy();
    expect(getByText(mockUser.email)).toBeTruthy();
  });

  it('calls onEdit when edit button is pressed', async () => {
    const onEditMock = jest.fn();
    const { getByText } = render(
      <UserProfile user={mockUser} onEdit={onEditMock} />
    );
    
    fireEvent.press(getByText('Edit'));
    
    await waitFor(() => {
      expect(onEditMock).toHaveBeenCalledTimes(1);
    });
  });
});
```

### Test Coverage

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **Snapshot Tests**: Test component rendering consistency
- **E2E Tests**: Test critical user flows

## Code Quality Tools

### Scripts

```bash
# Linting
npm run lint          # Check for linting errors
npm run lint:fix      # Fix auto-fixable linting errors

# Formatting
npm run format        # Format all files
npm run format:check  # Check formatting without changes

# Type checking
npm run type-check    # Run TypeScript compiler checks

# All quality checks
npm run quality:check # Run all quality checks
npm run quality:fix   # Fix all auto-fixable issues
```

### Pre-commit Hooks

The project uses pre-commit hooks to ensure code quality:

1. **ESLint**: Checks for code quality issues
2. **Prettier**: Ensures consistent formatting
3. **TypeScript**: Validates type correctness

## Editor Setup

### VSCode Extensions

Recommended extensions for optimal development experience:

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- React Native Tools
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens

### Settings

Add to your VSCode settings.json:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## Best Practices Summary

1. **Consistency**: Follow established patterns and conventions
2. **Readability**: Write self-documenting code
3. **Performance**: Optimize for mobile performance
4. **Security**: Validate inputs and handle errors gracefully
5. **Testing**: Write tests for critical functionality
6. **Documentation**: Document complex logic and APIs
7. **Accessibility**: Ensure the app is accessible to all users

## Contributing

Before submitting a pull request:

1. Run `npm run quality:check` to ensure code quality
2. Add tests for new features
3. Update documentation as needed
4. Follow the commit message conventions

## Questions?

If you have questions about these standards or need clarification on any guidelines, please reach out to the development team or create an issue in the project repository.