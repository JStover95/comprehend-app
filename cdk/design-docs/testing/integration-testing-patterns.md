# Integration Testing Helper Patterns

This guide documents generic helper patterns for integration tests that can be reused across projects.

## Overview

Helper functions improve integration tests by:

- **Reducing Boilerplate**: Common operations become one-liners
- **Improving Readability**: Tests focus on what, not how
- **Ensuring Consistency**: Standard approaches across test suite
- **Simplifying Maintenance**: Update logic in one place

## Test Data Factory Pattern

Test data factories create realistic test data with appropriate uniqueness and defaults.

### Basic Factory Pattern

```typescript
/**
 * Create test data for a resource
 * 
 * @param overrides - Optional fields to override defaults
 * @returns Test data object
 */
export function createTestResource(
  overrides?: Partial<ResourceInput>
): ResourceInput {
  const timestamp = Date.now();
  
  return {
    // Use timestamp for uniqueness and easy debugging
    id: `test-resource-${timestamp}`,
    name: `Test Resource ${timestamp}`,
    description: `Test description created at ${new Date(timestamp).toISOString()}`,
    // Reasonable defaults
    status: "active",
    metadata: { test: true, timestamp },
    // Allow overrides
    ...overrides
  };
}
```

**Key Principles:**

- **Timestamp-based IDs**: More debuggable than UUIDs (shows when created)
- **Readable names**: Include timestamp for uniqueness and debugging
- **Metadata markers**: Tag as test data (`test: true`)
- **Override support**: Allow customization via partial object

### UUID vs Timestamp IDs

**Use UUIDs only if your database expects UUID type as primary key:**

```typescript
import { v4 as uuidv4 } from "uuid";

export function createTestResourceWithUuid(
  overrides?: Partial<ResourceInput>
): ResourceInput {
  // Only use UUID if database column is UUID type (e.g., PostgreSQL UUID)
  const id = uuidv4(); // e.g., "550e8400-e29b-41d4-a716-446655440000"
  
  return {
    id,
    name: `Test Resource ${Date.now()}`, // Still use timestamp in name for debugging
    ...overrides
  };
}
```

**Prefer timestamp-based IDs for string primary keys:**

```typescript
// ✅ Better for debugging - can see when resource was created
id: `test-resource-${Date.now()}` // "test-resource-1703097845123"

// ❌ Less debuggable - no temporal information
id: uuidv4() // "550e8400-e29b-41d4-a716-446655440000"
```

### Configurable Test Data

Create factories with options for different scenarios:

```typescript
export interface TestDataOptions {
  /** Include optional fields */
  complete?: boolean;
  /** Use minimal required fields only */
  minimal?: boolean;
  /** Create invalid data for error testing */
  invalid?: boolean;
}

export function createTestResource(
  options: TestDataOptions = {},
  overrides?: Partial<ResourceInput>
): ResourceInput {
  const timestamp = Date.now();
  
  // Minimal data (required fields only)
  const minimal: ResourceInput = {
    id: `test-resource-${timestamp}`,
    name: `Test Resource ${timestamp}`,
  };

  // Return minimal if requested
  if (options.minimal) {
    return { ...minimal, ...overrides };
  }

  // Invalid data for error testing
  if (options.invalid) {
    return {
      id: "", // Invalid: empty ID
      name: 123 as any, // Invalid: wrong type
      ...overrides
    };
  }

  // Complete data (all fields)
  return {
    ...minimal,
    description: `Test description ${timestamp}`,
    status: "active",
    metadata: { test: true, timestamp },
    tags: ["test", "integration"],
    ...overrides
  };
}
```

**Usage:**

```typescript
// Minimal data
const minimal = createTestResource({ minimal: true });

// Complete data
const complete = createTestResource({ complete: true });

// Invalid data for error testing
const invalid = createTestResource({ invalid: true });

// Custom data
const custom = createTestResource({}, { name: "Custom Name" });
```

### Nested Resource Factories

For resources with relationships:

