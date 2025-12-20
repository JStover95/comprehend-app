# Integration Test Infrastructure

This guide covers the infrastructure patterns for organizing and managing integration tests.

## Overview

Integration test infrastructure provides:

- **Test Setup**: Initialize AWS clients and load configuration
- **Resource Configuration**: Load resource identifiers from environment variables
- **Garbage Collection**: Track and clean up test artifacts
- **Helper Organization**: Structure reusable test utilities

## Test Structure

Recommended directory structure:

```plaintext
test/integration/
├── your-feature.test.ts           # Test file for a feature or service
├── another-feature.test.ts        # Additional test files as needed
└── utils/
    ├── test-setup.ts              # Test infrastructure initialization
    ├── garbage-collector.ts       # Resource tracking and cleanup
    ├── resource-config.ts         # Environment variable loading
    └── [feature]-helpers.ts       # Feature-specific helper functions
```

## Environment Variable Configuration

Integration tests use environment variables for all configuration. This approach is:

- **Explicit**: Configuration is clear and discoverable
- **Portable**: Works across different environments and CI/CD systems

### Resource Configuration Pattern

Create an interface for your resource configuration:

```typescript
// utils/resource-config.ts

export interface ResourceConfig {
  apiGatewayUrl: string;
  apiGatewayId: string;
  // Add other resources as needed
  databaseEndpoint?: string;
  bucketName?: string;
}

export function loadResourceConfig(): ResourceConfig {
  // Required environment variables
  const apiGatewayUrl = process.env.TEST_API_GATEWAY_URL;
  const apiGatewayId = process.env.TEST_API_GATEWAY_ID;

  if (!apiGatewayUrl) {
    throw new Error(
      "TEST_API_GATEWAY_URL environment variable is required. " +
      "Set it to your API Gateway endpoint URL."
    );
  }

  if (!apiGatewayId) {
    throw new Error(
      "TEST_API_GATEWAY_ID environment variable is required. " +
      "Set it to your API Gateway ID."
    );
  }

  // Optional environment variables with defaults
  const config: ResourceConfig = {
    apiGatewayUrl,
    apiGatewayId,
    databaseEndpoint: process.env.TEST_DATABASE_ENDPOINT,
    bucketName: process.env.TEST_BUCKET_NAME,
  };

  return config;
}
```

### Environment Variable Naming Convention

**All integration test environment variables MUST use the `TEST_` prefix:**

```bash
# ✅ Correct - Uses TEST_ prefix
export TEST_API_GATEWAY_URL="https://..."
export TEST_AWS_REGION="us-east-1"
export TEST_ASSUME_ROLE_ARN="arn:aws:iam::..."

# ❌ Incorrect - Missing TEST_ prefix
export API_GATEWAY_URL="https://..."
export AWS_REGION="us-east-1"
export ASSUME_ROLE_ARN="arn:aws:iam::..."
```

**Benefits:**

- Clearly separates test configuration from application configuration
- Prevents accidentally using production credentials or resources
- Makes test setup explicit and searchable
- Follows security best practices

### Required vs Optional Variables

Distinguish between required and optional variables:

```typescript
export function loadResourceConfig(): ResourceConfig {
  // Required - throw error if missing
  const requiredVar = getRequiredEnvVar("TEST_REQUIRED_RESOURCE");
  
  // Optional - provide default or leave undefined
  const optionalVar = process.env.TEST_OPTIONAL_RESOURCE || "default-value";
  
  return { requiredVar, optionalVar };
}

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} environment variable is required. ` +
      `Please set it before running integration tests.`
    );
  }
  return value;
}
```

## Test Setup Pattern

Create a centralized test setup class:

```typescript
// utils/test-setup.ts

import { LambdaClient } from "@aws-sdk/client-lambda";
import { GarbageCollector } from "./garbage-collector";
import { loadResourceConfig, ResourceConfig } from "./resource-config";

export interface TestAwsConfig {
  region?: string;
}

export class TestSetup {
  public readonly lambdaClient: LambdaClient;
  public readonly garbageCollector: GarbageCollector;
  public resourceConfig: ResourceConfig | null = null;

