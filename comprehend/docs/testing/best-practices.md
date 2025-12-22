# Testing Best Practices

## Overview

This document outlines coding standards, conventions, and best practices for writing quality tests in this React Native Expo application.

## Table of Contents

- [Test Structure](#test-structure)
- [Naming Conventions](#naming-conventions)
- [Test Organization](#test-organization)
- [Test Isolation](#test-isolation)
- [Assertions](#assertions)
- [Code Coverage](#code-coverage)
- [Common Pitfalls](#common-pitfalls)

## Test Structure

### AAA Pattern (Arrange, Act, Assert)

Structure tests using the Arrange-Act-Assert pattern:

```typescript
describe('UserProfile', () => {
  it('Should display user information', () => {
    // Arrange: Set up test data and mocks
    const mockUser = createMockUser({ name: 'John Doe' });
    const mockContext = createMockAuthValue();
    mockContext.state.user = mockUser;

    // Act: Render component or perform action
    const { getByTestId } = render(
      <MockAuthProvider value={mockContext}>
        <UserProfile />
      </MockAuthProvider>
    );

    // Assert: Verify expected behavior
    expect(getByTestId('username')).toHaveTextContent('John Doe');
  });
});
```

### Clear Test Separation

Use blank lines to separate test sections:

```typescript
it('Should handle form submission', async () => {
  // Arrange
  const onSubmit = jest.fn();
  const { getByTestId } = render(<LoginForm onSubmit={onSubmit} />);

  // Act
  fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
  fireEvent.changeText(getByTestId('password-input'), 'password123');
  fireEvent.press(getByTestId('submit-button'));

  // Assert
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

### Nested Describe Blocks

Group related tests with nested describe blocks:

```typescript
describe('TodoList', () => {
  describe('Rendering', () => {
    it('Should render empty state', () => {
      // Test empty state
    });

    it('Should render list of todos', () => {
      // Test with todos
    });
  });

  describe('User Interactions', () => {
    it('Should toggle todo completion', () => {
      // Test toggle
    });

    it('Should delete todo', () => {
      // Test delete
    });
  });

  describe('Error Handling', () => {
    it('Should display error message', () => {
      // Test error display
    });

    it('Should retry on error', () => {
      // Test retry
    });
  });
});
```

## Naming Conventions

### Test Files

- Component tests: `ComponentName.test.tsx`
- Hook tests: `use-hook-name.test.ts`
- Utility tests: `utility-name.test.ts`
- Mock files: `ComponentName.mock.tsx`
- Fixture files: `data.fixtures.ts`

### Test Suites (describe blocks)

Use the component/function name:

```typescript
describe('UserProfile', () => {
  // Component tests
});

describe('useAuth', () => {
  // Hook tests
});

describe('formatCurrency', () => {
  // Utility tests
});
```

### Test Cases (it blocks)

Use descriptive, behavior-focused names starting with "Should":

**Good:**

```typescript
it('Should display user name when authenticated', () => {});
it('Should show error message when login fails', () => {});
it('Should navigate to home screen after successful login', () => {});
```

**Bad:**

```typescript
it('test user profile', () => {});
it('works', () => {});
it('renders', () => {});
```

### Test IDs

Use consistent, descriptive test IDs:

**Pattern:** `{component}-{element}-{modifier}`

```typescript
export const USER_PROFILE_IDS = {
  CONTAINER: 'user-profile-container',
  USERNAME: 'user-profile-username',
  EMAIL: 'user-profile-email',
  EDIT_BUTTON: 'user-profile-edit-button',
  SAVE_BUTTON: 'user-profile-save-button',
} as const;
```

### Mock Functions

Prefix mock functions with `mock`:

```typescript
const mockFetchData = jest.fn();
const mockOnSubmit = jest.fn();
const mockApiClient = createMockApiClient();
```

### Mock Data

Prefix mock data with `mock`:

```typescript
const mockUser = createMockUser();
const mockTodos = createMockTodos(5);
const mockContext = createMockAuthValue();
```

## Test Organization

### File Structure

```plaintext
src/
├── components/
│   ├── UserProfile.tsx
│   ├── components.ids.ts
│   └── __tests__/
│       ├── UserProfile.test.tsx
│       └── UserProfile.mock.tsx
├── hooks/
│   ├── use-auth.ts
│   └── __tests__/
│       └── use-auth.test.ts
├── utils/
│   ├── formatters.ts
│   └── __tests__/
│       ├── formatters.test.ts
│       └── fixtures/
│           └── data.fixtures.ts
└── contexts/
    └── AuthContext/
        ├── Context.tsx
        ├── Provider.tsx
        └── __tests__/
            ├── Context.test.tsx
            └── Context.mock.tsx
```

### Setup and Teardown

Use lifecycle hooks appropriately:

```typescript
describe('Component', () => {
  // Runs once before all tests in this suite
  beforeAll(() => {
    // Set up expensive operations
  });

  // Runs before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset state
  });

  // Runs after each test
  afterEach(() => {
    // Clean up
  });

  // Runs once after all tests in this suite
  afterAll(() => {
    // Final cleanup
  });

  it('Should do something', () => {
    // Test
  });
});
```

### Clear Mocks Between Tests

Always clear mocks to ensure test isolation. This applies to both Jest mocks and factory instances:

```typescript
describe('Component', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear Jest function mocks
  });

  it('Should call function once', () => {
    const mockFn = jest.fn();
    // Test
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('Should call function twice', () => {
    const mockFn = jest.fn();
    // Test (starts fresh, not affected by previous test)
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});
```

### Clear Factory State Between Tests

When using mock factories, clear their state to prevent test pollution:

```typescript
import { MockApiClient } from '@/utils/api/__tests__/ApiClient.mock';

describe('DataService', () => {
  let mockApiClient: MockApiClient;
  let service: DataService;

  beforeEach(() => {
    jest.clearAllMocks(); // Clear Jest mocks
    mockApiClient = new MockApiClient(); // Fresh factory instance
    service = new DataService(mockApiClient);
  });

  it('Should fetch users', async () => {
    mockApiClient.withResponse('/users', { data: [] });
    await service.fetchUsers();
    expect(mockApiClient.getCapturedRequests()).toHaveLength(1);
  });

  it('Should fetch posts', async () => {
    // Fresh instance - no requests from previous test
    mockApiClient.withResponse('/posts', { data: [] });
    await service.fetchPosts();
    expect(mockApiClient.getCapturedRequests()).toHaveLength(1); // Not 2
  });
});
```

### Reusable Factory with Clear Method

Alternatively, reuse factory instance with `.clear()` method:

```typescript
describe('DataService', () => {
  const mockApiClient = new MockApiClient(); // Reusable instance
  let service: DataService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClient.clear(); // Clear factory state
    service = new DataService(mockApiClient);
  });

  it('Should fetch users', async () => {
    mockApiClient.withResponse('/users', { data: [] });
    await service.fetchUsers();
    expect(mockApiClient.getCapturedRequests()).toHaveLength(1);
  });

  it('Should fetch posts', async () => {
    // State cleared - no requests from previous test
    mockApiClient.withResponse('/posts', { data: [] });
    await service.fetchPosts();
    expect(mockApiClient.getCapturedRequests()).toHaveLength(1);
  });
});
```

## Test Isolation

### Independent Tests

Each test should be completely independent:

**Good:**

```typescript
describe('Counter', () => {
  it('Should start at zero', () => {
    const { getByTestId } = render(<Counter />);
    expect(getByTestId('count')).toHaveTextContent('0');
  });

  it('Should increment to one', () => {
    const { getByTestId } = render(<Counter />);
    fireEvent.press(getByTestId('increment'));
    expect(getByTestId('count')).toHaveTextContent('1');
  });
});
```

**Bad:**

```typescript
describe('Counter', () => {
  let component;

  beforeAll(() => {
    component = render(<Counter />); // Shared state!
  });

  it('Should start at zero', () => {
    expect(component.getByTestId('count')).toHaveTextContent('0');
  });

  it('Should increment to one', () => {
    // Depends on previous test state!
    fireEvent.press(component.getByTestId('increment'));
    expect(component.getByTestId('count')).toHaveTextContent('1');
  });
});
```

### Fresh Data for Each Test

Create fresh mock data for each test:

**Good:**

```typescript
describe('TodoList', () => {
  it('Should display todos', () => {
    const todos = createMockTodos(3);
    const { getByTestId } = render(<TodoList todos={todos} />);
    expect(getByTestId('todo-0')).toBeTruthy();
  });

  it('Should handle empty list', () => {
    const todos = []; // Fresh empty array
    const { getByTestId } = render(<TodoList todos={todos} />);
    expect(getByTestId('empty-state')).toBeTruthy();
  });
});
```

**Bad:**

```typescript
describe('TodoList', () => {
  const todos = createMockTodos(3); // Shared!

  it('Should display todos', () => {
    const { getByTestId } = render(<TodoList todos={todos} />);
    expect(getByTestId('todo-0')).toBeTruthy();
  });

  it('Should handle deletion', () => {
    todos.splice(0, 1); // Mutates shared state!
    const { getByTestId } = render(<TodoList todos={todos} />);
    expect(todos).toHaveLength(2);
  });
});
```

### Test Isolation with Factories

When using mock factories, ensure proper isolation between tests:

**Pattern 1: Fresh Instance Per Test:**

```typescript
describe('DataService', () => {
  let mockApiClient: MockApiClient;

  beforeEach(() => {
    // Create fresh instance for complete isolation
    mockApiClient = new MockApiClient();
  });

  it('Test 1 - Should fetch users', async () => {
    mockApiClient.withResponse('/users', { data: [] });
    const service = new DataService(mockApiClient);
    
    await service.fetchUsers();
    
    expect(mockApiClient.getCapturedRequests()).toHaveLength(1);
  });

  it('Test 2 - Should fetch posts', async () => {
    // Fresh instance - no state from Test 1
    mockApiClient.withResponse('/posts', { data: [] });
    const service = new DataService(mockApiClient);
    
    await service.fetchPosts();
    
    // Exactly 1 request, not affected by Test 1
    expect(mockApiClient.getCapturedRequests()).toHaveLength(1);
  });
});
```

**Pattern 2: Reusable Instance with Clear:**

```typescript
describe('DataService', () => {
  const mockApiClient = new MockApiClient(); // Reusable

  beforeEach(() => {
    // Clear state but reuse instance
    mockApiClient.clear();
  });

  it('Test 1 - Should handle error', async () => {
    mockApiClient.withError('/users', new Error('Failed'));
    const service = new DataService(mockApiClient);
    
    await expect(service.fetchUsers()).rejects.toThrow('Failed');
  });

  it('Test 2 - Should handle success', async () => {
    // State cleared - error configuration gone
    mockApiClient.withResponse('/users', { data: [] });
    const service = new DataService(mockApiClient);
    
    await expect(service.fetchUsers()).resolves.toBeTruthy();
  });
});
```

**Verify Factory State is Cleared:**

```typescript
describe('API Client Factory', () => {
  const mockClient = new MockApiClient();

  beforeEach(() => {
    mockClient.clear();
  });

  it('Should start with empty request history', () => {
    expect(mockClient.getCapturedRequests()).toHaveLength(0);
  });

  it('Should not have previous test configurations', async () => {
    // Previous test may have configured responses
    // This should throw because no response configured
    await expect(mockClient.get('/unconfigured')).resolves.toEqual({
      data: null,
    });
  });
});
```

**For more on factory patterns, see [Factory Pattern](./factory-pattern.md).**

## Assertions

### Specific Assertions

Use specific assertions that clearly express intent:

**Good:**

```typescript
expect(getByTestId('username')).toHaveTextContent('John Doe');
expect(getByTestId('email')).toBeTruthy();
expect(mockFunction).toHaveBeenCalledWith('expected', 'args');
expect(mockFunction).toHaveBeenCalledTimes(1);
```

**Bad:**

```typescript
expect(getByTestId('username').children[0]).toBe('John Doe'); // Too specific
expect(!!getByTestId('email')).toBe(true); // Convoluted
expect(mockFunction.mock.calls.length).toBe(1); // Use toHaveBeenCalledTimes
```

### Negative Assertions

Test that things DON'T happen when they shouldn't:

```typescript
it('Should not call onSubmit when form is invalid', () => {
  const onSubmit = jest.fn();
  const { getByTestId } = render(<Form onSubmit={onSubmit} />);

  fireEvent.press(getByTestId('submit-button'));

  expect(onSubmit).not.toHaveBeenCalled();
});

it('Should not render error when successful', async () => {
  const { queryByTestId } = render(<Component />);
  
  await waitFor(() => {
    expect(queryByTestId('error-message')).toBeNull();
  });
});
```

### Multiple Assertions

Group related assertions:

```typescript
it('Should display complete user profile', () => {
  const mockUser = createMockUser({
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
  });

  const { getByTestId } = render(<UserProfile user={mockUser} />);

  // All profile fields
  expect(getByTestId('profile-name')).toHaveTextContent('John Doe');
  expect(getByTestId('profile-email')).toHaveTextContent('john@example.com');
  expect(getByTestId('profile-role')).toHaveTextContent('admin');
  
  // Admin badge visible
  expect(getByTestId('admin-badge')).toBeTruthy();
});
```

## Code Coverage

### Coverage Goals

Target coverage levels:

- **Components**: 80%+
- **Hooks**: 90%+
- **Utilities**: 90%+
- **Contexts**: 90%+
- **Overall**: 80%+

### Run Coverage Report

```bash
npm run test:coverage
```

### Focus on Critical Paths

Prioritize coverage of:

1. **Business logic**: Core functionality
2. **Error handling**: Edge cases and failures
3. **User interactions**: Critical user flows
4. **State management**: Context actions and updates

### Coverage Is Not Everything

**Good coverage:**

- Tests critical business logic
- Tests error scenarios
- Tests user interactions
- Tests state changes

**Bad coverage:**

- Only tests happy paths
- Avoids edge cases
- Tests implementation details
- Inflates numbers with trivial tests

## Common Pitfalls

### Pitfall 1: Testing Implementation Details

**Bad:**

```typescript
it('Should call setState with new value', () => {
  const component = render(<Counter />);
  const instance = component.getInstance();
  
  instance.increment();
  
  expect(instance.setState).toHaveBeenCalledWith({ count: 1 });
});
```

**Good:**

```typescript
it('Should increment counter', () => {
  const { getByTestId } = render(<Counter />);
  
  fireEvent.press(getByTestId('increment-button'));
  
  expect(getByTestId('count')).toHaveTextContent('1');
});
```

### Pitfall 2: Not Handling Async Operations

**Bad:**

```typescript
it('Should load data', () => {
  const { getByTestId } = render(<DataComponent />);
  expect(getByTestId('data')).toBeTruthy(); // Fails! Data not loaded yet
});
```

**Good:**

```typescript
it('Should load data', async () => {
  const { getByTestId } = render(<DataComponent />);
  
  await waitFor(() => {
    expect(getByTestId('data')).toBeTruthy();
  });
});
```

### Pitfall 3: Forgetting to Act on State Updates

**Bad:**

```typescript
it('Should update on button press', () => {
  const { getByTestId } = render(<Component />);
  
  fireEvent.press(getByTestId('button'));
  // Warning: An update to Component inside a test was not wrapped in act(...)
  
  expect(getByTestId('result')).toHaveTextContent('Updated');
});
```

**Good:**

```typescript
it('Should update on button press', async () => {
  const { getByTestId } = render(<Component />);
  
  await act(async () => {
    fireEvent.press(getByTestId('button'));
  });
  
  expect(getByTestId('result')).toHaveTextContent('Updated');
});
```

### Pitfall 4: Not Cleaning Up Timers

**Bad:**

```typescript
it('Should delay action', () => {
  jest.useFakeTimers();
  
  const { getByTestId } = render(<Component />);
  
  jest.advanceTimersByTime(1000);
  
  expect(getByTestId('result')).toBeTruthy();
  // Timers not cleaned up!
});
```

**Good:**

```typescript
describe('Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('Should delay action', () => {
    const { getByTestId } = render(<Component />);
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(getByTestId('result')).toBeTruthy();
  });
});
```

### Pitfall 5: Over-Mocking

**Bad:**

```typescript
jest.mock('../utils/add', () => ({
  add: jest.fn(() => 5),
}));

it('Should calculate total', () => {
  const total = add(2, 3);
  expect(total).toBe(5); // Meaningless test!
});
```

**Good:**

```typescript
// Don't mock pure utility functions
import { add } from '../utils/add';

it('Should calculate total', () => {
  const total = add(2, 3);
  expect(total).toBe(5); // Tests real implementation
});
```

### Pitfall 6: Brittle Selectors

**Bad:**

```typescript
it('Should display name', () => {
  const { container } = render(<UserProfile />);
  const nameElement = container.querySelector('.profile div:nth-child(2) span');
  expect(nameElement.textContent).toBe('John');
});
```

**Good:**

```typescript
it('Should display name', () => {
  const { getByTestId } = render(<UserProfile />);
  expect(getByTestId('profile-name')).toHaveTextContent('John');
});
```

## Quick Reference

### Common Patterns

**Component with Context:**

```typescript
const mockValue = createMockContextValue();
render(
  <MockProvider value={mockValue}>
    <Component />
  </MockProvider>
);
```

**Async Operation:**

```typescript
await waitFor(() => {
  expect(getByTestId('result')).toBeTruthy();
});
```

**User Interaction:**

```typescript
fireEvent.press(getByTestId('button'));
fireEvent.changeText(getByTestId('input'), 'text');
```

**Mock Function:**

```typescript
const mockFn = jest.fn();
mockFn.mockResolvedValue(data);
mockFn.mockRejectedValue(error);
expect(mockFn).toHaveBeenCalledWith(args);
```

**Navigation Testing:**

```typescript
render(
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="Screen" component={Screen} />
    </Stack.Navigator>
  </NavigationContainer>
);
```

## Next Steps

- Review [Summary](./summary.md) for testing strategy overview
- See [Unit Testing](./unit-testing.md) for component testing patterns
- See [Integration Testing](./integration-testing.md) for navigation testing
- See [Mocking Strategy](./mocking-strategy.md) for mocking patterns
