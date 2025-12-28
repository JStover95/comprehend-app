# Factory Pattern for Mocks

## Overview

Factories should be used to create mock objects for testing, especially when those objects need to support multiple test scenarios with different behaviors.

## Principle

**Use factory classes for I/O operations that need flexible, configurable behavior across different test scenarios.**

## Key Guidelines

1. **Create factory classes** - Build reusable mock classes for I/O operations
2. **Use method chaining** - Enable `.withX()` pattern for easy configuration
3. **Capture interactions** - Provide methods to inspect what was called
4. **Support error scenarios** - Allow configuration of failures and errors
5. **Make factories reusable** - Design for use across multiple test suites

## When to Use Factory Pattern

### ✅ Use Factory When

- Class performs I/O operations (database, API, AWS services)
- Need to capture and verify interactions
- Multiple test scenarios require different behaviors
- Testing error handling and edge cases
- Same mock needed across multiple test files

### ❌ Don't Use Factory When

- Class doesn't perform I/O operations
- Testing simple data transformations
- Configuration-only classes (use direct instantiation)
- One-off test cases (use direct mocking)

## Example: Basic Factory

```typescript
// mock-client.ts

interface CapturedRequest {
  operation: string;
  params: any;
}

/**
 * Mock client factory for testing external service interactions
 */
export class MockServiceClient {
  private capturedRequests: CapturedRequest[] = [];
  private mockResponses: Map<string, any> = new Map();
  private mockError?: Error;

  /**
   * Configure a mock response for a specific operation
   */
  withResponse(operation: string, response: any): this {
    this.mockResponses.set(operation, response);
    return this;
  }

  /**
   * Configure an error to throw on the next operation
   */
  withError(error: Error): this {
    this.mockError = error;
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
   * Clear captured requests
   */
  clearCapturedRequests(): void {
    this.capturedRequests = [];
  }

  /**
   * Mock implementation of the client's execute method
   */
  async execute(operation: string, params: any): Promise<any> {
    // Capture the request
    this.capturedRequests.push({ operation, params });

    // If an error is configured, throw it
    if (this.mockError) {
      const error = this.mockError;
      this.mockError = undefined; // Clear after throwing
      throw error;
    }

    // Return configured response or default
    return this.mockResponses.get(operation) || { success: true };
  }
}
```

## Example: Using Factory in Tests

```typescript
// service.test.ts

describe("MyService", () => {
  it("should handle successful operations", async () => {
    const mockClient = new MockServiceClient().withResponse("getData", {
      data: "test-data",
    });

    const service = new MyService(mockClient);
    const result = await service.fetchData();

    expect(result).toEqual({ data: "test-data" });
    expect(mockClient.getLastRequest()?.operation).toBe("getData");
  });

  it("should handle errors", async () => {
    const mockClient = new MockServiceClient().withError(
      new Error("Service unavailable"),
    );

    const service = new MyService(mockClient);

    await expect(service.fetchData()).rejects.toThrow("Service unavailable");
  });

  it("should handle multiple operations", async () => {
    const mockClient = new MockServiceClient()
      .withResponse("getData", { data: "test-1" })
      .withResponse("saveData", { success: true });

    const service = new MyService(mockClient);

    await service.fetchData();
    await service.saveData({ data: "new" });

    const requests = mockClient.getCapturedRequests();
    expect(requests).toHaveLength(2);
    expect(requests[0].operation).toBe("getData");
    expect(requests[1].operation).toBe("saveData");
  });
});
```

## Advanced Example: Storage Mock

```typescript
// mock-storage.ts

interface CapturedWrite {
  key: string;
  data: any;
}

/**
 * Mock storage client for testing persistence operations
 */
export class MockStorageClient {
  private capturedWrites: CapturedWrite[] = [];
  private mockData = new Map<string, any>();
  private mockError?: Error;
  private shouldFailForKeys: Set<string> = new Set();

  /**
   * Pre-populate mock data for reads
   */
  withData(key: string, data: any): this {
    this.mockData.set(key, data);
    return this;
  }

  /**
   * Configure an error to throw
   */
  withError(error: Error): this {
    this.mockError = error;
    return this;
  }

  /**
   * Configure specific keys to fail
   */
  withFailureForKey(key: string): this {
    this.shouldFailForKeys.add(key);
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
   * Mock write operation
   */
  async write(key: string, data: any): Promise<void> {
    this.capturedWrites.push({ key, data });

    if (this.shouldFailForKeys.has(key)) {
      throw new Error(`Write failed for key: ${key}`);
    }

    if (this.mockError) {
      const error = this.mockError;
      this.mockError = undefined;
      throw error;
    }

    // Store for potential reads
    this.mockData.set(key, data);
  }

  /**
   * Mock read operation
   */
  async read(key: string): Promise<any> {
    if (this.mockError) {
      const error = this.mockError;
      this.mockError = undefined;
      throw error;
    }

    if (!this.mockData.has(key)) {
      throw new Error(`Key not found: ${key}`);
    }

    return this.mockData.get(key);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    return this.mockData.has(key);
  }
}
```

## Factory Pattern Features

### Method Chaining

```typescript
const mock = new MockClient()
  .withResponse("op1", { data: "1" })
  .withResponse("op2", { data: "2" })
  .withError(new Error("fail"));
```

### Interaction Capture

```typescript
// Execute operations
await service.doWork();

// Verify interactions
const requests = mock.getCapturedRequests();
expect(requests).toHaveLength(3);
expect(requests[0].operation).toBe("getData");
```

### Error Scenarios

```typescript
// Global error
const mock = new MockClient().withError(new Error("Service down"));

// Specific scenario error
const mock = new MockClient().withFailureForKey("bad-key");
```

### Stateful Behavior

```typescript
// Mock can maintain state across operations
mock.withData("key1", "value1");
await service.read("key1"); // Returns "value1"

await service.write("key2", "value2");
await service.read("key2"); // Returns "value2"
```

## Benefits

1. **Reusability** - Same factory across multiple test files
2. **Clarity** - Clear, chainable API for configuration
3. **Flexibility** - Support multiple test scenarios
4. **Verification** - Easy to inspect interactions
5. **Maintainability** - Centralized mock logic

## Common Patterns

### Reset Between Tests

```typescript
describe("MyService", () => {
  let mockClient: MockClient;

  beforeEach(() => {
    mockClient = new MockClient();
  });

  // Each test gets a fresh mock
});
```

### Shared Configuration

```typescript
function createConfiguredMock(): MockClient {
  return new MockClient()
    .withResponse("common", { data: "shared" })
    .withResponse("default", { success: true });
}

// Use in tests
const mock = createConfiguredMock().withResponse("specific", { data: "test" });
```

## Next Steps

- For mocking AWS SDK clients: See [AWS SDK Mocking](./aws-sdk-mocking.md)
- For dependency injection patterns: See [Dependency Injection](./dependency-injection.md)
- For decision guidance: See [Decision Guide](./decision-guide.md)
