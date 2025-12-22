# Testing Decision Guide

## Overview

This guide helps you choose the right testing approach for different scenarios in React Native. Follow the decision trees and examples to quickly determine the best mocking strategy.

## Quick Decision Trees

### What Mocking Approach Should I Use?

```plaintext
What are you testing?
│
├─ Component using React Context
│  └─ Use: Mock Context Provider
│     Example: MockAuthProvider, MockThemeProvider
│     See: Mocking Strategy - Mocking Contexts
│
├─ Component that makes API calls
│  └─ Does it use an API client service?
│     ├─ Yes → Use: Mock Factory for API Client
│     │        Inject mock via dependency injection
│     │        See: Factory Pattern
│     └─ No (direct fetch) → Use: jest.mock on global fetch
│
├─ Component with AsyncStorage / SecureStore
│  └─ Multiple components use it?
│     ├─ Yes → Use: Mock Factory for storage service
│     └─ No → Use: jest.mock directly
│
├─ Component with callback props (onPress, onChange)
│  └─ Use: jest.fn() directly
│     Example: const onPress = jest.fn()
│
├─ Custom Hook
│  └─ Does it use external services?
│     ├─ Yes → Inject mock factory for service
│     └─ No → Use real implementation, test behavior
│
└─ Pure Utility Function
   └─ Use: No mocking needed, test with real implementation
```

### Should I Create a Factory?

```plaintext
Does the component/service interact with I/O?
│
├─ Yes → What kind of I/O?
│  │
│  ├─ API Calls (HTTP requests)
│  │  └─ Multiple test scenarios needed?
│  │     ├─ Yes → Create Mock Factory
│  │     │        Example: MockApiClient
│  │     └─ No → Use jest.fn() per test
│  │
│  ├─ Storage (AsyncStorage, SecureStore)
│  │  └─ Used across multiple test files?
│  │     ├─ Yes → Create Mock Factory
│  │     │        Example: MockStorageService
│  │     └─ No → Mock directly in test
│  │
│  ├─ Native Modules
│  │  └─ Complex behaviors to simulate?
│  │     ├─ Yes → Create Mock Factory
│  │     └─ No → Use jest.mock with simple stubs
│  │
│  └─ React Context
│     └─ Use: Mock Provider (not factory)
│        Example: MockAuthProvider
│
└─ No → No factory needed
   └─ Use: Direct instantiation or jest.fn()
```

## Decision Tables

**Should I Create a Factory?**

| What You're Testing | I/O? | Factory? | Approach | Example |
|---------------------|------|----------|----------|---------|
| API Client | Yes | ✅ Yes | Mock Factory | `MockApiClient` |
| Storage Service | Yes | ✅ Yes | Mock Factory | `MockStorageService` |
| Native Module (complex) | Yes | ✅ Yes | Mock Factory | `MockCameraService` |
| React Context | No* | ❌ No | Mock Provider | `MockAuthProvider` |
| Callback Prop | No | ❌ No | jest.fn() | `const onPress = jest.fn()` |
| Pure Utility | No | ❌ No | Real Implementation | Direct import and use |
| Configuration Object | No | ❌ No | Direct Instantiation | `{ apiUrl: 'test' }` |
| Native Module (simple) | Yes | ❌ No | jest.mock | Mock in setup file |

*Context doesn't perform I/O; it provides values to components

**Factory vs Provider vs Direct Mock:**

| Aspect | Mock Factory | Mock Provider | Direct Mock (jest.fn) |
|--------|--------------|---------------|----------------------|
| **Use Case** | I/O services | React Context | Simple callbacks |
| **Example** | API client, Storage | Auth, Theme, Navigation | onPress, onChange |
| **Pattern** | Class with methods | Provider component | Function mock |
| **Configuration** | Method chaining | Props/value object | mockReturnValue |
| **Reusability** | High (across files) | High (across tests) | Low (per test) |
| **State Capture** | Yes (captured requests) | No | Yes (call history) |
| **Clear Method** | Yes (`.clear()`) | N/A (new instance) | jest.clearAllMocks() |

## Common Scenarios

### Scenario: Testing Component with API Calls

**Question:** Component fetches data from an API. What should I use?

**Answer:**

