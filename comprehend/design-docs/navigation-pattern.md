# Navigation Pattern

## Overview

This document describes navigation patterns using Expo Router's file-based routing system. Expo Router provides a declarative, type-safe way to navigate between screens using the file system.

## Table of Contents

- [File-Based Routing](#file-based-routing)
- [Navigation Structure](#navigation-structure)
- [Route Parameters](#route-parameters)
- [Type-Safe Navigation](#type-safe-navigation)
- [Layout Files](#layout-files)
- [Deep Linking](#deep-linking)
- [Navigation Testing](#navigation-testing)
- [Complete Examples](#complete-examples)

## File-Based Routing

### Basic Routing

Expo Router uses the file system to define routes:

```plaintext
app/
├── _layout.tsx           → Root layout
├── index.tsx            → / (home screen)
├── about.tsx            → /about
└── settings.tsx         → /settings
```

### Route Groups

Use parentheses to create route groups that don't affect the URL:

```plaintext
app/
├── _layout.tsx
├── (tabs)/              → Tab navigation (doesn't add /tabs to URL)
│   ├── _layout.tsx     → Tab layout
│   ├── home.tsx        → /home
│   ├── profile.tsx     → /profile
│   └── settings.tsx    → /settings
└── (auth)/              → Auth screens
    ├── login.tsx       → /login
    └── register.tsx    → /register
```

### Dynamic Routes

Use square brackets for dynamic parameters:

```plaintext
app/
├── detail/
│   └── [id].tsx        → /detail/:id
├── user/
│   └── [username]/
│       ├── index.tsx   → /user/:username
│       └── posts.tsx   → /user/:username/posts
└── blog/
    └── [...slug].tsx   → /blog/* (catch-all)
```

## Navigation Structure

### Root Layout

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext/Provider';
import { ThemeProvider } from '@/contexts/ThemeContext/Provider';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="modal" 
            options={{ 
              presentation: 'modal',
              title: 'Modal Screen'
            }} 
          />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
```

### Tab Navigation

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

### Stack Navigation

```typescript
// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: 'Login',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: 'Create Account',
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          title: 'Reset Password',
        }}
      />
    </Stack>
  );
}
```

## Route Parameters

### Using Route Parameters

```typescript
// app/detail/[id].tsx
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useDataContext } from '@/contexts/DataContext';

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useDataContext();
  
  const item = state.items.find(item => item.id === id);

  if (!item) {
    return <Text>Item not found</Text>;
  }

  return (
    <View>
      <Text>{item.title}</Text>
      <Text>{item.description}</Text>
    </View>
  );
}
```

### Navigating with Parameters

```typescript
// Navigate to detail screen with ID
import { useRouter } from 'expo-router';

export function ItemList() {
  const router = useRouter();

  const handleItemPress = (id: string) => {
    router.push(`/detail/${id}`);
  };

  // Or with query parameters
  const handleItemPressWithQuery = (id: string) => {
    router.push({
      pathname: '/detail/[id]',
      params: { id, from: 'list' },
    });
  };

  return (
    // Component JSX
  );
}
```

### Multiple Parameters

```typescript
// app/user/[username]/post/[postId].tsx
import { useLocalSearchParams } from 'expo-router';

export default function PostScreen() {
  const { username, postId } = useLocalSearchParams<{
    username: string;
    postId: string;
  }>();

  return (
    <View>
      <Text>User: {username}</Text>
      <Text>Post: {postId}</Text>
    </View>
  );
}
```

### Catch-All Routes

```typescript
// app/blog/[...slug].tsx
import { useLocalSearchParams } from 'expo-router';

export default function BlogPost() {
  const { slug } = useLocalSearchParams<{ slug: string[] }>();
  
  // /blog/2024/01/my-post → slug = ['2024', '01', 'my-post']
  const [year, month, postSlug] = slug || [];

  return (
    <View>
      <Text>Year: {year}</Text>
      <Text>Month: {month}</Text>
      <Text>Post: {postSlug}</Text>
    </View>
  );
}
```

## Type-Safe Navigation

### Route Parameter Types

```typescript
// types/navigation.ts

/**
 * Define route parameter types for type safety
 */
export type RootStackParamList = {
  '(tabs)': undefined;
  '(auth)': undefined;
  'detail/[id]': { id: string };
  'user/[username]': { username: string };
  'user/[username]/posts': { username: string };
  modal: { title?: string };
};

export type TabsParamList = {
  home: undefined;
  explore: { query?: string };
  profile: undefined;
};
```

### useLocalSearchParams with Types

```typescript
// Use typed params in screens
export default function DetailScreen() {
  const params = useLocalSearchParams<{ id: string; from?: string }>();
  
  // params.id is typed as string
  // params.from is typed as string | undefined
  
  return (
    <View>
      <Text>ID: {params.id}</Text>
      {params.from && <Text>From: {params.from}</Text>}
    </View>
  );
}
```

## Layout Files

### Shared Layouts

```typescript
// app/_layout.tsx - Root shared layout
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Slot />
    </SafeAreaProvider>
  );
}
```

### Nested Layouts

```typescript
// app/(tabs)/_layout.tsx - Tab-specific layout
import { Tabs } from 'expo-router';
import { DataProvider } from '@/contexts/DataContext/Provider';

