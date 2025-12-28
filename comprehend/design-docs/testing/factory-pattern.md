# Factory Pattern for Mocks

## Overview

Factories should be used to create mock objects for testing, especially when those objects need to support multiple test scenarios with different behaviors. In React Native testing, factories are primarily used for I/O operations like API clients, storage services, and native module interactions.

## Principle

**Use factory classes for I/O operations that need flexible, configurable behavior across different test scenarios.**

## Key Guidelines

1. **Create factory classes** - Build reusable mock classes for I/O operations
2. **Use method chaining** - Enable `.withX()` pattern for easy configuration
3. **Capture interactions** - Provide methods to inspect what was called
4. **Support error scenarios** - Allow configuration of failures and errors
5. **Provide clear/reset methods** - Ensure test isolation with `.clear()` method
6. **Make factories reusable** - Design for use across multiple test suites

## When to Use Factory Pattern

### ✅ Use Factory When

- Service performs I/O operations (API calls, storage, native modules)
- Need to capture and verify interactions
- Multiple test scenarios require different behaviors
- Testing error handling and edge cases
- Same mock needed across multiple test files
- Service is injected as a dependency

### ❌ Don't Use Factory When

- Testing React Context (use Mock Provider pattern instead)
- Simple callback props (use `jest.fn()` directly)
- Configuration-only objects (use direct instantiation)
- One-off test cases (use inline mocking)
- Pure utility functions (no mocking needed)

## Basic Factory Example

### API Client Factory

```typescript
// utils/api/__tests__/ApiClient.mock.ts

interface CapturedRequest {
  method: string;
  url: string;
  data?: any;
  headers?: Record<string, string>;
}

/**
 * Mock API client factory for testing HTTP interactions
 */
export class MockApiClient {
  private responses = new Map<string, any>();
  private errors = new Map<string, Error>();
  private capturedRequests: CapturedRequest[] = [];
  private delay?: number;

  /**
   * Configure a mock response for a specific URL
   */
  withResponse(url: string, response: any): this {
    this.responses.set(url, response);
    return this;
  }

  /**
   * Configure an error to throw for a specific URL
   */
  withError(url: string, error: Error): this {
    this.errors.set(url, error);
    return this;
  }

  /**
   * Configure a delay for all requests
   */
  withDelay(ms: number): this {
    this.delay = ms;
    return this;
  }

  /**
   * Get all captured requests
   */
  getCapturedRequests(): CapturedRequest[] {
    return this.capturedRequests;
  }

  /**
   * Get the last captured request
   */
  getLastRequest(): CapturedRequest | undefined {
    return this.capturedRequests[this.capturedRequests.length - 1];
  }

  /**
   * Get requests for a specific URL
   */
  getRequestsForUrl(url: string): CapturedRequest[] {
    return this.capturedRequests.filter(req => req.url === url);
  }

  /**
   * Clear all captured state and configurations
   */
  clear(): void {
    this.responses.clear();
    this.errors.clear();
    this.capturedRequests = [];
    this.delay = undefined;
  }

  /**
   * Mock GET request
   */
  async get<T = any>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.executeRequest('GET', url, undefined, headers);
  }

  /**
   * Mock POST request
   */
  async post<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    return this.executeRequest('POST', url, data, headers);
  }

  /**
   * Mock PUT request
   */
  async put<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    return this.executeRequest('PUT', url, data, headers);
  }

  /**
   * Mock DELETE request
   */
  async delete<T = any>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.executeRequest('DELETE', url, undefined, headers);
  }

  /**
   * Internal method to execute requests
   */
  private async executeRequest(
    method: string,
    url: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<any> {
    // Capture the request
    this.capturedRequests.push({ method, url, data, headers });

    // Apply delay if configured
    if (this.delay) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }

    // If an error is configured for this URL, throw it
    if (this.errors.has(url)) {
      throw this.errors.get(url);
    }

    // Return configured response or default
    return this.responses.get(url) || { data: null, status: 200 };
  }
}
```

## Using Factory in Tests

### Basic Usage

