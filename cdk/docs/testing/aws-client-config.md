# AWS Client Configuration

## Overview

AWS clients are created with configurable endpoint and credentials. This allows tests to interact with local mock services (like LocalStack) instead of real AWS services, while production code connects to actual AWS.

## Principle

**Pass client configuration through a config object that supports both production and test environments:**

- Include endpoint and credentials in the config structure
- Use the same config structure in both production and test code
- Override the endpoint in tests to point to local services (LocalStack)
- Use safe test credentials to prevent accidental AWS calls

## Key Guidelines

1. **Use clientConfig pattern** - Standard structure for AWS client configuration
2. **Spread clientConfig** - Apply configuration when creating AWS clients
3. **Override in tests** - Point to LocalStack endpoint with test credentials
4. **Same structure everywhere** - Production and test use same config pattern

## Configuration Structure

### Type Definition

```typescript
// types.ts

/**
 * AWS Client configuration for testing and production
 */
export interface ClientConfig {
  endpoint?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

/**
 * Service configuration including AWS client config
 */
export interface ServiceConfig {
  resourceArn: string;
  region: string;
  clientConfig: ClientConfig;
}
```

### Provider Implementation

```typescript
// service-provider.ts

import { S3Client } from "@aws-sdk/client-s3";
import { ServiceConfig } from "./types";

export class ServiceProvider {
  private s3Client: S3Client;

  constructor(private readonly config: ServiceConfig) {
    // Use the clientConfig from the provided configuration
    this.s3Client = new S3Client({
      region: this.config.region,
      ...this.config.clientConfig, // Spreads endpoint and credentials if provided
    });
  }

  getS3Client(): S3Client {
    return this.s3Client;
  }

  async uploadFile(key: string, data: Buffer): Promise<void> {
    // Use the configured client
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.getBucketFromArn(this.config.resourceArn),
        Key: key,
        Body: data,
      }),
    );
  }

  private getBucketFromArn(arn: string): string {
    return arn.split(":").pop() || "";
  }
}
```

## Production Configuration

```typescript
// handler.ts (production)

import { ServiceProvider } from "./service-provider";

export async function handler(event: any, context: any): Promise<any> {
  // Production config - no endpoint override, uses default AWS endpoints
  const config = {
    resourceArn: process.env.RESOURCE_ARN!,
    region: process.env.AWS_REGION!,
    clientConfig: {}, // Empty in production - uses default AWS configuration
  };

  const provider = new ServiceProvider(config);

  // Provider now connects to real AWS services
  await provider.uploadFile("test.txt", Buffer.from("data"));
}
```

## Test Configuration

### Basic Test Setup

```typescript
// service-provider.test.ts

// Test Configuration Constants
const AWS_ENDPOINT = "http://localhost:5000";
const AWS_REGION = "us-east-1";
const AWS_ACCESS_KEY_ID = "testing";
const AWS_SECRET_ACCESS_KEY = "testing";
const TEST_BUCKET_ARN = `arn:aws:s3:::test-bucket`;

describe("ServiceProvider", () => {
  it("should create client with custom endpoint", () => {
    const config = {
      resourceArn: TEST_BUCKET_ARN,
      region: AWS_REGION,
      clientConfig: {
        endpoint: AWS_ENDPOINT, // LocalStack endpoint
        credentials: {
          accessKeyId: AWS_ACCESS_KEY_ID,
          secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
      },
    };

    const provider = new ServiceProvider(config);
    const client = provider.getS3Client();

    // Client is now configured to use LocalStack
    expect(client).toBeDefined();
  });
});
```

### Integration Test with LocalStack

```typescript
// service-provider.integration.test.ts

import { S3Client, CreateBucketCommand } from "@aws-sdk/client-s3";

// Test Configuration Constants
const AWS_ENDPOINT = "http://localhost:5000";
const AWS_REGION = "us-east-1";
const TEST_BUCKET = "test-bucket";

describe("ServiceProvider Integration Tests", () => {
  let s3Client: S3Client;

  beforeAll(async () => {
    // Create S3 client pointing to LocalStack
    s3Client = new S3Client({
      region: AWS_REGION,
      endpoint: AWS_ENDPOINT,
      credentials: {
        accessKeyId: "testing",
        secretAccessKey: "testing",
      },
      forcePathStyle: true, // Required for LocalStack S3
    });

    // Create test bucket in LocalStack
    await s3Client.send(new CreateBucketCommand({ Bucket: TEST_BUCKET }));
  });

  it("should upload file to LocalStack S3", async () => {
    const config = {
      resourceArn: `arn:aws:s3:::${TEST_BUCKET}`,
      region: AWS_REGION,
      clientConfig: {
        endpoint: AWS_ENDPOINT,
        credentials: {
          accessKeyId: "testing",
          secretAccessKey: "testing",
        },
      },
    };

    const provider = new ServiceProvider(config);

    // This will upload to LocalStack, not real AWS
    await provider.uploadFile("test.txt", Buffer.from("test data"));

    // Verify using direct S3 client
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: TEST_BUCKET,
        Key: "test.txt",
      }),
    );

    const data = await response.Body?.transformToString();
    expect(data).toBe("test data");
  });
});
```