```typescript
export function createTestModule(
  overrides?: Partial<ModuleInput>
): ModuleInput {
  const timestamp = Date.now();
  return {
    id: `test-module-${timestamp}`,
    name: `Test Module ${timestamp}`,
    ...overrides
  };
}

export function createTestDocument(
  moduleId: string,
  overrides?: Partial<DocumentInput>
): DocumentInput {
  const timestamp = Date.now();
  return {
    id: `test-document-${timestamp}`,
    moduleId, // Parent relationship
    content: `Test document content ${timestamp}`,
    ...overrides
  };
}
```

**Usage:**

```typescript
// Create parent and child
const module = createTestModule();
const document = createTestDocument(module.id);
```

## Response Validation Pattern

Validate API responses to ensure correct structure and data types.

### Generic Validation Function

```typescript
/**
 * Validate object against a schema
 * 
 * @param obj - Object to validate
 * @param schema - Schema definition
 * @param objName - Name for error messages
 */
export function validateSchema(
  obj: any,
  schema: SchemaDefinition,
  objName: string = "Object"
): void {
  if (!obj || typeof obj !== "object") {
    throw new Error(`${objName} must be an object`);
  }

  // Check required fields
  for (const field of schema.required || []) {
    if (!(field in obj)) {
      throw new Error(`${objName} missing required field: ${field}`);
    }
  }

  // Validate field types
  for (const [field, type] of Object.entries(schema.fields || {})) {
    if (field in obj) {
      validateFieldType(obj[field], type, `${objName}.${field}`);
    }
  }
}

function validateFieldType(value: any, type: string, fieldName: string): void {
  const actualType = Array.isArray(value) ? "array" : typeof value;
  
  if (actualType !== type && value !== null && value !== undefined) {
    throw new Error(
      `${fieldName} must be ${type}, got ${actualType}`
    );
  }
}
```

### Resource-Specific Validators

```typescript
/**
 * Validate resource response structure
 */
export function validateResourceResponse(resource: any): void {
  const schema: SchemaDefinition = {
    required: ["id", "name", "status", "createdAt", "updatedAt"],
    fields: {
      id: "string",
      name: "string",
      description: "string",
      status: "string",
      createdAt: "string",
      updatedAt: "string",
      deletedAt: "string", // Optional, can be null
      metadata: "object"
    }
  };

  validateSchema(resource, schema, "Resource");

  // Additional validation
  if (resource.createdAt) {
    const date = new Date(resource.createdAt);
    if (isNaN(date.getTime())) {
      throw new Error("Resource createdAt must be valid ISO date string");
    }
  }
}
```

### List Response Validation

```typescript
/**
 * Validate paginated list response
 */
export function validateListResponse(
  response: any,
  itemValidator: (item: any) => void
): void {
  if (!response || typeof response !== "object") {
    throw new Error("List response must be an object");
  }

  if (!("items" in response)) {
    throw new Error("List response missing required field: items");
  }

  if (!Array.isArray(response.items)) {
    throw new Error("List response items must be an array");
  }

  // Validate each item
  response.items.forEach((item: any, index: number) => {
    try {
      itemValidator(item);
    } catch (error: any) {
      throw new Error(`List item ${index} validation failed: ${error.message}`);
    }
  });

  // Validate pagination fields if present
  if ("nextToken" in response && typeof response.nextToken !== "string") {
    throw new Error("List response nextToken must be a string");
  }
}
```

## Async Waiting Pattern

Wait for eventually-consistent operations to complete.

### Generic Wait Function

```typescript
/**
 * Wait for a condition to become true
 * 
 * @param checkFn - Function that returns true when condition is met
 * @param timeoutMs - Maximum time to wait (default: 30s)
 * @param pollIntervalMs - Time between checks (default: 1s)
 * @param description - Description for error messages
 */
export async function waitFor(
  checkFn: () => Promise<boolean>,
  timeoutMs: number = 30000,
  pollIntervalMs: number = 1000,
  description: string = "condition"
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const result = await checkFn();
      if (result) {
        return; // Success
      }
    } catch (error) {
      // Ignore errors during polling, continue waiting
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  const elapsed = Date.now() - startTime;
  throw new Error(
    `Timeout waiting for ${description} after ${elapsed}ms ` +
    `(timeout: ${timeoutMs}ms, poll interval: ${pollIntervalMs}ms)`
  );
}
```

