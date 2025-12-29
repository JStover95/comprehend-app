# Component Architecture

## Overview

This document outlines the patterns and conventions for structuring React Native components in this Expo application. It covers component types, organization, props patterns, composition strategies, and performance optimization patterns including React.memo, useMemo, useCallback, and style memoization.

## Table of Contents

- [Component Types](#component-types)
- [File Organization](#file-organization)
- [Props Patterns](#props-patterns)
- [Component Composition](#component-composition)
- [Test IDs](#test-ids)
- [Performance Optimization](#performance-optimization)

## Component Types

### Screen Components

Screen components are full-page views managed by Expo Router:

**Location:** `app/` directory

**Characteristics:**

- Connected to navigation
- Use contexts for state management
- Coordinate multiple feature components
- Handle screen-level logic

**Example:**

```typescript
// app/(tabs)/home.tsx
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useDataContext } from '@/contexts/DataContext';
import { DataItem } from '@/components/DataItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { HOME_SCREEN_IDS } from '@/components/components.ids';

/**
 * Home screen displays a list of data items
 */
export default function HomeScreen() {
  const router = useRouter();
  const { state, actions } = useDataContext();

  const handleRefresh = async () => {
    await actions.fetchItems();
  };

  const handleItemPress = (id: string) => {
    router.push(`/detail/${id}`);
  };

  if (state.error) {
    return (
      <ErrorMessage 
        message={state.error} 
        onRetry={handleRefresh}
      />
    );
  }

  return (
    <View style={styles.container} testID={HOME_SCREEN_IDS.CONTAINER}>
      <FlatList
        data={state.items}
        renderItem={({ item }) => (
          <DataItem
            item={item}
            onPress={() => handleItemPress(item.id)}
          />
        )}
        ListEmptyComponent={<EmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={state.loading}
            onRefresh={handleRefresh}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

### Feature Components

Feature-specific components encapsulate business logic:

**Location:** `components/[feature]/`

**Characteristics:**

- Feature-specific logic and UI
- Use contexts when needed
- Can contain multiple UI components
- Reusable within the feature

**Example:**

```typescript
// components/data/DataItem.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DataItem as DataItemType } from '@/types/data';

interface DataItemProps {
  /** The data item to display */
  item: DataItemType;
  /** Callback when item is pressed */
  onPress?: () => void;
  /** Callback when delete is pressed */
  onDelete?: (id: string) => void;
  /** Show delete button */
  showDelete?: boolean;
}

/**
 * DataItem displays a single data item with optional actions
 */
export function DataItem({ 
  item, 
  onPress, 
  onDelete,
  showDelete = false 
}: DataItemProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      testID={`data-item-${item.id}`}
    >
      <View style={styles.content}>
        <Text style={styles.title} testID={`item-title-${item.id}`}>
          {item.title}
        </Text>
        <Text style={styles.description}>
          {item.description}
        </Text>
      </View>
      
      {showDelete && (
        <TouchableOpacity
          onPress={() => onDelete?.(item.id)}
          testID={`delete-button-${item.id}`}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={24} color="red" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    justifyContent: 'center',
    paddingLeft: 16,
  },
});
```

### UI Components

Reusable, generic UI components:

**Location:** `components/ui/`

**Characteristics:**

- Generic and reusable
- No business logic
- Fully controlled via props
- Platform-aware when needed

**Example:**

```typescript
// components/ui/Button.tsx
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  /** Button text */
  title: string;
  /** Click handler */
  onPress: () => void;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Test ID */
  testID?: string;
}

/**
 * Reusable button component with multiple variants and sizes
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  testID,
}: ButtonProps) {
  const buttonStyles = [
    styles.button,
    styles[`button_${variant}`],
    styles[`button_${size}`],
    disabled && styles.button_disabled,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
    disabled && styles.text_disabled,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#007AFF'} />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button_primary: {
    backgroundColor: '#007AFF',
  },
  button_secondary: {
    backgroundColor: '#5856D6',
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  button_small: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  button_medium: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  button_large: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  button_disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
  },
  text_primary: {
    color: '#fff',
  },
  text_secondary: {
    color: '#fff',
  },
  text_outline: {
    color: '#007AFF',
  },
  text_ghost: {
    color: '#007AFF',
  },
  text_small: {
    fontSize: 12,
  },
  text_medium: {
    fontSize: 14,
  },
  text_large: {
    fontSize: 16,
  },
  text_disabled: {
    opacity: 0.7,
  },
});
```

## File Organization

### Directory Structure

```plaintext
app/                          # Expo Router screens
├── (tabs)/                   # Tab navigation group
│   ├── _layout.tsx          # Tab layout
│   ├── home.tsx             # Home screen
│   ├── profile.tsx          # Profile screen
│   └── settings.tsx         # Settings screen
├── detail/                   # Detail screens
│   └── [id].tsx             # Dynamic route
├── _layout.tsx              # Root layout
└── index.tsx                # Entry screen

components/                   # All components
├── ui/                      # Generic UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   └── EmptyState.tsx
├── data/                    # Data-related components
│   ├── DataItem.tsx
│   ├── DataList.tsx
│   └── DataForm.tsx
├── user/                    # User-related components
│   ├── UserProfile.tsx
│   ├── UserAvatar.tsx
│   └── UserCard.tsx
├── components.ids.ts        # Test IDs for all components
└── __tests__/               # Component tests
    ├── ui/
    ├── data/
    └── user/
```

### Component File Structure

```typescript
// components/data/DataItem.tsx

// 1. Imports
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DataItem as DataItemType } from '@/types/data';

// 2. Type Definitions
interface DataItemProps {
  item: DataItemType;
  onPress?: () => void;
}

// 3. Component
export function DataItem({ item, onPress }: DataItemProps) {
  // Component logic
  return (
    // JSX
  );
}

// 4. Styles
const styles = StyleSheet.create({
  // Styles
});

// 5. Sub-components (if needed)
DataItem.SubComponent = function DataItemDetails() {
  // Internal component
}
```

## Props Patterns

### TypeScript Interface for Props

Always define props with TypeScript interfaces:

```typescript
interface UserCardProps {
  /** User data to display */
  user: User;
  /** Show full profile details */
  expanded?: boolean;
  /** Callback when user is pressed */
  onPress?: (userId: string) => void;
  /** Show edit button */
  showEdit?: boolean;
  /** Callback when edit is pressed */
  onEdit?: (user: User) => void;
}
```

### Optional Props with Defaults

```typescript
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
}: ButtonProps) {
  // Component implementation
}
```

### Children Prop

Use `PropsWithChildren<T>` from React for components that accept children:

```typescript
import { PropsWithChildren } from 'react';
import { View, Text } from 'react-native';

interface CardProps {
  /** Optional card title */
  title?: string;
  /** Optional card footer */
  footer?: React.ReactNode;
}

export function Card({ children, title, footer }: PropsWithChildren<CardProps>) {
  return (
    <View style={styles.card}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.content}>{children}</View>
      {footer && <View style={styles.footer}>{footer}</View>}
    </View>
  );
}
```

### Render Props Pattern

```typescript
interface DataListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  loading?: boolean;
}