## Multiple AWS Services

```typescript
// types.ts

export interface MultiServiceConfig {
  s3BucketArn: string;
  dynamoTableArn: string;
  secretArn: string;
  region: string;
  clientConfig: ClientConfig;
}

// multi-service-provider.ts

import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

export class MultiServiceProvider {
  private s3Client: S3Client;
  private dynamoClient: DynamoDBClient;
  private secretsClient: SecretsManagerClient;

  constructor(private readonly config: MultiServiceConfig) {
    // All clients use the same clientConfig
    this.s3Client = new S3Client({
      region: this.config.region,
      ...this.config.clientConfig,
    });

    this.dynamoClient = new DynamoDBClient({
      region: this.config.region,
      ...this.config.clientConfig,
    });

    this.secretsClient = new SecretsManagerClient({
      region: this.config.region,
      ...this.config.clientConfig,
    });
  }

  // Methods use the configured clients
}

// multi-service-provider.test.ts

describe("MultiServiceProvider", () => {
  it("should configure all clients for LocalStack", () => {
    const config = {
      s3BucketArn: "arn:aws:s3:::test-bucket",
      dynamoTableArn: "arn:aws:dynamodb:us-east-1:123456789012:table/test",
      secretArn: "arn:aws:secretsmanager:us-east-1:123456789012:secret:test",
      region: "us-east-1",
      clientConfig: {
        endpoint: "http://localhost:5000",
        credentials: {
          accessKeyId: "testing",
          secretAccessKey: "testing",
        },
      },
    };

    const provider = new MultiServiceProvider(config);

    // All clients now point to LocalStack
    expect(provider).toBeDefined();
  });
});
```

## Common Patterns

### Reusable Test Config

```typescript
// test/shared/test-config.ts

export const DEFAULT_TEST_CLIENT_CONFIG = {
  endpoint: "http://localhost:5000",
  credentials: {
    accessKeyId: "testing",
    secretAccessKey: "testing",
  },
};

export function createTestConfig(
  overrides: Partial<ServiceConfig> = {},
): ServiceConfig {
  return {
    resourceArn: "arn:aws:service:us-east-1:123456789012:resource/test",
    region: "us-east-1",
    clientConfig: DEFAULT_TEST_CLIENT_CONFIG,
    ...overrides,
  };
}

// Usage in tests
const config = createTestConfig({ resourceArn: "arn:aws:s3:::my-bucket" });
```

### Environment-Based Configuration

```typescript
// utils.ts

export function createClientConfig(): ClientConfig {
  // In tests, AWS_ENDPOINT_URL will be set to LocalStack
  const endpoint = process.env.AWS_ENDPOINT_URL;

  if (endpoint) {
    return {
      endpoint,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "testing",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "testing",
      },
    };
  }

  // Production - return empty config to use defaults
  return {};
}
```

## LocalStack-Specific Configuration

### S3 with Path Style

```typescript
const config = {
  resourceArn: TEST_BUCKET_ARN,
  region: AWS_REGION,
  clientConfig: {
    endpoint: AWS_ENDPOINT,
    credentials: {
      /* ... */
    },
    forcePathStyle: true, // Required for LocalStack S3
  },
};
```

### DynamoDB

```typescript
const config = {
  resourceArn: TEST_TABLE_ARN,
  region: AWS_REGION,
  clientConfig: {
    endpoint: AWS_ENDPOINT,
    credentials: {
      /* ... */
    },
  },
};
```

### RDS Data Service

```typescript
const config = {
  resourceArn: TEST_CLUSTER_ARN,
  secretArn: TEST_SECRET_ARN,
  region: AWS_REGION,
  clientConfig: {
    endpoint: AWS_ENDPOINT,
    credentials: {
      /* ... */
    },
  },
};
```

## Benefits

1. **Single Pattern** - Same config structure for all services
2. **Test/Prod Parity** - Code doesn't change between environments
3. **Safe Testing** - Test credentials prevent accidental AWS calls
4. **Flexibility** - Easy to switch between LocalStack and real AWS
5. **Clarity** - Configuration intent is explicit

## Next Steps

- For environment setup: See [Environment Variables and Constants](./environment-and-constants.md)
- For using with mocks: See [AWS SDK Mocking](./aws-sdk-mocking.md)
- For dependency injection: See [Dependency Injection](./dependency-injection.md)