```typescript
// components/__tests__/DataList.test.tsx
import { render, waitFor } from '@testing-library/react-native';
import { DataList } from '../DataList';
import { MockApiClient } from '@/utils/api/__tests__/ApiClient.mock';

describe('DataList', () => {
  let mockApiClient: MockApiClient;

  beforeEach(() => {
    mockApiClient = new MockApiClient();
  });

  it('Should fetch and display data', async () => {
    const mockData = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
    ];

    mockApiClient.withResponse('/api/items', { data: mockData });

    const { getByTestId } = render(<DataList apiClient={mockApiClient} />);

    await waitFor(() => {
      expect(getByTestId('item-1')).toBeTruthy();
      expect(getByTestId('item-2')).toBeTruthy();
    });

    // Verify the request was made
    expect(mockApiClient.getLastRequest()?.url).toBe('/api/items');
  });

  it('Should handle API errors', async () => {
    mockApiClient.withError('/api/items', new Error('Network error'));

    const { getByTestId } = render(<DataList apiClient={mockApiClient} />);

    await waitFor(() => {
      expect(getByTestId('error-message')).toHaveTextContent('Network error');
    });
  });

  it('Should show loading state', async () => {
    mockApiClient
      .withResponse('/api/items', { data: [] })
      .withDelay(100);

    const { getByTestId, queryByTestId } = render(<DataList apiClient={mockApiClient} />);

    // Should show loading initially
    expect(getByTestId('loading-indicator')).toBeTruthy();

    // Should hide loading after response
    await waitFor(() => {
      expect(queryByTestId('loading-indicator')).toBeNull();
    });
  });
});
```

### Method Chaining

```typescript
it('Should handle multiple API calls', async () => {
  const mockApiClient = new MockApiClient()
    .withResponse('/api/users', { data: [{ id: '1', name: 'John' }] })
    .withResponse('/api/posts', { data: [{ id: '1', title: 'Hello' }] })
    .withResponse('/api/comments', { data: [] });

  const { getByTestId } = render(<Dashboard apiClient={mockApiClient} />);

  await waitFor(() => {
    expect(getByTestId('users-count')).toHaveTextContent('1');
    expect(getByTestId('posts-count')).toHaveTextContent('1');
    expect(getByTestId('comments-count')).toHaveTextContent('0');
  });

  const requests = mockApiClient.getCapturedRequests();
  expect(requests).toHaveLength(3);
  expect(requests[0].url).toBe('/api/users');
  expect(requests[1].url).toBe('/api/posts');
  expect(requests[2].url).toBe('/api/comments');
});
```

## Advanced Factory Example

### Storage Service Factory

```typescript
// utils/storage/__tests__/StorageService.mock.ts

interface CapturedWrite {
  key: string;
  value: any;
  secure?: boolean;
}

/**
 * Mock storage service for testing AsyncStorage and SecureStore interactions
 */
export class MockStorageService {
  private storage = new Map<string, any>();
  private capturedWrites: CapturedWrite[] = [];
  private failureKeys = new Set<string>();
  private readDelay?: number;
  private writeDelay?: number;

  /**
   * Pre-populate storage with data
   */
  withData(key: string, value: any): this {
    this.storage.set(key, value);
    return this;
  }

  /**
   * Configure specific keys to fail on read/write
   */
  withFailureForKey(key: string): this {
    this.failureKeys.add(key);
    return this;
  }

  /**
   * Configure delays for read operations
   */
  withReadDelay(ms: number): this {
    this.readDelay = ms;
    return this;
  }

  /**
   * Configure delays for write operations
   */
  withWriteDelay(ms: number): this {
    this.writeDelay = ms;
    return this;
  }

  /**
   * Get all captured write operations
   */
  getCapturedWrites(): CapturedWrite[] {
    return this.capturedWrites;
  }

  /**
   * Get the last write operation
   */
  getLastWrite(): CapturedWrite | undefined {
    return this.capturedWrites[this.capturedWrites.length - 1];
  }

  /**
   * Check if a key was written
   */
  wasKeyWritten(key: string): boolean {
    return this.capturedWrites.some(write => write.key === key);
  }

  /**
   * Clear all state and configurations
   */
  clear(): void {
    this.storage.clear();
    this.capturedWrites = [];
    this.failureKeys.clear();
    this.readDelay = undefined;
    this.writeDelay = undefined;
  }

  /**
   * Mock read operation
   */
  async get(key: string): Promise<any> {
    if (this.readDelay) {
      await new Promise(resolve => setTimeout(resolve, this.readDelay));
    }

    if (this.failureKeys.has(key)) {
      throw new Error(`Failed to read key: ${key}`);
    }

    return this.storage.get(key) || null;
  }

  /**
   * Mock write operation
   */
  async set(key: string, value: any, secure = false): Promise<void> {
    if (this.writeDelay) {
      await new Promise(resolve => setTimeout(resolve, this.writeDelay));
    }

    this.capturedWrites.push({ key, value, secure });

    if (this.failureKeys.has(key)) {
      throw new Error(`Failed to write key: ${key}`);
    }

    this.storage.set(key, value);
  }

  /**
   * Mock delete operation
   */
  async remove(key: string): Promise<void> {
    if (this.failureKeys.has(key)) {
      throw new Error(`Failed to delete key: ${key}`);
    }

    this.storage.delete(key);
  }

  /**
   * Mock check if key exists
   */
  async has(key: string): Promise<boolean> {
    return this.storage.has(key);
  }

  /**
   * Mock clear all storage
   */
  async clearAll(): Promise<void> {
    this.storage.clear();
  }
}
```