**Usage:**

```typescript
// Wait for resource to exist
await waitFor(
  async () => {
    const response = await getResource(resourceId);
    return response.statusCode === 200;
  },
  30000, // 30s timeout
  1000,  // 1s poll interval
  "resource to be created"
);
```

### Specialized Wait Functions

```typescript
/**
 * Wait for resource to reach expected status
 */
export async function waitForResourceStatus(
  getResourceFn: () => Promise<Resource>,
  expectedStatus: string,
  timeoutMs: number = 30000
): Promise<Resource> {
  let lastResource: Resource | null = null;

  await waitFor(
    async () => {
      lastResource = await getResourceFn();
      return lastResource.status === expectedStatus;
    },
    timeoutMs,
    1000,
    `resource status to be ${expectedStatus}`
  );

  return lastResource!;
}

/**
 * Wait for resource to be deleted
 */
export async function waitForResourceDeleted(
  getResourceFn: () => Promise<{ statusCode: number }>,
  timeoutMs: number = 30000
): Promise<void> {
  await waitFor(
    async () => {
      try {
        const response = await getResourceFn();
        return response.statusCode === 404;
      } catch (error: any) {
        // Resource not found is what we want
        return error.statusCode === 404;
      }
    },
    timeoutMs,
    1000,
    "resource to be deleted"
  );
}
```

## Resource Tracking Pattern

Simplify garbage collector usage with wrapper functions.

### Tracking Wrappers

```typescript
/**
 * Track resource for cleanup
 * 
 * @param garbageCollector - Garbage collector instance
 * @param resourceId - Resource identifier
 */
export function trackResource(
  garbageCollector: GarbageCollector,
  resourceId: string
): void {
  garbageCollector.track({ id: resourceId, type: "resource" });
}

/**
 * Create resource and automatically track for cleanup
 * 
 * @param createFn - Function to create resource
 * @param garbageCollector - Garbage collector instance
 * @returns Created resource
 */
export async function createAndTrack<T extends { id: string }>(
  createFn: () => Promise<T>,
  garbageCollector: GarbageCollector
): Promise<T> {
  const resource = await createFn();
  trackResource(garbageCollector, resource.id);
  return resource;
}
```

**Usage:**

```typescript
// Manual tracking
const resource = await createResource(data);
trackResource(garbageCollector, resource.id);

// Automatic tracking
const resource = await createAndTrack(
  () => createResource(data),
  garbageCollector
);
```

## Request Execution Pattern

Abstract common API request logic.

### Generic Request Wrapper

```typescript
/**
 * Execute API request with common error handling
 * 
 * @param requestFn - Function that makes the request
 * @returns Response with parsed body
 */
export async function executeRequest<T>(
  requestFn: () => Promise<{ statusCode: number; body: any }>
): Promise<{ statusCode: number; body: T }> {
  try {
    const response = await requestFn();
    
    // Parse body if string
    let parsedBody = response.body;
    if (typeof response.body === "string") {
      try {
        parsedBody = JSON.parse(response.body);
      } catch {
        // Body is not JSON, use as-is
      }
    }

    return {
      statusCode: response.statusCode,
      body: parsedBody
    };
  } catch (error: any) {
    // Standardize error handling
    throw new Error(
      `API request failed: ${error.message}`,
      { cause: error }
    );
  }
}
```

### Retry Pattern

```typescript
/**
 * Retry a request with exponential backoff
 * 
 * @param requestFn - Function that makes the request
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param baseDelayMs - Base delay between retries (default: 1000ms)
 */
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (error.statusCode >= 400 && error.statusCode < 500) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      const delay = baseDelayMs * Math.pow(2, attempt);
      const jitter = Math.random() * 0.3 * delay; // ±30% jitter
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }

  throw new Error(
    `Request failed after ${maxRetries + 1} attempts: ${lastError!.message}`
  );
}
```

## Assertion Helpers

Custom assertions for common test scenarios.