export function DataList<T>({
  data,
  renderItem,
  renderEmpty,
  loading,
}: DataListProps<T>) {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (data.length === 0 && renderEmpty) {
    return <>{renderEmpty()}</>;
  }

  return (
    <FlatList
      data={data}
      renderItem={({ item, index }) => renderItem(item, index)}
    />
  );
}
```

### Reusable Layout Components

Create reusable container and title components to ensure style consistency throughout the app:

```typescript
// components/ui/Container.tsx
import { PropsWithChildren } from 'react';
import { View, ViewStyle } from 'react-native';

interface ContainerProps {
  /** Custom style override */
  style?: ViewStyle;
}

export function Container({ 
  children, 
  style 
}: PropsWithChildren<ContainerProps>) {
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
}
```

```typescript
// components/ui/Title.tsx
import { PropsWithChildren } from 'react';
import { Text, TextStyle } from 'react-native';

interface TitleProps {
  /** Custom style override */
  style?: TextStyle;
  /** Test ID */
  testID?: string;
}

export function Title({ 
  children, 
  style,
  testID,
}: PropsWithChildren<TitleProps>) {
  return (
    <Text 
      style={[styles.base, style]}
      testID={testID}
    >
      {children}
    </Text>
  );
}
```

**Usage Example:**

```typescript
// app/(tabs)/profile.tsx
import { Container } from '@/components/ui/Container';
import { Title } from '@/components/ui/Title';