export default function TabLayout() {
  return (
    <DataProvider>
      <Tabs>
        <Tabs.Screen name="home" />
        <Tabs.Screen name="explore" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </DataProvider>
  );
}
```

### Dynamic Layout Options

```typescript
// app/detail/_layout.tsx
import { Stack, useLocalSearchParams } from 'expo-router';

export default function DetailLayout() {
  const { id } = useLocalSearchParams();

  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          title: `Detail ${id}`,
          headerRight: () => <ShareButton />,
        }}
      />
    </Stack>
  );
}
```

## Deep Linking

### Configuration

```typescript
// app.json
{
  "expo": {
    "scheme": "myapp",
    "web": {
      "bundler": "metro"
    },
    "plugins": [
      [
        "expo-router",
        {
          "origin": "https://myapp.com"
        }
      ]
    ]
  }
}
```

### Universal Links

```typescript
// Deep link: myapp://detail/123
// Universal link: https://myapp.com/detail/123

// Both navigate to: app/detail/[id].tsx with id=123

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // id will be '123' from either deep link or universal link
}
```

### Custom Deep Link Handling

```typescript
// app/_layout.tsx
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      // Parse custom URL scheme
      const { hostname, path, queryParams } = Linking.parse(url);
      
      // Handle custom logic
      if (hostname === 'detail') {
        router.push(`/detail/${path}`);
      }
    });

    return () => subscription.remove();
  }, []);

  return <Slot />;
}
```

## Navigation Testing

For comprehensive guidance on testing navigation flows, including testing navigation between screens, tab navigation, and navigation with parameters, see:

- **[Integration Testing Guide](./testing/integration-testing.md)** - Complete navigation testing patterns and examples

## Complete Examples

### Protected Routes

```typescript
// app/(tabs)/_layout.tsx
import { Redirect, Tabs } from 'expo-router';
import { useAuthContext } from '@/contexts/AuthContext';

export default function TabLayout() {
  const { state } = useAuthContext();

  // Redirect to login if not authenticated
  if (!state.isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
```

### Modal Navigation

```typescript
// app/modal.tsx
import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function ModalScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modal Screen</Text>
      <Button title="Close" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
```

### Programmatic Navigation

```typescript
// components/NavigationButtons.tsx
import { Button, View } from 'react-native';
import { useRouter } from 'expo-router';

export function NavigationButtons() {
  const router = useRouter();

  return (
    <View>
      {/* Navigate forward */}
      <Button
        title="Go to Detail"
        onPress={() => router.push('/detail/123')}
      />

      {/* Navigate with replace (no back) */}
      <Button
        title="Replace with Profile"
        onPress={() => router.replace('/profile')}
      />

      {/* Navigate back */}
      <Button
        title="Go Back"
        onPress={() => router.back()}
        disabled={!router.canGoBack()}
      />

      {/* Navigate with params */}
      <Button
        title="Go with Params"
        onPress={() => router.push({
          pathname: '/detail/[id]',
          params: { id: '456', from: 'buttons' },
        })}
      />
    </View>
  );
}
```

### Conditional Navigation

```typescript
// app/index.tsx
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthContext } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function IndexScreen() {
  const router = useRouter();
  const { state } = useAuthContext();

  useEffect(() => {
    // Wait for auth to initialize
    if (state.loading) return;

    // Navigate based on auth state
    if (state.isAuthenticated) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/login');
    }
  }, [state.loading, state.isAuthenticated]);

  return <LoadingSpinner />;
}
```

## Best Practices

### Do's

- ✅ Use file-based routing for screen organization
- ✅ Define route parameter types for type safety
- ✅ Use route groups for logical organization
- ✅ Implement protected routes with redirects
- ✅ Test navigation flows in integration tests
- ✅ Use `replace` for authentication flows
- ✅ Configure deep linking for better UX

### Don'ts

- ❌ Don't use navigation outside of screens/components
- ❌ Don't navigate in render methods
- ❌ Don't ignore route parameter types
- ❌ Don't create deeply nested navigation structures
- ❌ Don't forget to handle back navigation
- ❌ Don't hardcode URLs, use constants

## Navigation Patterns

### Pattern: Auth Flow

```typescript
// 1. Check auth state in root
// 2. Redirect to appropriate screen
// 3. Update navigation on auth state change

// app/_layout.tsx
export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}

// app/index.tsx
export default function IndexScreen() {
  const { state } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!state.loading) {
      router.replace(state.isAuthenticated ? '/(tabs)/home' : '/login');
    }
  }, [state.loading, state.isAuthenticated]);

  return <LoadingSpinner />;
}
```

### Pattern: Tab with Stack

```typescript
// Each tab has its own stack of screens

// app/(tabs)/home/_layout.tsx
export default function HomeStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="detail/[id]" options={{ title: 'Detail' }} />
    </Stack>
  );
}

// Navigation within tab maintains stack history
```

## Next Steps

- Read [Component Architecture](./component-architecture.md) for screen components
- Read [Context Pattern](./context-pattern.md) for auth-based navigation
- Read [Integration Testing](./testing/integration-testing.md) for testing navigation flows
- Explore [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