## Factory Pattern Features

### State Management

Factories can maintain internal state across operations:

```typescript
describe('UserSession', () => {
  let mockStorage: MockStorageService;

  beforeEach(() => {
    mockStorage = new MockStorageService();
  });

  it('Should persist and retrieve session data', async () => {
    const service = new UserSessionService(mockStorage);

    // Write session
    await service.saveSession({ userId: '123', token: 'abc' });

    // Read back (factory maintains state)
    const session = await service.getSession();

    expect(session).toEqual({ userId: '123', token: 'abc' });
    expect(mockStorage.wasKeyWritten('user_session')).toBe(true);
  });

  it('Should handle multiple write operations', async () => {
    const service = new UserSessionService(mockStorage);

    await service.saveSession({ userId: '1', token: 'a' });
    await service.updateLastActive();
    await service.savePreferences({ theme: 'dark' });

    const writes = mockStorage.getCapturedWrites();
    expect(writes).toHaveLength(3);
    expect(writes[0].key).toBe('user_session');
    expect(writes[1].key).toBe('last_active');
    expect(writes[2].key).toBe('preferences');
  });
});
```

### Error Scenarios

Configure specific error behaviors:

```typescript
describe('DataService Error Handling', () => {
  let mockApiClient: MockApiClient;

  beforeEach(() => {
    mockApiClient = new MockApiClient();
  });

  it('Should retry on network error', async () => {
    let attempts = 0;
    mockApiClient.withError('/api/data', new Error('Network timeout'));

    const service = new DataService(mockApiClient);

    await expect(service.fetchWithRetry('/api/data')).rejects.toThrow('Network timeout');

    const requests = mockApiClient.getCapturedRequests();
    expect(requests.length).toBeGreaterThan(1); // Verify retry logic
  });

  it('Should handle different errors for different endpoints', async () => {
    mockApiClient
      .withError('/api/users', new Error('Unauthorized'))
      .withError('/api/posts', new Error('Not Found'))
      .withResponse('/api/comments', { data: [] });

    const service = new DataService(mockApiClient);

    await expect(service.fetchUsers()).rejects.toThrow('Unauthorized');
    await expect(service.fetchPosts()).rejects.toThrow('Not Found');
    await expect(service.fetchComments()).resolves.toEqual({ data: [] });
  });
});
```

## Test Isolation Patterns

### Fresh Instance Pattern

Create a new factory instance for each test:

```typescript
describe('MyComponent', () => {
  let mockApiClient: MockApiClient;

  beforeEach(() => {
    // Fresh instance ensures complete isolation
    mockApiClient = new MockApiClient();
  });

  it('Test 1', async () => {
    mockApiClient.withResponse('/data', { value: 1 });
    // Test...
  });

  it('Test 2', async () => {
    // Completely fresh factory, no state from Test 1
    mockApiClient.withResponse('/data', { value: 2 });
    // Test...
  });
});
```