export default function ProfileScreen() {
  return (
    <Container>
      <Title>My Profile</Title>
      {/* Profile content */}
    </Container>
  );
}
```

This pattern ensures reusability of styles throughout the app without duplicating style definitions across multiple screens or components.

## Component Composition

### Container/Presentational Pattern

Separate logic from presentation:

```typescript
// Container component (logic)
export function UserProfileContainer() {
  const { state, actions } = useAuthContext();
  const [editing, setEditing] = useState(false);

  const handleSave = async (updates: Partial<User>) => {
    await actions.updateProfile(updates);
    setEditing(false);
  };

  if (state.loading) {
    return <LoadingSpinner />;
  }

  if (!state.user) {
    return <NotAuthenticated />;
  }

  return (
    <UserProfilePresentation
      user={state.user}
      editing={editing}
      onEdit={() => setEditing(true)}
      onSave={handleSave}
      onCancel={() => setEditing(false)}
    />
  );
}

// Presentational component (UI)
interface UserProfilePresentationProps {
  user: User;
  editing: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<User>) => void;
  onCancel: () => void;
}

function UserProfilePresentation({
  user,
  editing,
  onEdit,
  onSave,
  onCancel,
}: UserProfilePresentationProps) {
  if (editing) {
    return <UserProfileForm user={user} onSave={onSave} onCancel={onCancel} />;
  }

  return <UserProfileView user={user} onEdit={onEdit} />;
}
```

### Compound Components

```typescript
// Card.tsx
import { createContext, useContext } from 'react';

const CardContext = createContext<{ variant: 'default' | 'elevated' }>({ variant: 'default' });

export function Card({ children, variant = 'default' }: CardProps) {
  return (
    <CardContext.Provider value={{ variant }}>
      <View style={[styles.card, styles[`card_${variant}`]]}>
        {children}
      </View>
    </CardContext.Provider>
  );
}

Card.Header = function CardHeader({ children }: { children: React.ReactNode }) {
  const { variant } = useContext(CardContext);
  return (
    <View style={[styles.header, styles[`header_${variant}`]]}>
      {children}
    </View>
  );
};

Card.Body = function CardBody({ children }: { children: React.ReactNode }) {
  return <View style={styles.body}>{children}</View>;
};

Card.Footer = function CardFooter({ children }: { children: React.ReactNode }) {
  return <View style={styles.footer}>{children}</View>;
};

// Usage
<Card variant="elevated">
  <Card.Header>
    <Text>Card Title</Text>
  </Card.Header>
  <Card.Body>
    <Text>Card content goes here</Text>
  </Card.Body>
  <Card.Footer>
    <Button title="Action" onPress={() => {}} />
  </Card.Footer>
</Card>
```

### Higher-Order Components (HOC)

```typescript
// withLoading.tsx
export function withLoading<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WithLoadingComponent(
    props: P & { loading?: boolean; error?: string | null }
  ) {
    const { loading, error, ...rest } = props;

    if (error) {
      return <ErrorMessage message={error} />;
    }

    if (loading) {
      return <LoadingSpinner />;
    }

    return <Component {...(rest as P)} />;
  };
}

// Usage
const UserProfileWithLoading = withLoading(UserProfile);