1. **Does the component use a service/client class?**
   - **Yes** → Create `MockApiClient` factory and inject it
   - **No (direct fetch)** → Mock global fetch with jest

2. **Will multiple components use this?**
   - **Yes** → Definitely use factory
   - **No** → Factory still recommended for flexibility

**Example:**

```typescript
// ✅ With API client (recommended)
const mockApiClient = new MockApiClient()
  .withResponse('/users', { data: [] });

const { getByTestId } = render(
  <UserList apiClient={mockApiClient} />
);

// ❌ Direct fetch (less flexible)
global.fetch = jest.fn().mockResolvedValue({
  json: async () => ({ data: [] })
});
```

### Scenario: Testing Component with Context

**Question:** Component uses `useAuthContext()`. How do I test it?

**Answer:**

Use Mock Provider pattern (not factory):

```typescript
// ✅ Correct: Mock Provider
const mockAuthValue = createMockAuthValue({
  authenticated: true,
  user: createMockUser()
});

const { getByTestId } = render(
  <MockAuthProvider value={mockAuthValue}>
    <MyComponent />
  </MockAuthProvider>
);

// ❌ Wrong: Don't create factory for context
const mockAuthFactory = new MockAuthFactory(); // Don't do this
```

### Scenario: Testing Component with Callback Props

**Question:** Component has `onPress` prop. What should I use?

**Answer:**

Use `jest.fn()` directly:

```typescript
// ✅ Simple and clear
it('Should call onPress when button pressed', () => {
  const onPress = jest.fn();
  const { getByTestId } = render(<Button onPress={onPress} />);
  
  fireEvent.press(getByTestId('button'));
  
  expect(onPress).toHaveBeenCalledTimes(1);
});

// ❌ Overkill: Don't create factory for simple callback
class MockOnPressFactory { ... } // Too complex
```

### Scenario: Testing with AsyncStorage

**Question:** Component uses AsyncStorage. Mock it or create factory?

**Answer:**

Depends on complexity:

**Simple case (one test file):**

```typescript
// ✅ Direct mock for simple cases
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue('stored-value'),
}));
```

**Complex case (multiple test files, various scenarios):**

```typescript
// ✅ Factory for complex cases
const mockStorage = new MockStorageService()
  .withData('user_token', 'abc123')
  .withFailureForKey('corrupted_key');

const service = new StorageManager(mockStorage);
```

### Scenario: Testing Custom Hook with Service

**Question:** Custom hook uses an API service. How to test?

**Answer:**

Inject mock factory:

```typescript
// ✅ Hook with dependency injection
function useUserData(apiClient: ApiClient) {
  // Hook implementation
}

// Test
it('Should fetch user data', async () => {
  const mockApiClient = new MockApiClient()
    .withResponse('/user', { id: '1', name: 'John' });

  const { result } = renderHook(() => useUserData(mockApiClient));

  await waitFor(() => {
    expect(result.current.user).toEqual({ id: '1', name: 'John' });
  });
});
```

### Scenario: Testing Error Handling

**Question:** How do I test error scenarios?

**Answer:**

Depends on your mocking approach:

**With Factory:**

```typescript
it('Should handle network error', async () => {
  const mockApiClient = new MockApiClient()
    .withError('/users', new Error('Network timeout'));

  const { getByTestId } = render(<UserList apiClient={mockApiClient} />);

  await waitFor(() => {
    expect(getByTestId('error-message')).toHaveTextContent('Network timeout');
  });
});
```

**With Context Provider:**

```typescript
it('Should show error state', () => {
  const mockValue = createMockAuthValue({
    error: 'Invalid credentials'
  });

  const { getByTestId } = render(
    <MockAuthProvider value={mockValue}>
      <LoginForm />
    </MockAuthProvider>
  );

  expect(getByTestId('error-message')).toHaveTextContent('Invalid credentials');
});
```

**With jest.fn():**

```typescript
it('Should handle callback error', () => {
  const onSubmit = jest.fn().mockRejectedValue(new Error('Failed'));

  // Test error handling
});
```

## Quick Reference

### "Should I create a factory mock?"

