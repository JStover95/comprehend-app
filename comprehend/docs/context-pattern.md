# Context Pattern

## Overview

This document describes the Context API pattern used for state management throughout the application. The pattern emphasizes clear separation of state and actions, type safety, and testability.

## Table of Contents

- [When to Use Context](#when-to-use-context)
- [Context Structure](#context-structure)
- [Provider Implementation](#provider-implementation)
- [Custom Hooks](#custom-hooks)
- [Provider Hierarchy](#provider-hierarchy)
- [Testing Contexts](#testing-contexts)

## When to Use Context

### Use Context When

- State needs to be shared across multiple components
- Data needs to persist across screen navigation
- Managing global application state (authentication, theme, etc.)
- Coordinating between multiple components
- Avoiding prop drilling through many component layers

### Don't Use Context When

- State is only needed in a single component (use `useState`)
- Simple parent-to-child data passing is sufficient
- Performance is critical and updates are very frequent
- Data doesn't need to persist across navigation

## Context Structure

### Basic Structure

Organize contexts with clear separation of concerns:

```typescript
// contexts/DataContext/Context.tsx
import { createContext } from 'react';

/**
 * State shape for DataContext
 */
export interface DataState {
  /** Loading state for async operations */
  loading: boolean;
  /** Array of data items */
  items: DataItem[];
  /** Error message if operation failed */
  error: string | null;
}

/**
 * Actions available in DataContext
 */
export interface DataActions {
  /** Fetch all items from the API */
  fetchItems: () => Promise<void>;
  /** Add a new item */
  addItem: (item: Omit<DataItem, 'id'>) => Promise<void>;
  /** Update an existing item */
  updateItem: (id: string, updates: Partial<DataItem>) => Promise<void>;
  /** Delete an item by ID */
  deleteItem: (id: string) => Promise<void>;
}

/**
 * Complete context value combining state and actions
 */
export interface DataContextValue {
  state: DataState;
  actions: DataActions;
}

/**
 * DataContext provides access to shared data state and operations
 */
export const DataContext = createContext<DataContextValue | undefined>(undefined);
```

### State and Actions Separation

Separate state from actions for clarity:

```typescript
export interface AuthContextValue {
  state: {
    loading: boolean;
    user: User | null;
    error: string | null;
    isAuthenticated: boolean;
  };
  actions: {
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
    updateProfile: (updates: Partial<User>) => Promise<void>;
  };
}
```

**Benefits:**

- Clear distinction between data and operations
- Easy to mock for testing
- Consistent pattern across all contexts
- Better TypeScript inference

## Provider Implementation

### Basic Provider

```typescript
// contexts/DataContext/Provider.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { DataContext, DataContextValue, DataState } from './Context';
import { ApiClient } from '@/utils/api/ApiClient';

interface DataProviderProps {
  children: React.ReactNode;
  apiClient?: ApiClient; // Optional for dependency injection
}

export function DataProvider({ children, apiClient }: DataProviderProps) {
  // State
  const [state, setState] = useState<DataState>({
    loading: false,
    items: [],
    error: null,
  });

  // Actions
  const fetchItems = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const items = await (apiClient || defaultApiClient).fetchItems();
      setState(prev => ({ ...prev, items, loading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
    }
  }, [apiClient]);

  const addItem = useCallback(async (item: Omit<DataItem, 'id'>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const newItem = await (apiClient || defaultApiClient).createItem(item);
      setState(prev => ({
        ...prev,
        items: [...prev.items, newItem],
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
      throw error;
    }
  }, [apiClient]);

  const updateItem = useCallback(async (id: string, updates: Partial<DataItem>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const updatedItem = await (apiClient || defaultApiClient).updateItem(id, updates);
      setState(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.id === id ? updatedItem : item
        ),
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
      throw error;
    }
  }, [apiClient]);

  const deleteItem = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await (apiClient || defaultApiClient).deleteItem(id);
      setState(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id),
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
      throw error;
    }
  }, [apiClient]);

  // Memoize actions to prevent unnecessary re-renders
  const actions = useMemo(
    () => ({
      fetchItems,
      addItem,
      updateItem,
      deleteItem,
    }),
    [fetchItems, addItem, updateItem, deleteItem]
  );

  // Memoize context value
  const value = useMemo(
    () => ({
      state,
      actions,
    }),
    [state, actions]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
```

### Provider with Initial Data

```typescript
interface DataProviderProps {
  children: React.ReactNode;
  initialData?: DataItem[];
  apiClient?: ApiClient;
}

export function DataProvider({ 
  children, 
  initialData = [],
  apiClient 
}: DataProviderProps) {
  const [state, setState] = useState<DataState>({
    loading: false,
    items: initialData,
    error: null,
  });

  // ... rest of implementation
}
```

### Provider with Auto-Fetch

```typescript
export function DataProvider({ children, apiClient }: DataProviderProps) {
  const [state, setState] = useState<DataState>({
    loading: true,
    items: [],
    error: null,
  });

  // Auto-fetch on mount
  useEffect(() => {
    fetchItems();
  }, []);

  // ... rest of implementation
}
```

## Custom Hooks

### Basic Hook

```typescript
// contexts/DataContext/use-data-context.ts
import { useContext } from 'react';
import { DataContext } from './Context';

/**
 * Hook to access DataContext
 * @throws Error if used outside DataProvider
 */
export function useDataContext() {
  const context = useContext(DataContext);
  
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  
  return context;
}
```

### Convenience Hooks

Create specific hooks for common use cases:

```typescript
// contexts/DataContext/use-data.ts
import { useDataContext } from './use-data-context';

/**
 * Hook to access only the data state
 */
export function useData() {
  const { state } = useDataContext();
  return state;
}

/**
 * Hook to access only the data actions
 */
export function useDataActions() {
  const { actions } = useDataContext();
  return actions;
}

/**
 * Hook to access a single item by ID
 */
export function useDataItem(id: string) {
  const { state } = useDataContext();
  return state.items.find(item => item.id === id);
}

/**
 * Hook to check if data is loading
 */
export function useDataLoading() {
  const { state } = useDataContext();
  return state.loading;
}
```

### Usage in Components

```typescript
// Using the main hook
function DataList() {
  const { state, actions } = useDataContext();

  return (
    <View>
      {state.loading && <Text>Loading...</Text>}
      {state.error && <Text>Error: {state.error}</Text>}
      {state.items.map(item => (
        <DataItem 
          key={item.id} 
          item={item}
          onDelete={() => actions.deleteItem(item.id)}
        />
      ))}
    </View>
  );
}

// Using convenience hooks
function DataCounter() {
  const { items } = useData();
  return <Text>Total Items: {items.length}</Text>;
}

function AddItemButton() {
  const { addItem } = useDataActions();
  
  const handleAdd = async () => {
    await addItem({ title: 'New Item' });
  };

  return <Button onPress={handleAdd} title="Add Item" />;
}
```

## Provider Hierarchy

### Root Provider Setup

```typescript
// app/_layout.tsx
import { AuthProvider } from '@/contexts/AuthContext/Provider';
import { ThemeProvider } from '@/contexts/ThemeContext/Provider';
import { DataProvider } from '@/contexts/DataContext/Provider';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <DataProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        </DataProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
```

### Nested Providers

Some contexts may depend on others:

```typescript
// DataProvider depends on AuthContext
export function DataProvider({ children }: DataProviderProps) {
  const { state: authState } = useAuthContext();
  
  const [state, setState] = useState<DataState>({
    loading: false,
    items: [],
    error: null,
  });

  // Fetch data when user changes
  useEffect(() => {
    if (authState.user) {
      fetchItems();
    } else {
      setState(prev => ({ ...prev, items: [] }));
    }
  }, [authState.user]);

  // ... rest of implementation
}
```

## Testing Contexts

### Creating Mock Providers

@@ Test design should be moved to test docs

```typescript
// contexts/DataContext/__tests__/DataContext.mock.tsx
import { DataContext, DataContextValue } from '../Context';

/**
 * Create a mock context value with default values
 */
export function createMockDataValue(): DataContextValue {
  return {
    state: {
      loading: false,
      items: [],
      error: null,
    },
    actions: {
      fetchItems: jest.fn(),
      addItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
    },
  };
}

/**
 * Mock provider for testing
 */
export function MockDataProvider({
  value,
  children,
}: {
  value: DataContextValue;
  children: React.ReactNode;
}) {
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
```

### Testing Provider Implementation

@@ Test IDs should be imported from their respective .ids.ts files - ensure consistency between examples

```typescript
// contexts/DataContext/__tests__/Provider.test.tsx
import { render, waitFor, act } from '@testing-library/react-native';
import { DataProvider } from '../Provider';
import { useDataContext } from '../use-data-context';
import { createMockApiClient } from '@/utils/api/__tests__/ApiClient.mock';

// Test component to access context
function TestComponent() {
  const { state, actions } = useDataContext();
  
  return (
    <View>
      <Text testID="loading">{state.loading.toString()}</Text>
      <Text testID="error">{state.error || 'null'}</Text>
      <Text testID="items-count">{state.items.length}</Text>
      <Button testID="fetch-button" onPress={actions.fetchItems} title="Fetch" />
    </View>
  );
}

describe('DataProvider', () => {
  it('Should provide initial state', () => {
    const { getByTestId } = render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    expect(getByTestId('loading')).toHaveTextContent('false');
    expect(getByTestId('error')).toHaveTextContent('null');
    expect(getByTestId('items-count')).toHaveTextContent('0');
  });

  it('Should fetch items successfully', async () => {
    const mockApiClient = createMockApiClient();
    mockApiClient.fetchItems.mockResolvedValue([
      { id: '1', title: 'Item 1' },
      { id: '2', title: 'Item 2' },
    ]);

    const { getByTestId } = render(
      <DataProvider apiClient={mockApiClient}>
        <TestComponent />
      </DataProvider>
    );

    await act(async () => {
      fireEvent.press(getByTestId('fetch-button'));
    });

    await waitFor(() => {
      expect(getByTestId('loading')).toHaveTextContent('false');
      expect(getByTestId('items-count')).toHaveTextContent('2');
    });
  });

  it('Should handle fetch errors', async () => {
    const mockApiClient = createMockApiClient();
    mockApiClient.fetchItems.mockRejectedValue(new Error('Network error'));

    const { getByTestId } = render(
      <DataProvider apiClient={mockApiClient}>
        <TestComponent />
      </DataProvider>
    );

    await act(async () => {
      fireEvent.press(getByTestId('fetch-button'));
    });

    await waitFor(() => {
      expect(getByTestId('error')).toHaveTextContent('Network error');
    });
  });
});
```

### Testing Components with Context

```typescript
// components/__tests__/DataList.test.tsx
import { render } from '@testing-library/react-native';
import { DataList } from '../DataList';
import { MockDataProvider, createMockDataValue } from '@/contexts/__tests__/DataContext.mock';

describe('DataList', () => {
  it('Should display loading state', () => {
    const mockValue = createMockDataValue();
    mockValue.state.loading = true;

    const { getByTestId } = render(
      <MockDataProvider value={mockValue}>
        <DataList />
      </MockDataProvider>
    );

    expect(getByTestId('loading')).toBeTruthy();
  });

  it('Should display items', () => {
    const mockValue = createMockDataValue();
    mockValue.state.items = [
      { id: '1', title: 'Item 1' },
      { id: '2', title: 'Item 2' },
    ];

    const { getByTestId } = render(
      <MockDataProvider value={mockValue}>
        <DataList />
      </MockDataProvider>
    );

    expect(getByTestId('item-1')).toBeTruthy();
    expect(getByTestId('item-2')).toBeTruthy();
  });
});
```

## Best Practices

### Do's

- ✅ Use TypeScript for all context definitions
- ✅ Document interfaces with JSDoc comments
- ✅ Separate state and actions in context value
- ✅ Memoize context values to prevent unnecessary re-renders
- ✅ Use `useCallback` for action functions
- ✅ Throw error in custom hooks if context is undefined
- ✅ Create mock providers for testing
- ✅ Support dependency injection for testability

### Don'ts

- ❌ Don't put too much state in a single context
- ❌ Don't update context value on every render
- ❌ Don't forget to memoize actions
- ❌ Don't use context for frequently changing values
- ❌ Don't skip TypeScript types
- ❌ Don't make contexts too generic

## Next Steps

- Read [Component Architecture](./component-architecture.md) for using contexts in components
- Read [Testing Strategy](./testing/) for testing context-dependent components
- Read [API Integration](./api-integration.md) for integrating APIs with contexts
- Read [Types and Configuration](./types-and-configuration.md) for type definitions