export function UserProfileScreen() {
  const { state } = useAuthContext();
  
  return (
    <UserProfileWithLoading
      loading={state.loading}
      error={state.error}
      user={state.user}
    />
  );
}
```

## Test IDs

Test IDs are implementation details that enable testing. They are added directly to components in JSX, similar to accessibility props. While they exist to support testing, defining and using them is part of component implementation.

**For testing patterns and usage in tests**, see [Unit Testing Guide](./testing/unit-testing.md) and [Best Practices](./testing/best-practices.md).

### Defining Test IDs

```typescript
// components/components.ids.ts
export const USER_PROFILE_IDS = {
  CONTAINER: 'user-profile-container',
  AVATAR: 'user-profile-avatar',
  NAME: 'user-profile-name',
  EMAIL: 'user-profile-email',
  BIO: 'user-profile-bio',
  EDIT_BUTTON: 'user-profile-edit-button',
  SAVE_BUTTON: 'user-profile-save-button',
  CANCEL_BUTTON: 'user-profile-cancel-button',
} as const;

Object.freeze(USER_PROFILE_IDS);

export const DATA_ITEM_IDS = {
  container: (id: string) => `data-item-${id}`,
  title: (id: string) => `data-item-title-${id}`,
  description: (id: string) => `data-item-description-${id}`,
  deleteButton: (id: string) => `data-item-delete-${id}`,
} as const;
```

### Using Test IDs in Components

```typescript
import { USER_PROFILE_IDS } from '../components.ids';

