# Component Architecture

## Overview

This document outlines the patterns and conventions for structuring React Native components in this Expo application. It covers component types, organization, props patterns, and composition strategies.

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

@@ Test ids and styles are recommended to be imported, so these examples should reflect that as well

```typescript
// app/(tabs)/home.tsx
import { View, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useDataContext } from '@/contexts/DataContext';
import { DataItem } from '@/components/DataItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

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
    <View style={styles.container} testID="home-screen">
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

@@ Instead import `PropsWithChildren<T>` from react

```typescript
interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Optional card title */
  title?: string;
  /** Optional card footer */
  footer?: React.ReactNode;
}

export function Card({ children, title, footer }: CardProps) {
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

@@ Add reusable title or container components. This pattern ensures reusability of styles throughout the app, without duplicating styles

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

// With custom comparison
export const UserCard = React.memo(
  function UserCard({ user }: UserCardProps) {
    return <View>{/* ... */}</View>;
  },
  (prevProps, nextProps) => {
    return prevProps.user.id === nextProps.user.id &&
           prevProps.user.name === nextProps.user.name;
  }
);
```

### useCallback and useMemo

```typescript
export function DataList({ items }: DataListProps) {
  const [filter, setFilter] = useState('');

  // Memoize filtered data
  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.title.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]);

  // Memoize callback
  const handleItemPress = useCallback((id: string) => {
    router.push(`/detail/${id}`);
  }, [router]);

  return (
    <FlatList
      data={filteredItems}
      renderItem={({ item }) => (
        <DataItem item={item} onPress={() => handleItemPress(item.id)} />
      )}
    />
  );
}
```

### FlatList Optimization

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
    />
  );
}
```

## Best Practices

### Do's

- ✅ Use TypeScript for all components
- ✅ Document props with JSDoc comments
- ✅ Use meaningful component and prop names
- ✅ Keep components focused and single-purpose
- ✅ Extract reusable logic into custom hooks
- ✅ Use StyleSheet.create for styles
- ✅ Add test IDs for testability
- ✅ Memoize expensive computations
- ✅ Use React.memo for expensive components

### Don'ts

- ❌ Don't create overly complex components
- ❌ Don't mix business logic with UI
- ❌ Don't use inline styles for static styles
- ❌ Don't forget to handle loading and error states
- ❌ Don't skip TypeScript types
- ❌ Don't over-optimize prematurely

## Next Steps

- Read [Context Pattern](./context-pattern.md) for state management
- Read [Navigation Pattern](./navigation-pattern.md) for screen navigation
- Read [Styling Pattern](./styling-pattern.md) for styling guidelines
- Read [Testing Strategy](./testing/) for component testing