### Response Assertions

```typescript
/**
 * Assert response has expected status code
 */
export function assertStatusCode(
  response: { statusCode: number },
  expected: number
): void {
  if (response.statusCode !== expected) {
    throw new Error(
      `Expected status code ${expected}, got ${response.statusCode}`
    );
  }
}

/**
 * Assert response is successful (2xx)
 */
export function assertSuccess(response: { statusCode: number }): void {
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(
      `Expected successful response (2xx), got ${response.statusCode}`
    );
  }
}

/**
 * Assert response body contains expected fields
 */
export function assertHasFields(
  obj: any,
  fields: string[]
): void {
  const missing = fields.filter(field => !(field in obj));
  if (missing.length > 0) {
    throw new Error(
      `Object missing required fields: ${missing.join(", ")}`
    );
  }
}
```

## Test Organization Pattern

Structure tests for clarity and maintainability.

### AAA Pattern (Arrange, Act, Assert)

```typescript
it("should create a resource successfully", async () => {
  // Arrange: Set up test data
  const testData = createTestResource();
  const expectedName = testData.name;

  // Act: Perform the operation
  const response = await createResource(testData);

  // Assert: Verify results
  expect(response.statusCode).toBe(201);
  expect(response.body.name).toBe(expectedName);
  validateResourceResponse(response.body);

  // Cleanup: Track for garbage collection
  trackResource(garbageCollector, response.body.id);
});
```

### Descriptive Test Names

```typescript
// ✅ Good - Describes behavior and context
it("should return 400 when creating resource with invalid name type", async () => {
  // ...
});

// ✅ Good - Clear what success looks like
it("should include all required fields in created resource response", async () => {
  // ...
});

// ❌ Bad - Too vague
it("should work", async () => {
  // ...
});

// ❌ Bad - Tests implementation, not behavior
it("should call createResource function", async () => {
  // ...
});
```

## Complete Example

Putting it all together:

```typescript
import { TestSetup } from "./utils/test-setup";
import {
  createTestResource,
  validateResourceResponse,
  waitForResourceStatus,
  createAndTrack,
  assertSuccess
} from "./utils/test-helpers";

describe("Resource API Integration Tests", () => {
  let testSetup: TestSetup;

  beforeAll(async () => {
    testSetup = new TestSetup();
    await testSetup.setup();
  });

  afterAll(async () => {
    await testSetup.teardown();
  });

  afterEach(async () => {
    await testSetup.cleanup();
  });

  it("should create and process resource end-to-end", async () => {
    // Arrange
    const testData = createTestResource({
      name: "Integration Test Resource"
    });

    // Act: Create
    const createResponse = await createResource(
      testSetup.resourceConfig!.apiUrl,
      testData
    );

    // Assert: Creation successful
    assertSuccess(createResponse);
    validateResourceResponse(createResponse.body);
    
    // Track for cleanup
    trackResource(testSetup.garbageCollector, createResponse.body.id);

    // Act: Wait for processing
    const processedResource = await waitForResourceStatus(
      () => getResource(createResponse.body.id),
      "processed",
      30000
    );

    // Assert: Processing completed
    expect(processedResource.status).toBe("processed");
    expect(processedResource.processedAt).toBeDefined();
  });
});
```

## Best Practices

1. **Keep Helpers Generic**: Focus on patterns, not specific business logic
2. **Use TypeScript**: Type safety catches errors early
3. **Provide Defaults**: Make helpers easy to use with sensible defaults
4. **Support Overrides**: Allow customization when needed
5. **Clear Error Messages**: Help debug test failures quickly
6. **Document Parameters**: JSDoc comments explain usage
7. **Test Helpers**: Unit test complex helpers
8. **Organize by Category**: Group related helpers together

## Related Documentation

- [Test Infrastructure](./integration-testing-infrastructure.md) - Test setup and garbage collection
- [API Gateway Testing](./integration-testing-api-gateway.md) - API-specific patterns
- [Security Best Practices](./integration-testing-security.md) - IAM roles and credentials
- [Overview](./integration-testing.md) - Introduction to integration testing
