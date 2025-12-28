# Mocking Strategy

## Overview

Writing tests should always start with setting up a mocking strategy. This involves identifying which parts of your code need to be mocked and how to structure those mocks effectively.

## Principle

**Identify what needs to be mocked based on its characteristics:**

- Types that generally remain constant (like events, contexts, or simple data structures) can be defined in mock functions
- I/O operations should be handled with a factory pattern for easy mocking in tests

## Key Guidelines

1. **Mock constant data with simple functions** - Events, contexts, and static data can use factory functions
2. **Mock I/O operations with classes** - Database calls, API requests, AWS services need flexible mock classes
3. **Capture interactions** - I/O mocks should record what was called and with what parameters
4. **Support multiple scenarios** - Mocks should be configurable for different test cases

## Examples

### Mocking Constant Data

Use simple factory functions for data that doesn't change:

```typescript
// mock-helpers.ts

/**
 * Mock for constant data structures like Lambda events
 */
export function mockLambdaEvent(): CustomEvent {
  return {
    requestId: "test-request-id",
    timestamp: "2024-01-01T00:00:00Z",
    payload: {
      action: "process",
    },
  };
}

/**
 * Mock for constant context objects
 */
export function mockContext(): Context {
  return {
    functionName: "test-function",
    awsRequestId: "test-id",
    getRemainingTimeInMillis: () => 30000,
    // ... other context properties
  };
}
```

### Mocking I/O Operations

Use factory classes for operations that need flexible behavior:

```typescript
// mock-external-service.ts

/**
 * Factory for I/O operations that need flexible mocking
 */
export class MockExternalService {
  private responses: Map<string, any> = new Map();
  private capturedRequests: any[] = [];

  withResponse(key: string, response: any): this {
    this.responses.set(key, response);
    return this;
  }

  getCapturedRequests(): any[] {
    return this.capturedRequests;
  }

  async call(request: any): Promise<any> {
    this.capturedRequests.push(request);

    for (const [key, response] of this.responses.entries()) {
      if (request.action === key) {
        return response;
      }
    }

    return { success: true };
  }
}
```

### Using Mocks in Tests

```typescript
// service.test.ts

describe("MyService", () => {
  it("should process requests", async () => {
    // Use simple factory for constant data
    const event = mockLambdaEvent();
    const context = mockContext();

    // Use factory class for I/O operations
    const mockService = new MockExternalService().withResponse("getData", {
      data: "test-data",
    });

    const service = new MyService(mockService);
    const result = await service.processRequest(event);

    expect(result).toEqual({ data: "test-data" });
    expect(mockService.getCapturedRequests()).toHaveLength(1);
  });
});
```

## When to Use Each Approach

### Use Simple Factory Functions When

- Data structure is constant (events, contexts)
- No I/O operations involved
- No need to capture interactions
- Single use case per test

### Use Factory Classes When

- Class performs I/O operations
- Need to capture and verify interactions
- Need to configure different behaviors per test
- Testing error scenarios and edge cases

## Next Steps

- For setting up test configuration: See [Environment Variables and Constants](./environment-and-constants.md)
- For creating mock factories: See [Factory Pattern for Mocks](./factory-pattern.md)
- For mocking AWS services: See [AWS SDK Mocking](./aws-sdk-mocking.md)