  private readonly region: string;

  constructor(config: TestAwsConfig = {}) {
    this.region = config.region || process.env.TEST_AWS_REGION || "us-east-1";

    // Initialize AWS clients
    this.lambdaClient = new LambdaClient({ region: this.region });

    // Initialize garbage collector
    this.garbageCollector = new GarbageCollector();
  }

  async setup(): Promise<void> {
    // Load resource configuration from environment variables
    this.resourceConfig = loadResourceConfig();
  }

  async teardown(): Promise<void> {
    // Optional: cleanup any global resources
    // Most resources are managed per-test via garbage collector
  }

  async reset(): Promise<void> {
    // Clear garbage collector tracking without cleanup
    // Allows tests to start fresh
    this.garbageCollector.clear();
  }

  async cleanup(): Promise<void> {
    // Clean up test artifacts
    await this.garbageCollector.cleanupAll();
  }
}
```

### Extending Test Setup for Additional Services

Extend the base test setup for projects using additional AWS services:

```typescript
export class ExtendedTestSetup extends TestSetup {
  public readonly s3Client: S3Client;
  public readonly dynamoDbClient: DynamoDBClient;

  constructor(config: TestAwsConfig = {}) {
    super(config);
    this.s3Client = new S3Client({ region: this.region });
    this.dynamoDbClient = new DynamoDBClient({ region: this.region });
  }
}
```

## Garbage Collector Pattern

The garbage collector tracks resources created during tests and provides cleanup functionality.

### Basic Implementation

```typescript
// utils/garbage-collector.ts

export class GarbageCollector {
  private resources: Array<ResourceIdentifier> = [];

  /**
   * Track a resource created during tests
   */
  track(resource: ResourceIdentifier): void {
    this.resources.push(resource);
  }

  /**
   * Clear all tracked resources without cleanup
   * Useful for resetting state between tests
   */
  clear(): void {
    this.resources = [];
  }

  /**
   * Clean up all tracked resources
   */
  async cleanupAll(): Promise<void> {
    for (const resource of this.resources) {
      try {
        await this.deleteResource(resource);
      } catch (error) {
        // Log but don't fail - resource may already be deleted
        console.warn(`Failed to delete resource ${resource.id}:`, error);
      }
    }

    this.clear();
  }

  /**
   * Get list of tracked resources
   */
  getTrackedResources(): Array<ResourceIdentifier> {
    return [...this.resources];
  }

  /**
   * Delete a single resource
   * Implement based on your API/service
   */
  private async deleteResource(resource: ResourceIdentifier): Promise<void> {
    // Delegate to your API or AWS SDK
    // Example: await apiClient.delete(resource.id);
  }
}
```

### Resource-Specific Garbage Collectors

Create specific garbage collectors for different resource types:

```typescript
// For API resources
export class ApiGarbageCollector {
  private modules: Array<{ moduleId: string }> = [];
  private documents: Array<{ moduleId: string; documentId: string }> = [];

  trackModule(moduleId: string): void {
    this.modules.push({ moduleId });
  }

  trackDocument(moduleId: string, documentId: string): void {
    this.documents.push({ moduleId, documentId });
  }

  async cleanupAll(): Promise<void> {
    // Delete documents first (dependent resources)
    for (const doc of this.documents) {
      await deleteDocument(doc.moduleId, doc.documentId);
    }

    // Delete modules (parent resources)
    for (const module of this.modules) {
      await deleteModule(module.moduleId);
    }

    this.clear();
  }

  clear(): void {
    this.modules = [];
    this.documents = [];
  }
}
```

### S3 Garbage Collector

For tests that create S3 objects:

```typescript
export class S3GarbageCollector {
  private objects: Array<{ bucket: string; key: string }> = [];
  private prefixes: Array<{ bucket: string; prefix: string }> = [];

  constructor(private s3Client: S3Client) {}

  trackObject(bucket: string, key: string): void {
    this.objects.push({ bucket, key });
  }