export function UserProfile({ user }: UserProfileProps) {
  return (
    <View testID={USER_PROFILE_IDS.CONTAINER}>
      <Image 
        source={{ uri: user.avatar }}
        testID={USER_PROFILE_IDS.AVATAR}
      />
      <Text testID={USER_PROFILE_IDS.NAME}>{user.name}</Text>
      <Text testID={USER_PROFILE_IDS.EMAIL}>{user.email}</Text>
      <Button
        testID={USER_PROFILE_IDS.EDIT_BUTTON}
        title="Edit Profile"
        onPress={onEdit}
      />
    </View>
  );
}
```

## Performance Optimization

### React.memo

Memoize components to prevent unnecessary re-renders:

```typescript
export const DataItem = React.memo(function DataItem({ 
  item, 
  onPress 
}: DataItemProps) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{item.title}</Text>
    </TouchableOpacity>
  );
});
```

**When to use React.memo:**

- Component receives props that don't change frequently
- Component is expensive to render
- Component is used in lists or frequently re-rendering parents
- Component is a reusable UI component (like those in `components/ui/`)

**When NOT to use React.memo:**

- Component props change on every render
- Component is simple and cheap to render
- Memoization overhead exceeds render cost

### React.memo with Custom Comparison

Use custom comparison functions when default shallow equality isn't sufficient:

```typescript
export const UserCard = React.memo(
  function UserCard({ user }: UserCardProps) {
    return <View>{/* ... */}</View>;
  },
  (prevProps, nextProps) => {
    // Only re-render if user ID or name changes
    // Ignore other user properties
    return prevProps.user.id === nextProps.user.id &&
           prevProps.user.name === nextProps.user.name;
  }
);
```

**When to use custom comparison:**

- Component receives complex objects where only specific fields matter
- You want to ignore certain prop changes
- Performance profiling shows unnecessary re-renders

**Best practice:** Default shallow comparison is usually sufficient. Only add custom comparison if profiling shows it's needed.

### useMemo for Computed Values

Memoize expensive computations or values derived from props:

```typescript
function ButtonComponent({ variant, disabled, colors }: ButtonProps) {
  // Memoize computed color values
  const backgroundColor = useMemo(() => {
    if (disabled) return colors.border;
    switch (variant) {
      case "primary":
        return colors.primary;
      case "secondary":
        return colors.secondary;
      case "outline":
      case "ghost":
        return "transparent";
    }
  }, [variant, disabled, colors.border, colors.primary, colors.secondary]);

  const textColor = useMemo(() => {
    if (disabled) return colors.textSecondary;
    switch (variant) {
      case "primary":
      case "secondary":
        return "#FFFFFF";
      default:
        return colors.primary;
    }
  }, [variant, disabled, colors.textSecondary, colors.primary]);

  // ... rest of component
}
```

**When to use useMemo:**

- Computation involves multiple conditionals or calculations
- Value depends on multiple props that may not all change together
- Computation result is used in dependency arrays of other hooks
- Value is passed to memoized child components

**When NOT to use useMemo:**

- Simple value assignment (e.g., `const x = props.value`)
- Computation is trivial (e.g., `const doubled = value * 2`)
- Value changes on every render anyway

### useMemo for Style Objects

Memoize style arrays that combine static styles with dynamic values:

```typescript
function ButtonComponent({ 
  size, 
  backgroundColor, 
  borderColor, 
  borderRadius, 
  disabled, 
  loading, 
  style 
}: ButtonProps) {
  const buttonStyles = useMemo(
    () => [
      styles.button,
      styles[`button_${size}`],
      {
        backgroundColor,
        borderColor,
        borderRadius: borderRadius.md,
        opacity: disabled && !loading ? 0.5 : 1,
      },
      style, // Allow style prop override
    ],
    [
      size,
      backgroundColor,
      borderColor,
      borderRadius.md,
      disabled,
      loading,
      style,
    ],
  );

  const textStyles = useMemo(
    () => [
      styles.text,
      styles[`text_${size}`],
      { color: textColor },
    ],
    [size, textColor],
  );

  return (
    <TouchableOpacity style={buttonStyles}>
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
}
```

**Why this matters:**

- Style arrays are recreated on every render without memoization
- Memoized styles prevent unnecessary style recalculations
- Critical for components in lists or frequently re-rendering contexts

**Best practices:**

- Always memoize style arrays that depend on props or theme
- Include all dependencies in the dependency array
- Combine static `StyleSheet` styles with dynamic inline styles
- Allow `style` prop override as the last element in the array

### useCallback for Event Handlers

Memoize callbacks passed to memoized child components:

```typescript
// Parent component
function ParentComponent() {
  const [count, setCount] = useState(0);
  const router = useRouter();

  // Memoize handler passed to memoized Button component
  const handlePress = useCallback(() => {
    router.push(`/detail/${count}`);
  }, [router, count]);

  // Memoize handler for list items
  const handleItemPress = useCallback((id: string) => {
    router.push(`/detail/${id}`);
  }, [router]);

  return (
    <View>
      <Button onPress={handlePress} title="Navigate" />
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <DataItem 
            item={item} 
            onPress={() => handleItemPress(item.id)} 
          />
        )}
      />
    </View>
  );
}
```

**When to use useCallback:**

- Handler is passed to a component wrapped in `React.memo`
- Handler is used in dependency arrays of other hooks
- Handler is passed to FlatList `renderItem` or other optimized callbacks
- Handler is used in multiple places and you want a stable reference

**When NOT to use useCallback:**

- Handler is only used in current component (not passed to children)
- Handler dependencies change frequently (memoization provides no benefit)
- Handler is simple and component isn't memoized

### useMemo for Filtered/Computed Data

Memoize filtered, sorted, or transformed data:

```typescript
export function DataList({ items }: DataListProps) {
  const [filter, setFilter] = useState('');

  // Memoize filtered data
  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.title.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]);

  // Memoize sorted data
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => 
      a.title.localeCompare(b.title)
    );
  }, [filteredItems]);

  return (
    <FlatList
      data={sortedItems}
      renderItem={({ item }) => <DataItem item={item} />}
    />
  );
}
```

### Dependency Arrays Best Practices

**Include all values used inside the hook:**

```typescript
// ✅ Correct - all dependencies included
const backgroundColor = useMemo(() => {
  if (disabled) return colors.border;
  return colors.primary;
}, [disabled, colors.border, colors.primary]);

// ❌ Incorrect - missing dependencies
const backgroundColor = useMemo(() => {
  if (disabled) return colors.border;
  return colors.primary;
}, [disabled]); // Missing colors.border and colors.primary
```

**For nested object properties:**

```typescript
// ✅ Include specific nested properties
const styles = useMemo(
  () => ({
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  }),
  [typography.fontSize.md, typography.fontWeight.semibold]
);

