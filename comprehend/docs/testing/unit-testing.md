# Unit Testing

## Overview

This document covers patterns and practices for unit testing individual components, hooks, and utilities in React Native. Unit tests focus on testing components in isolation with mocked dependencies.

## Table of Contents

- [Component Testing](#component-testing)
- [Hook Testing](#hook-testing)
- [Utility Testing](#utility-testing)
- [Mock Provider Pattern](#mock-provider-pattern)
- [Testing Components with Service Dependencies](#testing-components-with-service-dependencies)
- [Test ID Pattern](#test-id-pattern)
- [Async Testing](#async-testing)
- [User Interaction Testing](#user-interaction-testing)
- [Examples](#examples)

## Component Testing

### Basic Component Test

Test a simple component without dependencies:

```typescript
// components/Greeting.tsx
import { Text, View } from 'react-native';

interface GreetingProps {
  name: string;
}

export function Greeting({ name }: GreetingProps) {
  return (
    <View testID="greeting-container">
      <Text testID="greeting-text">Hello, {name}!</Text>
    </View>
  );
}

// components/__tests__/Greeting.test.tsx
import { render } from '@testing-library/react-native';
import { Greeting } from '../Greeting';

describe('Greeting', () => {
  it('Should render greeting with name', () => {
    const { getByTestId } = render(<Greeting name="John" />);
    
    expect(getByTestId('greeting-container')).toBeTruthy();
    expect(getByTestId('greeting-text')).toHaveTextContent('Hello, John!');
  });

  it('Should render with different names', () => {
    const { getByTestId, rerender } = render(<Greeting name="Alice" />);
    expect(getByTestId('greeting-text')).toHaveTextContent('Hello, Alice!');

    rerender(<Greeting name="Bob" />);
    expect(getByTestId('greeting-text')).toHaveTextContent('Hello, Bob!');
  });
});
```

### Component with Context

Test a component that uses context:

```typescript
// components/UserProfile.tsx
import { Text, View } from 'react-native';
import { useAuthContext } from '@/contexts/AuthContext';

export function UserProfile() {
  const { state } = useAuthContext();

  if (state.loading) {
    return <Text testID="loading">Loading...</Text>;
  }

  if (state.error) {
    return <Text testID="error">{state.error}</Text>;
  }

  return (
    <View testID="profile-container">
      <Text testID="username">{state.user?.name}</Text>
      <Text testID="email">{state.user?.email}</Text>
    </View>
  );
}

// components/__tests__/UserProfile.test.tsx
import { render } from '@testing-library/react-native';
import { UserProfile } from '../UserProfile';
import { MockAuthProvider, createMockAuthValue } from '@/contexts/__tests__/AuthContext.mock';

describe('UserProfile', () => {
  it('Should show loading state', () => {
    const mockValue = createMockAuthValue();
    mockValue.state.loading = true;

    const { getByTestId } = render(
      <MockAuthProvider value={mockValue}>
        <UserProfile />
      </MockAuthProvider>
    );

    expect(getByTestId('loading')).toBeTruthy();
  });

  it('Should show error state', () => {
    const mockValue = createMockAuthValue();
    mockValue.state.error = 'Failed to load user';

    const { getByTestId } = render(
      <MockAuthProvider value={mockValue}>
        <UserProfile />
      </MockAuthProvider>
    );

    expect(getByTestId('error')).toHaveTextContent('Failed to load user');
  });

  it('Should display user data', () => {
    const mockValue = createMockAuthValue();
    mockValue.state.user = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
    };

    const { getByTestId } = render(
      <MockAuthProvider value={mockValue}>
        <UserProfile />
      </MockAuthProvider>
    );

    expect(getByTestId('username')).toHaveTextContent('John Doe');
    expect(getByTestId('email')).toHaveTextContent('john@example.com');
  });
});
```

### Component with Multiple Contexts

```typescript
// components/DataDisplay.tsx
import { useAuthContext } from '@/contexts/AuthContext';
import { useDataContext } from '@/contexts/DataContext';

export function DataDisplay() {
  const { state: authState } = useAuthContext();
  const { state: dataState } = useDataContext();

  if (!authState.user) {
    return <Text testID="not-authenticated">Please log in</Text>;
  }

  if (dataState.loading) {
    return <Text testID="loading">Loading data...</Text>;
  }

  return (
    <View testID="data-container">
      {dataState.items.map(item => (
        <Text key={item.id} testID={`item-${item.id}`}>
          {item.name}
        </Text>
      ))}
    </View>
  );
}

// components/__tests__/DataDisplay.test.tsx
describe('DataDisplay', () => {
  it('Should show login prompt when not authenticated', () => {
    const mockAuthValue = createMockAuthValue();
    mockAuthValue.state.user = null;
    
    const mockDataValue = createMockDataValue();

    const { getByTestId } = render(
      <MockAuthProvider value={mockAuthValue}>
        <MockDataProvider value={mockDataValue}>
          <DataDisplay />
        </MockDataProvider>
      </MockAuthProvider>
    );

    expect(getByTestId('not-authenticated')).toBeTruthy();
  });

  it('Should display data when authenticated', () => {
    const mockAuthValue = createMockAuthValue();
    mockAuthValue.state.user = { id: '1', name: 'John' };
    
    const mockDataValue = createMockDataValue();
    mockDataValue.state.items = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
    ];

    const { getByTestId } = render(
      <MockAuthProvider value={mockAuthValue}>
        <MockDataProvider value={mockDataValue}>
          <DataDisplay />
        </MockDataProvider>
      </MockAuthProvider>
    );

    expect(getByTestId('item-1')).toHaveTextContent('Item 1');
    expect(getByTestId('item-2')).toHaveTextContent('Item 2');
  });
});
```

## Hook Testing

### Testing Custom Hooks

Use `renderHook` from React Native Testing Library:

```typescript
// hooks/use-counter.ts
import { useState, useCallback } from 'react';

export function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  const decrement = useCallback(() => {
    setCount(c => c - 1);
  }, []);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  return { count, increment, decrement, reset };
}

// hooks/__tests__/use-counter.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useCounter } from '../use-counter';

describe('useCounter', () => {
  it('Should initialize with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('Should initialize with custom value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('Should increment count', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });

  it('Should decrement count', () => {
    const { result } = renderHook(() => useCounter(5));
    
    act(() => {
      result.current.decrement();
    });
    
    expect(result.current.count).toBe(4);
  });

  it('Should reset to initial value', () => {
    const { result } = renderHook(() => useCounter(10));
    
    act(() => {
      result.current.increment();
      result.current.increment();
    });
    
    expect(result.current.count).toBe(12);
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.count).toBe(10);
  });
});
```

### Testing Hook with Context

```typescript
// hooks/use-auth.ts
import { useAuthContext } from '@/contexts/AuthContext';

export function useAuth() {
  const { state, actions } = useAuthContext();

  const login = async (email: string, password: string) => {
    await actions.login(email, password);
  };

  const logout = async () => {
    await actions.logout();
  };

  return {
    user: state.user,
    isAuthenticated: !!state.user,
    loading: state.loading,
    error: state.error,
    login,
    logout,
  };
}

// hooks/__tests__/use-auth.test.tsx
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAuth } from '../use-auth';
import { MockAuthProvider, createMockAuthValue } from '@/contexts/__tests__/AuthContext.mock';

describe('useAuth', () => {
  it('Should return user when authenticated', () => {
    const mockValue = createMockAuthValue();
    mockValue.state.user = { id: '1', name: 'John' };

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <MockAuthProvider value={mockValue}>{children}</MockAuthProvider>
      ),
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({ id: '1', name: 'John' });
  });

  it('Should call login action', async () => {
    const mockValue = createMockAuthValue();
    const mockLogin = jest.fn().mockResolvedValue(undefined);
    mockValue.actions.login = mockLogin;

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <MockAuthProvider value={mockValue}>{children}</MockAuthProvider>
      ),
    });

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password');
  });
});
```

## Utility Testing

### Testing Pure Functions

```typescript
// utils/formatters.ts
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US');
}

// utils/__tests__/formatters.test.ts
import { formatCurrency, formatDate } from '../formatters';

describe('formatCurrency', () => {
  it('Should format positive numbers', () => {
    expect(formatCurrency(10)).toBe('$10.00');
    expect(formatCurrency(10.5)).toBe('$10.50');
    expect(formatCurrency(10.555)).toBe('$10.56');
  });

  it('Should format zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('Should format negative numbers', () => {
    expect(formatCurrency(-10)).toBe('$-10.00');
  });
});

describe('formatDate', () => {
  it('Should format date correctly', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('1/15/2024');
  });
});
```

### Testing Validators

```typescript
// utils/validators.ts
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isStrongPassword(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

// utils/__tests__/validators.test.ts
import { isValidEmail, isStrongPassword } from '../validators';

describe('isValidEmail', () => {
  it('Should return true for valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
  });

  it('Should return false for invalid emails', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('test@')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('isStrongPassword', () => {
  it('Should return true for strong passwords', () => {
    expect(isStrongPassword('Password1')).toBe(true);
    expect(isStrongPassword('StrongPass123')).toBe(true);
  });

  it('Should return false for weak passwords', () => {
    expect(isStrongPassword('short1')).toBe(false);
    expect(isStrongPassword('nouppercase1')).toBe(false);
    expect(isStrongPassword('NoNumbers')).toBe(false);
  });
});
```

## Mock Provider Pattern

The **Mock Provider pattern** is specifically for testing **React Context**. This pattern wraps components with mock context values to test context-dependent behavior.

**Important:** Do not confuse this with factory patterns for services:

| Pattern | Use For | Example |
|---------|---------|---------|
| **Mock Provider** | React Context (auth, theme, data) | `<MockAuthProvider>` |
| **Mock Factory** | I/O Services (API, storage) | `new MockApiClient()` |
| **jest.fn()** | Simple callbacks | `const onPress = jest.fn()` |

**For choosing the right approach, see [Decision Guide](./decision-guide.md).**

**For testing services with I/O, see [Factory Pattern](./factory-pattern.md).**

### Creating Mock Providers for Context

```typescript
// contexts/__tests__/DataContext.mock.tsx
import { DataContext, DataContextValue } from '../DataContext';

/**
 * Create mock value for DataContext
 * Use this for testing components that consume DataContext
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
 * Mock provider for DataContext
 * Use this to wrap components in tests
 */
export function MockDataProvider({ value, children }: { value: DataContextValue; children: React.ReactNode }) {
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
```

### Using Mock Providers

```typescript
describe('MyComponent', () => {
  it('Should handle context state changes', () => {
    const mockValue = createMockDataValue();
    mockValue.state.loading = true;

    const { getByTestId, rerender } = render(
      <MockDataProvider value={mockValue}>
        <MyComponent />
      </MockDataProvider>
    );

    expect(getByTestId('loading')).toBeTruthy();

    // Update context value
    const newMockValue = createMockDataValue();
    newMockValue.state.items = [{ id: '1', name: 'Item 1' }];

    rerender(
      <MockDataProvider value={newMockValue}>
        <MyComponent />
      </MockDataProvider>
    );

    expect(getByTestId('item-1')).toBeTruthy();
  });
});
```

## Testing Components with Service Dependencies

When components depend on **services** that perform I/O operations (API calls, storage, etc.), use the **Factory Pattern** with **dependency injection**, not the provider pattern.

**Key difference:**

- **Context (Provider Pattern):** For React state/UI concerns (auth state, theme, navigation)
- **Services (Factory Pattern):** For I/O operations (API calls, storage, native modules)

**For detailed factory patterns, see [Factory Pattern](./factory-pattern.md).**

### Component with API Client Dependency

**Pattern: Inject service via props:**

```typescript
// components/UserList.tsx
import { ApiClient } from '@/services/api';

interface UserListProps {
  apiClient: ApiClient;
}

export function UserList({ apiClient }: UserListProps) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await apiClient.get('/users');
        setUsers(response.data);
      } catch (error) {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [apiClient]);

  if (loading) return <Text testID="loading">Loading...</Text>;

  return (
    <View testID="user-list">
      {users.map(user => (
        <Text key={user.id} testID={`user-${user.id}`}>
          {user.name}
        </Text>
      ))}
    </View>
  );
}

// components/__tests__/UserList.test.tsx
import { render, waitFor } from '@testing-library/react-native';
import { UserList } from '../UserList';
import { MockApiClient } from '@/services/api/__tests__/ApiClient.mock';

describe('UserList', () => {
  let mockApiClient: MockApiClient;

  beforeEach(() => {
    mockApiClient = new MockApiClient(); // Factory instance
  });

  it('Should fetch and display users', async () => {
    const mockUsers = [
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'Jane Smith' },
    ];

    mockApiClient.withResponse('/users', { data: mockUsers });

    const { getByTestId } = render(<UserList apiClient={mockApiClient} />);

    // Initially shows loading
    expect(getByTestId('loading')).toBeTruthy();

    // After load, shows users
    await waitFor(() => {
      expect(getByTestId('user-1')).toHaveTextContent('John Doe');
      expect(getByTestId('user-2')).toHaveTextContent('Jane Smith');
    });

    // Verify API was called
    expect(mockApiClient.getCapturedRequests()).toHaveLength(1);
    expect(mockApiClient.getLastRequest()?.url).toBe('/users');
  });

  it('Should handle API errors', async () => {
    mockApiClient.withError('/users', new Error('Network error'));

    const { getByTestId } = render(<UserList apiClient={mockApiClient} />);

    await waitFor(() => {
      expect(getByTestId('error-message')).toBeTruthy();
    });
  });
});
```

### Hook with Service Dependency

**Pattern: Inject service into hook:**

```typescript
// hooks/use-user-data.ts
import { useState, useEffect } from 'react';
import { ApiClient } from '@/services/api';

export function useUserData(apiClient: ApiClient, userId: string) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await apiClient.get(`/users/${userId}`);
        setUser(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [apiClient, userId]);

  return { user, loading, error };
}

// hooks/__tests__/use-user-data.test.ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { useUserData } from '../use-user-data';
import { MockApiClient } from '@/services/api/__tests__/ApiClient.mock';

describe('useUserData', () => {
  let mockApiClient: MockApiClient;

  beforeEach(() => {
    mockApiClient = new MockApiClient();
  });

  it('Should fetch user data', async () => {
    const mockUser = { id: '123', name: 'John Doe', email: 'john@example.com' };
    mockApiClient.withResponse('/users/123', { data: mockUser });

    const { result } = renderHook(() => useUserData(mockApiClient, '123'));

    // Initially loading
    expect(result.current.loading).toBe(true);

    // After load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.error).toBeNull();
    });
  });

  it('Should handle errors', async () => {
    mockApiClient.withError('/users/123', new Error('User not found'));

    const { result } = renderHook(() => useUserData(mockApiClient, '123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('User not found');
      expect(result.current.user).toBeNull();
    });
  });
});
```

### Service Provided via Context

Sometimes services are provided through context. In this case, use both patterns:

```typescript
// contexts/ApiContext.tsx
const ApiContext = createContext<ApiClient | null>(null);

export function ApiProvider({ children, client }: { children: ReactNode; client: ApiClient }) {
  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}

// components/__tests__/UserList.test.tsx
import { MockApiClient } from '@/services/api/__tests__/ApiClient.mock';

describe('UserList with Context', () => {
  let mockApiClient: MockApiClient;

  beforeEach(() => {
    mockApiClient = new MockApiClient();
  });

  it('Should fetch users from context API client', async () => {
    mockApiClient.withResponse('/users', { data: [] });

    const { getByTestId } = render(
      <ApiProvider client={mockApiClient}>
        <UserList />
      </ApiProvider>
    );

    await waitFor(() => {
      expect(getByTestId('user-list')).toBeTruthy();
    });

    expect(mockApiClient.getCapturedRequests()).toHaveLength(1);
  });
});
```

### Key Takeaways

1. **Use Provider Pattern for:** React Context (auth state, theme, UI state)
2. **Use Factory Pattern for:** Services with I/O (API clients, storage, native modules)
3. **Inject dependencies:** Pass services as props or via context
4. **Test isolation:** Use `beforeEach` to create fresh factory instances

**For more examples, see [Factory Pattern](./factory-pattern.md) and [Decision Guide](./decision-guide.md).**

## Test ID Pattern

@@ Some information is being repeated and can be consolidated

### Defining Test IDs

```typescript
// components/components.ids.ts
export const PROFILE_IDS = {
  CONTAINER: 'profile-container',
  USERNAME: 'profile-username',
  EMAIL: 'profile-email',
  AVATAR: 'profile-avatar',
  EDIT_BUTTON: 'profile-edit-button',
} as const;

Object.freeze(PROFILE_IDS);
```

### Using Test IDs in Components

```typescript
// components/Profile.tsx
import { PROFILE_IDS } from './components.ids';

export function Profile({ user }: ProfileProps) {
  return (
    <View testID={PROFILE_IDS.CONTAINER}>
      <Image testID={PROFILE_IDS.AVATAR} source={{ uri: user.avatar }} />
      <Text testID={PROFILE_IDS.USERNAME}>{user.name}</Text>
      <Text testID={PROFILE_IDS.EMAIL}>{user.email}</Text>
      <Button testID={PROFILE_IDS.EDIT_BUTTON} onPress={onEdit} title="Edit" />
    </View>
  );
}
```

### Using Test IDs in Tests

```typescript
// components/__tests__/Profile.test.tsx
import { PROFILE_IDS } from '../components.ids';

describe('Profile', () => {
  it('Should render user information', () => {
    const { getByTestID } = render(<Profile user={mockUser} />);

    expect(getByTestID(PROFILE_IDS.CONTAINER)).toBeTruthy();
    expect(getByTestID(PROFILE_IDS.USERNAME)).toHaveTextContent('John Doe');
    expect(getByTestID(PROFILE_IDS.EMAIL)).toHaveTextContent('john@example.com');
  });
});
```

## Async Testing

### Testing Async Operations

```typescript
import { render, waitFor, act } from '@testing-library/react-native';

describe('DataList', () => {
  it('Should load and display data', async () => {
    const mockValue = createMockDataValue();
    mockValue.state.loading = true;

    const { getByTestId, rerender } = render(
      <MockDataProvider value={mockValue}>
        <DataList />
      </MockDataProvider>
    );

    // Initially loading
    expect(getByTestId('loading')).toBeTruthy();

    // Simulate data loaded
    const loadedValue = createMockDataValue();
    loadedValue.state.items = [{ id: '1', name: 'Item 1' }];

    rerender(
      <MockDataProvider value={loadedValue}>
        <DataList />
      </MockDataProvider>
    );

    await waitFor(() => {
      expect(getByTestId('item-1')).toBeTruthy();
    });
  });

  it('Should handle async action calls', async () => {
    const mockValue = createMockDataValue();
    const mockFetch = jest.fn().mockResolvedValue(undefined);
    mockValue.actions.fetchItems = mockFetch;

    const { getByTestId } = render(
      <MockDataProvider value={mockValue}>
        <DataList />
      </MockDataProvider>
    );

    const refreshButton = getByTestId('refresh-button');
    
    await act(async () => {
      fireEvent.press(refreshButton);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
```

### Using Fake Timers

```typescript
describe('AutoRefresh', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('Should refresh data periodically', () => {
    const mockValue = createMockDataValue();
    const mockFetch = jest.fn();
    mockValue.actions.fetchItems = mockFetch;

    render(
      <MockDataProvider value={mockValue}>
        <AutoRefresh interval={5000} />
      </MockDataProvider>
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});
```

## User Interaction Testing

### Testing Button Presses

```typescript
import { fireEvent } from '@testing-library/react-native';

describe('Counter', () => {
  it('Should increment count on button press', () => {
    const { getByTestId } = render(<Counter />);

    const incrementButton = getByTestId('increment-button');
    const countDisplay = getByTestId('count-display');

    expect(countDisplay).toHaveTextContent('0');

    fireEvent.press(incrementButton);
    expect(countDisplay).toHaveTextContent('1');

    fireEvent.press(incrementButton);
    expect(countDisplay).toHaveTextContent('2');
  });
});
```

### Testing Text Input

```typescript
describe('LoginForm', () => {
  it('Should update input values', () => {
    const { getByTestId } = render(<LoginForm />);

    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    expect(emailInput.props.value).toBe('test@example.com');
    expect(passwordInput.props.value).toBe('password123');
  });

  it('Should submit form with input values', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(<LoginForm onSubmit={onSubmit} />);

    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.press(getByTestId('submit-button'));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

### Testing Scroll Events

```typescript
describe('InfiniteScroll', () => {
  it('Should load more data on scroll', () => {
    const mockValue = createMockDataValue();
    const mockLoadMore = jest.fn();
    mockValue.actions.loadMore = mockLoadMore;

    const { getByTestId } = render(
      <MockDataProvider value={mockValue}>
        <InfiniteScroll />
      </MockDataProvider>
    );

    const scrollView = getByTestId('scroll-view');

    fireEvent.scroll(scrollView, {
      nativeEvent: {
        contentOffset: { y: 1000 },
        contentSize: { height: 2000 },
        layoutMeasurement: { height: 800 },
      },
    });

    expect(mockLoadMore).toHaveBeenCalled();
  });
});
```

## Examples

### Complete Component Test

```typescript
// components/TodoItem.tsx
import { View, Text, TouchableOpacity } from 'react-native';

interface TodoItemProps {
  todo: {
    id: string;
    title: string;
    completed: boolean;
  };
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <View testID={`todo-item-${todo.id}`}>
      <TouchableOpacity
        testID={`toggle-${todo.id}`}
        onPress={() => onToggle(todo.id)}
      >
        <Text testID={`title-${todo.id}`} style={{ textDecorationLine: todo.completed ? 'line-through' : 'none' }}>
          {todo.title}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID={`delete-${todo.id}`}
        onPress={() => onDelete(todo.id)}
      >
        <Text>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

// components/__tests__/TodoItem.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { TodoItem } from '../TodoItem';

describe('TodoItem', () => {
  const mockTodo = {
    id: '1',
    title: 'Test Todo',
    completed: false,
  };

  it('Should render todo item', () => {
    const { getByTestId } = render(
      <TodoItem todo={mockTodo} onToggle={jest.fn()} onDelete={jest.fn()} />
    );

    expect(getByTestId('todo-item-1')).toBeTruthy();
    expect(getByTestId('title-1')).toHaveTextContent('Test Todo');
  });

  it('Should call onToggle when pressed', () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <TodoItem todo={mockTodo} onToggle={onToggle} onDelete={jest.fn()} />
    );

    fireEvent.press(getByTestId('toggle-1'));
    expect(onToggle).toHaveBeenCalledWith('1');
  });

  it('Should call onDelete when delete pressed', () => {
    const onDelete = jest.fn();
    const { getByTestId } = render(
      <TodoItem todo={mockTodo} onToggle={jest.fn()} onDelete={onDelete} />
    );

    fireEvent.press(getByTestId('delete-1'));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('Should render completed todo with line-through', () => {
    const completedTodo = { ...mockTodo, completed: true };
    const { getByTestId } = render(
      <TodoItem todo={completedTodo} onToggle={jest.fn()} onDelete={jest.fn()} />
    );

    const titleElement = getByTestId('title-1');
    expect(titleElement.props.style).toMatchObject({ textDecorationLine: 'line-through' });
  });
});
```

## Next Steps

- Read [Integration Testing](./integration-testing.md) for testing screens and navigation
- Read [Mocking Strategy](./mocking-strategy.md) for advanced mocking patterns
- Read [Best Practices](./best-practices.md) for testing conventions