### Reusable Instance Pattern

Reuse factory instance with `.clear()` method:

```typescript
describe('MyComponent', () => {
  const mockApiClient = new MockApiClient();

  beforeEach(() => {
    // Clear state but reuse instance
    mockApiClient.clear();
  });

  it('Test 1', async () => {
    mockApiClient.withResponse('/data', { value: 1 });
    // Test...
    expect(mockApiClient.getCapturedRequests()).toHaveLength(1);
  });

  it('Test 2', async () => {
    // State cleared from Test 1
    mockApiClient.withResponse('/data', { value: 2 });
    // Test...
    expect(mockApiClient.getCapturedRequests()).toHaveLength(1); // Not 2
  });
});
```

### Combined with jest.clearAllMocks()

```typescript
describe('MyComponent', () => {
  let mockApiClient: MockApiClient;

  beforeEach(() => {
    jest.clearAllMocks(); // Clear Jest mocks
    mockApiClient = new MockApiClient(); // Fresh factory instance
  });

  afterEach(() => {
    // Optional: Additional cleanup
    mockApiClient.clear();
  });
});
```

## When NOT to Use Factory

### Use Mock Provider for React Context

```typescript
// ❌ Don't create a factory for context
class MockAuthContextFactory {
  // This is wrong - use provider pattern instead
}

// ✅ Use provider pattern for context
export function MockAuthProvider({ value, children }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

### Use jest.fn() for Simple Callbacks

```typescript
// ❌ Don't create a factory for simple callbacks
class MockOnPressFactory {
  // This is overkill
}

// ✅ Use jest.fn() directly
it('Should call onPress', () => {
  const onPress = jest.fn();
  const { getByTestId } = render(<Button onPress={onPress} />);
  fireEvent.press(getByTestId('button'));
  expect(onPress).toHaveBeenCalled();
});
```

### Use Direct Instantiation for Pure Functions

```typescript
// ❌ Don't mock pure utilities
const mockFormatter = new MockFormatterFactory();

// ✅ Use real implementation
import { formatDate } from '@/utils/format';

it('Should format date', () => {
  expect(formatDate(new Date('2024-01-01'))).toBe('Jan 1, 2024');
});
```

## Benefits of Factory Pattern

1. **Reusability** - Same factory across multiple test files
2. **Clarity** - Clear, chainable API for configuration
3. **Flexibility** - Support multiple test scenarios easily
4. **Verification** - Easy to inspect interactions and state
5. **Maintainability** - Centralized mock logic in one place
6. **Test Isolation** - `.clear()` method ensures clean state between tests

## Common Pitfalls

### Forgetting to Clear State

```typescript
// ❌ Bad: State leaks between tests
describe('MyComponent', () => {
  const mockClient = new MockApiClient();

  // Missing beforeEach with clear()

  it('Test 1', () => {
    mockClient.withResponse('/data', { value: 1 });
    // ...
  });

  it('Test 2', () => {
    // Still has configuration from Test 1!
  });
});

// ✅ Good: Clear state between tests
describe('MyComponent', () => {
  const mockClient = new MockApiClient();

  beforeEach(() => {
    mockClient.clear();
  });

  // Tests are isolated
});
```

### Over-Engineering Simple Cases

```typescript
// ❌ Bad: Factory for one-time use
it('Should call callback', () => {
  const mockCallbackFactory = new MockCallbackFactory();
  // Overkill for simple case
});

// ✅ Good: Direct jest.fn() for simple case
it('Should call callback', () => {
  const callback = jest.fn();
  // Simple and clear
});
```

## Next Steps

- For choosing when to use factories: See [Decision Guide](./decision-guide.md)
- For context mocking patterns: See [Mocking Strategy](./mocking-strategy.md#mocking-contexts)
- For dependency injection: See [Unit Testing](./unit-testing.md)
- For test organization: See [Best Practices](./best-practices.md)
