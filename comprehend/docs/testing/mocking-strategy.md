# Mocking Strategy

## Overview

This document outlines the principles and patterns for mocking dependencies in tests. Effective mocking isolates components for testing while maintaining realistic behavior.

## Table of Contents

- [When to Mock](#when-to-mock)
- [Mock Data Factories](#mock-data-factories)
- [Mocking Contexts](#mocking-contexts)
- [Mocking API Clients](#mocking-api-clients)
- [Mocking External Dependencies](#mocking-external-dependencies)
- [Advanced Mocking Patterns](#advanced-mocking-patterns)

## When to Mock

### Mock These

**✅ External APIs and Services:**

- HTTP requests to backend APIs
- AWS services
- Third-party integrations
- Authentication services

**✅ Side Effects:**

- File system operations
- Database calls
- Local storage
- Network requests

**✅ Time-Dependent Operations:**

- Timers and intervals
- Date/time operations
- Animations

**✅ Platform-Specific Modules:**

- Native modules that don't work in test environment
- Device-specific features
- Platform APIs

### Don't Mock These

**❌ React/React Native Core:**

- React components and hooks (unless necessary)
- React Native components
- Standard library functions

**❌ Business Logic:**

- Pure functions and utilities
- Data transformations
- Calculations and validations

**❌ Simple Dependencies:**

- Constants and configuration
- Type definitions
- Simple helper functions

## Mock Data Factories

### Creating Mock Data Factories

Mock data factories create consistent, reusable test data:

```typescript
// types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
}

// __tests__/fixtures/user.fixtures.ts
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://example.com/avatar.jpg',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function createMockUsers(count: number): User[] {
  return Array.from({ length: count }, (_, i) =>
    createMockUser({
      id: `${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
    })
  );
}
```

### Using Mock Data Factories

```typescript
describe('UserList', () => {
  it('Should display single user', () => {
    const user = createMockUser({ name: 'Alice' });
    const { getByText } = render(<UserList users={[user]} />);
    expect(getByText('Alice')).toBeTruthy();
  });

  it('Should display multiple users', () => {
    const users = createMockUsers(3);
    const { getByText } = render(<UserList users={users} />);
    expect(getByText('User 1')).toBeTruthy();
    expect(getByText('User 2')).toBeTruthy();
    expect(getByText('User 3')).toBeTruthy();
  });
});
```

### Complex Data Factories

```typescript
// __tests__/fixtures/data.fixtures.ts
export interface TodoItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate: Date;
  assignee: User;
  tags: string[];
}

export function createMockTodo(overrides: Partial<TodoItem> = {}): TodoItem {
  return {
    id: '1',
    title: 'Test Todo',
    description: 'Test description',
    completed: false,
    dueDate: new Date('2024-12-31'),
    assignee: createMockUser(),
    tags: ['work', 'urgent'],
    ...overrides,
  };
}

export function createMockTodoList(scenarios: {
  completed?: number;
  pending?: number;
  overdue?: number;
} = {}): TodoItem[] {
  const todos: TodoItem[] = [];
  const now = new Date();

  // Completed todos
  for (let i = 0; i < (scenarios.completed || 0); i++) {
    todos.push(createMockTodo({
      id: `completed-${i}`,
      title: `Completed Todo ${i}`,
      completed: true,
    }));
  }

  // Pending todos
  for (let i = 0; i < (scenarios.pending || 0); i++) {
    todos.push(createMockTodo({
      id: `pending-${i}`,
      title: `Pending Todo ${i}`,
      completed: false,
      dueDate: new Date(now.getTime() + 86400000), // Tomorrow
    }));
  }

  // Overdue todos
  for (let i = 0; i < (scenarios.overdue || 0); i++) {
    todos.push(createMockTodo({
      id: `overdue-${i}`,
      title: `Overdue Todo ${i}`,
      completed: false,
      dueDate: new Date(now.getTime() - 86400000), // Yesterday
    }));
  }

  return todos;
}

// Usage
describe('TodoList', () => {
  it('Should show correct statistics', () => {
    const todos = createMockTodoList({
      completed: 5,
      pending: 3,
      overdue: 2,
    });

    const { getByTestId } = render(<TodoList todos={todos} />);
    expect(getByTestId('completed-count')).toHaveTextContent('5');
    expect(getByTestId('pending-count')).toHaveTextContent('3');
    expect(getByTestId('overdue-count')).toHaveTextContent('2');
  });
});
```

## Mocking Contexts

### Creating Mock Context Values

```typescript
// contexts/__tests__/AuthContext.mock.tsx
import { AuthContext, AuthContextValue } from '../AuthContext';

export function createMockAuthValue(): AuthContextValue {
  return {
    state: {
      loading: false,
      user: null,
      error: null,
      isAuthenticated: false,
    },
    actions: {
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      updateProfile: jest.fn(),
    },
  };
}

export function MockAuthProvider({
  value,
  children,
}: {
  value: AuthContextValue;
  children: React.ReactNode;
}) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

### Mock Context with Default Behaviors

```typescript
export function createMockAuthValue(options: {
  authenticated?: boolean;
  loading?: boolean;
  error?: string | null;
} = {}): AuthContextValue {
  const { authenticated = false, loading = false, error = null } = options;

  const mockValue: AuthContextValue = {
    state: {
      loading,
      user: authenticated ? createMockUser() : null,
      error,
      isAuthenticated: authenticated,
    },
    actions: {
      login: jest.fn().mockResolvedValue(undefined),
      logout: jest.fn().mockResolvedValue(undefined),
      refreshToken: jest.fn().mockResolvedValue(undefined),
      updateProfile: jest.fn().mockResolvedValue(undefined),
    },
  };

  return mockValue;
}

// Usage
describe('ProtectedRoute', () => {
  it('Should render content when authenticated', () => {
    const mockValue = createMockAuthValue({ authenticated: true });
    const { getByText } = render(
      <MockAuthProvider value={mockValue}>
        <ProtectedRoute>
          <Text>Protected Content</Text>
        </ProtectedRoute>
      </MockAuthProvider>
    );
    expect(getByText('Protected Content')).toBeTruthy();
  });

  it('Should show login when not authenticated', () => {
    const mockValue = createMockAuthValue({ authenticated: false });
    const { getByText } = render(
      <MockAuthProvider value={mockValue}>
        <ProtectedRoute>
          <Text>Protected Content</Text>
        </ProtectedRoute>
      </MockAuthProvider>
    );
    expect(getByText('Please log in')).toBeTruthy();
  });
});
```

## Mocking API Clients

### Mock API Client Factory

```typescript
// utils/api/__tests__/ApiClient.mock.ts
import { ApiClient } from '../ApiClient';

export function createMockApiClient(): jest.Mocked<ApiClient> {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    request: jest.fn(),
  } as jest.Mocked<ApiClient>;
}

// Usage with specific responses
describe('DataService', () => {
  it('Should fetch data from API', async () => {
    const mockApiClient = createMockApiClient();
    mockApiClient.get.mockResolvedValue({
      data: [{ id: '1', name: 'Item 1' }],
      status: 200,
    });

    const service = new DataService(mockApiClient);
    const result = await service.fetchItems();

    expect(mockApiClient.get).toHaveBeenCalledWith('/items');
    expect(result).toEqual([{ id: '1', name: 'Item 1' }]);
  });

  it('Should handle API errors', async () => {
    const mockApiClient = createMockApiClient();
    mockApiClient.get.mockRejectedValue(new Error('Network error'));

    const service = new DataService(mockApiClient);

    await expect(service.fetchItems()).rejects.toThrow('Network error');
  });
});
```

### Mock API Responses

```typescript
// __tests__/fixtures/api.fixtures.ts
export function createMockApiResponse<T>(data: T, options: {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
} = {}) {
  return {
    data,
    status: options.status || 200,
    statusText: options.statusText || 'OK',
    headers: options.headers || {},
  };
}

export function createMockApiError(
  message: string,
  status: number = 500,
  code?: string
) {
  const error: any = new Error(message);
  error.response = {
    status,
    data: { message, code },
  };
  return error;
}

// Usage
describe('API Error Handling', () => {
  it('Should handle 404 errors', async () => {
    const mockApiClient = createMockApiClient();
    mockApiClient.get.mockRejectedValue(
      createMockApiError('Not found', 404, 'NOT_FOUND')
    );

    const service = new DataService(mockApiClient);
    
    await expect(service.fetchItem('999')).rejects.toThrow('Not found');
  });
});
```

## Mocking External Dependencies

### Global Mocks in jest.setup.js

Already configured in `jest.setup.js`:

```javascript
// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  // ... other mocks
}));
```

### Test-Specific Mocks

```typescript
// Mock a specific module in a test file
jest.mock('@/utils/analytics', () => ({
  trackEvent: jest.fn(),
  trackPageView: jest.fn(),
}));

import { trackEvent } from '@/utils/analytics';

describe('Button', () => {
  it('Should track click event', () => {
    const { getByTestId } = render(<Button />);
    fireEvent.press(getByTestId('button'));
    expect(trackEvent).toHaveBeenCalledWith('button_clicked');
  });
});
```

### Partial Mocks

```typescript
// Mock only specific functions from a module
jest.mock('@/utils/storage', () => ({
  ...jest.requireActual('@/utils/storage'),
  saveData: jest.fn(),
  loadData: jest.fn(),
}));

import { saveData, loadData, formatKey } from '@/utils/storage';

describe('Storage', () => {
  it('Should use real formatKey but mocked saveData', async () => {
    (saveData as jest.Mock).mockResolvedValue(undefined);
    
    // formatKey is real implementation
    const key = formatKey('user', '123'); // Real function
    
    // saveData is mocked
    await saveData(key, { name: 'John' });
    expect(saveData).toHaveBeenCalled();
  });
});
```

## Advanced Mocking Patterns

### Mock Implementation with State

@@ These patterns should reflect dependency injection for tests
@@ The factory then will have a dedicated `clear` or `reset` function to ensure no side effects from state

```typescript
function createStatefulMockApiClient() {
  const items: any[] = [];

  return {
    get: jest.fn(async (url: string) => {
      if (url === '/items') {
        return { data: items, status: 200 };
      }
      throw new Error('Not found');
    }),
    post: jest.fn(async (url: string, data: any) => {
      if (url === '/items') {
        const newItem = { ...data, id: `${items.length + 1}` };
        items.push(newItem);
        return { data: newItem, status: 201 };
      }
    }),
    delete: jest.fn(async (url: string) => {
      const id = url.split('/').pop();
      const index = items.findIndex(item => item.id === id);
      if (index !== -1) {
        items.splice(index, 1);
        return { status: 204 };
      }
      throw new Error('Not found');
    }),
  };
}

describe('CRUD Operations', () => {
  it('Should create, read, and delete items', async () => {
    const mockClient = createStatefulMockApiClient();
    const service = new DataService(mockClient);

    // Create
    await service.createItem({ name: 'Item 1' });
    
    // Read
    const items = await service.fetchItems();
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Item 1');

    // Delete
    await service.deleteItem(items[0].id);
    const remainingItems = await service.fetchItems();
    expect(remainingItems).toHaveLength(0);
  });
});
```

### Mock with Delays

```typescript
function createMockApiClientWithDelay(delay: number = 100) {
  return {
    get: jest.fn(async (url: string) => {
      await new Promise(resolve => setTimeout(resolve, delay));
      return { data: [], status: 200 };
    }),
    post: jest.fn(async (url: string, data: any) => {
      await new Promise(resolve => setTimeout(resolve, delay));
      return { data, status: 201 };
    }),
  };
}

describe('Loading States', () => {
  it('Should show loading indicator during API call', async () => {
    const mockClient = createMockApiClientWithDelay(1000);
    
    const { getByTestId } = render(
      <DataComponent apiClient={mockClient} />
    );

    // Should show loading
    expect(getByTestId('loading')).toBeTruthy();

    // Advance timers
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // Should hide loading
    await waitFor(() => {
      expect(() => getByTestId('loading')).toThrow();
    });
  });
});
```

### Mock Different Scenarios

```typescript
type ApiScenario = 'success' | 'loading' | 'error' | 'empty';

function createMockApiClient(scenario: ApiScenario = 'success') {
  const mock = createMockApiClient();

  switch (scenario) {
    case 'success':
      mock.get.mockResolvedValue({
        data: [{ id: '1', name: 'Item 1' }],
        status: 200,
      });
      break;
    case 'loading':
      mock.get.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      break;
    case 'error':
      mock.get.mockRejectedValue(new Error('API Error'));
      break;
    case 'empty':
      mock.get.mockResolvedValue({
        data: [],
        status: 200,
      });
      break;
  }

  return mock;
}

describe('Data Display Scenarios', () => {
  it.each([
    ['success', 'Should display items'],
    ['loading', 'Should show loading indicator'],
    ['error', 'Should show error message'],
    ['empty', 'Should show empty state'],
  ])('Scenario: %s - %s', async (scenario, description) => {
    const mockClient = createMockApiClient(scenario as ApiScenario);
    const { getByTestId, queryByTestId } = render(
      <DataDisplay apiClient={mockClient} />
    );

    switch (scenario) {
      case 'success':
        await waitFor(() => {
          expect(getByTestId('item-1')).toBeTruthy();
        });
        break;
      case 'loading':
        expect(getByTestId('loading')).toBeTruthy();
        break;
      case 'error':
        await waitFor(() => {
          expect(getByTestId('error-message')).toBeTruthy();
        });
        break;
      case 'empty':
        await waitFor(() => {
          expect(getByTestId('empty-state')).toBeTruthy();
        });
        break;
    }
  });
});
```

## Best Practices

### Do's

- ✅ Create reusable mock factories
- ✅ Use realistic mock data
- ✅ Mock external dependencies
- ✅ Test different scenarios (success, error, loading)
- ✅ Keep mocks simple and focused
- ✅ Document complex mocks
- ✅ Reset mocks between tests

### Don'ts

- ❌ Don't mock everything
- ❌ Don't make mocks too complex
- ❌ Don't share mock state between tests
- ❌ Don't test mock implementations
- ❌ Don't forget to clear mocks
- ❌ Don't mock React/React Native core

## Mock Organization

```plaintext
__tests__/
├── fixtures/           # Mock data factories
│   ├── user.fixtures.ts
│   ├── data.fixtures.ts
│   └── api.fixtures.ts
├── mocks/             # Mock implementations
│   ├── ApiClient.mock.ts
│   └── navigation.mock.tsx
└── [feature]/         # Feature tests
    └── Feature.test.tsx

contexts/
└── __tests__/
    └── Context.mock.tsx  # Context-specific mocks
```

## Next Steps

- Read [Unit Testing](./unit-testing.md) for using mocks in component tests
- Read [Integration Testing](./integration-testing.md) for using mocks in navigation tests
- Read [Best Practices](./best-practices.md) for testing conventions