| Scenario | Factory? | Reason |
|----------|----------|--------|
| API client used in 5+ components | ✅ Yes | High reusability, complex behaviors |
| Storage service with multiple operations | ✅ Yes | State management, interaction capture |
| Native camera module | ✅ Yes | Complex behaviors, error scenarios |
| Auth context | ❌ No | Use provider pattern instead |
| Button onPress callback | ❌ No | Use jest.fn() directly |
| Date formatter utility | ❌ No | Use real implementation |
| Config object | ❌ No | Use direct instantiation |

### "What pattern should I use?"

| Component Dependency | Pattern | Example |
|---------------------|---------|---------|
| Uses React Context | Mock Provider | `<MockAuthProvider value={...}>` |
| API Client Service | Mock Factory | `new MockApiClient()` |
| Storage Service | Mock Factory | `new MockStorageService()` |
| Simple callback | jest.fn() | `const onClick = jest.fn()` |
| Pure utility | Real Implementation | Import and use directly |

### "How do I inject the mock?"

| Pattern | Injection Method | Example |
|---------|-----------------|---------|
| Mock Factory | Props or Context | `<Component apiClient={mock} />` |
| Mock Provider | Wrapper Component | `<MockProvider>{children}</MockProvider>` |
| jest.fn() | Props | `<Button onPress={mockFn} />` |

## Step-by-Step Decision Process

### Step 1: Identify the Dependency Type

1. **Is it React Context?**
   - YES → Use Mock Provider pattern
   - NO → Continue to Step 2

2. **Does it perform I/O operations?**
   - YES (API, Storage, File System) → Continue to Step 3
   - NO → Use direct instantiation or jest.fn()

   ### Step 2: Evaluate Complexity

3. **How many test scenarios need different behaviors?**
   - Many (3+) → Use Factory
   - Few (1-2) → Consider jest.fn() or inline mock

4. **Is it used across multiple test files?**
   - YES → Use Factory for reusability
   - NO → Inline mocking may be sufficient

   ### Step 3: Choose the Pattern

5. **Based on above:**
   - **Factory:** Create class with `.withX()` methods and `.clear()`
   - **Provider:** Create wrapper component with value prop
   - **Direct Mock:** Use jest.fn() or jest.mock()

## Examples by Pattern

### Factory Pattern Example

```typescript
// Create factory
const mockApiClient = new MockApiClient()
  .withResponse('/users', { data: [] })
  .withError('/posts', new Error('Not found'));

// Inject into component
<UserDashboard apiClient={mockApiClient} />

// Verify interactions
expect(mockApiClient.getCapturedRequests()).toHaveLength(2);
```

### Provider Pattern Example

```typescript
// Create provider value
const mockAuthValue = createMockAuthValue({
  authenticated: true,
  user: { id: '1', name: 'John' }
});

// Wrap component
<MockAuthProvider value={mockAuthValue}>
  <ProtectedRoute />
</MockAuthProvider>

// Component accesses via useAuthContext()
```

### Direct Mock Example

```typescript
// Create simple mock
const onPress = jest.fn();

// Use in component
<Button onPress={onPress} title="Click" />

// Verify call
expect(onPress).toHaveBeenCalledWith(expectedArg);
```

## Anti-Patterns to Avoid

### ❌ Creating Factory for Context

```typescript
// Wrong: Context should use provider pattern
class MockAuthContextFactory {
  withUser(user) { ... }
  withError(error) { ... }
}
```

**Why it's wrong:** React Context has a built-in provider pattern. Creating a factory adds unnecessary complexity.

### ❌ Using Provider for Services

```typescript
// Wrong: Services should use factory or DI
<MockApiClientProvider value={mockClient}>
  <Component />
</MockApiClientProvider>
```

**Why it's wrong:** Services should be injected as props or through a dedicated service context, not wrapped in providers for testing.

### ❌ Factory for One-Time Use

```typescript
// Wrong: Overkill for single test
class MockButtonClickFactory {
  // Only used once in one test file
}
```

**Why it's wrong:** For simple, one-time scenarios, `jest.fn()` is clearer and more maintainable.

## Next Steps

- For detailed factory implementation: See [Factory Pattern](./factory-pattern.md)
- For context mocking patterns: See [Mocking Strategy](./mocking-strategy.md#mocking-contexts)
- For test organization: See [Best Practices](./best-practices.md)
- For component testing: See [Unit Testing](./unit-testing.md)