  trackPrefix(bucket: string, prefix: string): void {
    this.prefixes.push({ bucket, prefix });
  }

  async cleanupAll(): Promise<void> {
    // Delete individual objects
    for (const obj of this.objects) {
      try {
        await this.s3Client.send(new DeleteObjectCommand({
          Bucket: obj.bucket,
          Key: obj.key
        }));
      } catch (error) {
        console.warn(`Failed to delete S3 object ${obj.key}:`, error);
      }
    }

    // Delete objects with tracked prefixes
    for (const prefix of this.prefixes) {
      try {
        const objects = await this.listObjects(prefix.bucket, prefix.prefix);
        for (const key of objects) {
          await this.s3Client.send(new DeleteObjectCommand({
            Bucket: prefix.bucket,
            Key: key
          }));
        }
      } catch (error) {
        console.warn(`Failed to delete S3 prefix ${prefix.prefix}:`, error);
      }
    }

    this.clear();
  }
}
```

## Using Test Infrastructure

### In Test Files

```typescript
import { TestSetup } from "./utils/test-setup";

describe("Feature Integration Tests", () => {
  let testSetup: TestSetup;

  beforeAll(async () => {
    // Initialize test setup
    testSetup = new TestSetup({
      region: process.env.TEST_AWS_REGION
    });
    await testSetup.setup();
  });

  afterAll(async () => {
    // Optional teardown
    await testSetup.teardown();
  });

  beforeEach(async () => {
    // Reset state between tests
    await testSetup.reset();
  });

  afterEach(async () => {
    // Clean up test artifacts
    await testSetup.cleanup();
  });

  it("should test something", async () => {
    // Use testSetup.resourceConfig for endpoints
    // Use testSetup.garbageCollector to track resources
    // Use testSetup.lambdaClient (or other clients) for AWS operations
  });
});
```

## Helper Function Organization

Organize helper functions by category:

```typescript
// utils/api-helpers.ts - API-specific operations
export async function makeApiRequest(...) { }
export function createTestResource(...) { }
export function validateResponse(...) { }

// utils/data-helpers.ts - Test data creation
export function createTestData(...) { }
export function generateTestPayload(...) { }

// utils/wait-helpers.ts - Async operations
export async function waitFor(...) { }
export async function pollUntil(...) { }
```

## Best Practices

1. **Configure via Environment Variables**: Always prefix integration test environment variables with `TEST_`
2. **Fail Fast**: Throw clear errors for missing required environment variables
3. **Centralize Setup**: Use a test setup class to manage AWS clients and configuration
4. **Track All Resources**: Track every resource created during tests for cleanup
5. **Clear Error Messages**: Provide helpful error messages with setup instructions
6. **Modular Design**: Create separate utilities for different concerns (API, data, waiting)
7. **Extensible Pattern**: Design setup classes that can be extended for additional services

## Troubleshooting

### Missing Environment Variables

```plaintext
Error: TEST_API_GATEWAY_URL environment variable is required
```

**Solution**: Set the required environment variable:

```bash
export TEST_API_GATEWAY_URL="https://abc123.execute-api.us-east-1.amazonaws.com/dev"
```

### Cleanup Failures

```plaintext
Warning: Failed to delete resource test-resource-123
```

**Causes:**

- Resource was already deleted (by test or manually)
- Insufficient permissions to delete resource
- Resource is in use or locked

**Solution**: Garbage collector logs warnings but continues. Verify permissions and check for resource dependencies.

### Test Isolation Issues

```plaintext
Test fails when run with other tests but passes in isolation
```

**Solution:**

- Ensure `beforeEach` calls `testSetup.reset()`
- Ensure `afterEach` calls `testSetup.cleanup()`
- Check for shared state between tests
- Use unique identifiers for test resources

## Related Documentation

- [API Gateway Testing](./integration-testing-api-gateway.md) - Testing REST APIs
- [Security Best Practices](./integration-testing-security.md) - IAM roles and credentials
- [Helper Patterns](./integration-testing-patterns.md) - Reusable test utilities
- [Overview](./integration-testing.md) - Introduction to integration testing