// ✅ Or include entire object if all properties are used
const styles = useMemo(
  () => ({
    color: colors.text,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  }),
  [colors] // OK if all color properties are used
);
```

**For theme objects:**

```typescript
// When using theme from context
const { colors, spacing, borderRadius } = useTheme();

// Include specific properties that are used
const buttonStyles = useMemo(
  () => ({
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  }),
  [colors.primary, spacing.md, borderRadius.md]
);
```

**ESLint rule:** Always use `eslint-plugin-react-hooks` with `exhaustive-deps` rule to catch missing dependencies.

### FlatList Optimization

Optimize FlatList performance with memoized callbacks and performance props:

```typescript
export function DataList({ items }: DataListProps) {
  const renderItem = useCallback(({ item }: { item: DataItem }) => (
    <DataItem item={item} />
  ), []);

  const keyExtractor = useCallback((item: DataItem) => item.id, []);

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      windowSize={21}
      initialNumToRender={10}
    />
  );
}
```

**Key optimizations:**

- `renderItem` and `keyExtractor` should always be memoized with `useCallback`
- `removeClippedSubviews` removes off-screen views from native view hierarchy
- `maxToRenderPerBatch` controls batch size for rendering
- `windowSize` controls how many screen lengths to render
- `initialNumToRender` controls initial render count

### When NOT to Optimize

**Don't optimize prematurely.** Only add optimizations when:

1. **Performance profiling shows issues** - Use React DevTools Profiler
2. **Component is in a performance-critical path** - Lists, animations, frequent updates
3. **Optimization provides measurable benefit** - Not just theoretical

**Examples of unnecessary optimization:**

```typescript
// ❌ Unnecessary - simple assignment
const title = useMemo(() => props.title, [props.title]);

// ❌ Unnecessary - trivial computation
const doubled = useMemo(() => value * 2, [value]);

// ❌ Unnecessary - handler only used locally
const handlePress = useCallback(() => {
  setCount(count + 1);
}, [count]); // If not passed to memoized child, useCallback is unnecessary
```

**Performance profiling:**

- Use React DevTools Profiler to identify slow renders
- Measure before and after adding optimizations
- Focus on components that render frequently or are expensive

## Best Practices

### Do's

- ✅ Use TypeScript for all components
- ✅ Document props with JSDoc comments
- ✅ Use meaningful component and prop names
- ✅ Keep components focused and single-purpose
- ✅ Extract reusable logic into custom hooks
- ✅ Use StyleSheet.create for styles
- ✅ Add test IDs for testability
- ✅ Memoize expensive computations with `useMemo`
- ✅ Use `React.memo` for reusable UI components and components in lists
- ✅ Use `useCallback` for handlers passed to memoized children
- ✅ Memoize style arrays that depend on props or theme
- ✅ Include all dependencies in `useMemo` and `useCallback` dependency arrays
- ✅ Profile performance before optimizing
- ✅ Use ESLint `exhaustive-deps` rule to catch missing dependencies

### Don'ts

- ❌ Don't create overly complex components
- ❌ Don't mix business logic with UI
- ❌ Don't use inline styles for static styles
- ❌ Don't forget to handle loading and error states
- ❌ Don't skip TypeScript types
- ❌ Don't over-optimize prematurely (profile first)
- ❌ Don't use `useMemo` for simple value assignments
- ❌ Don't use `useCallback` for handlers only used locally
- ❌ Don't forget to include dependencies in dependency arrays
- ❌ Don't memoize values that change on every render anyway

## Next Steps

- Read [Context Pattern](./context-pattern.md) for state management
- Read [Navigation Pattern](./navigation-pattern.md) for screen navigation
- Read [Styling Pattern](./styling-pattern.md) for styling guidelines
- Read [Testing Strategy](./testing/summary.md) for testing components and hooks
