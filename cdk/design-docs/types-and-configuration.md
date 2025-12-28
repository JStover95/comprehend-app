# Types and Configuration

This document describes the design patterns for types, interfaces, and configuration in this project.

## Table of Contents

- [Type Definition Principles](#type-definition-principles)
- [Configuration Pattern](#configuration-pattern)
- [Complete Example](#complete-example)

---

## Type Definition Principles

### Type Definition Principle

Types are clearly defined and documented. Each type should have JSDoc comments describing its purpose and the meaning of each property.

**Key Guidelines:**

- Use TypeScript interfaces for object shapes
- Document each interface with a JSDoc comment
- Document each property with `@param` tags (even though they're properties)
- Use meaningful, descriptive names
- Prefer explicit types over implicit ones
- Group related types together

### Example

```typescript
// types.ts

/**
 * Status of a response - either success or failure
 */
export type ResponseStatus = "SUCCESS" | "FAILED";

/**
 * Data that can be returned in a response - either a string message or structured data
 */
export type ResponseData = string | Record<string, unknown>;

/**
 * A standardized response object for API operations
 * @param status - The status of the operation (SUCCESS or FAILED)
 * @param message - Optional human-readable message describing the result
 * @param data - The payload data of the response
 * @param timestamp - ISO timestamp when the response was created
 */
export interface ApiResponse {
  status: ResponseStatus;
  message?: string;
  data: ResponseData;
  timestamp: string;
}

/**
 * Credentials for database authentication
 * @param username - The database username
 * @param password - The database password
 */
export interface DatabaseCredentials {
  username: string;
  password: string;
}

/**
 * Configuration for database connection pooling
 * @param host - The database host address
 * @param port - The database port number
 * @param database - The name of the database to connect to
 * @param user - The username for authentication
 * @param password - The password for authentication
 * @param ssl - SSL/TLS configuration for secure connections
 * @param maxConnections - Maximum number of connections in the pool
 * @param idleTimeout - Time in milliseconds before idle connections are closed
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: {
    rejectUnauthorized: boolean;
    ca?: string;
  };
  maxConnections: number;
  idleTimeout: number;
}

/**
 * Configuration for external service integration
 * @param apiKey - API key for authentication
 * @param endpoint - Base URL of the service API
 * @param timeout - Request timeout in milliseconds
 * @param retryAttempts - Number of retry attempts on failure
 * @param retryDelay - Delay between retries in milliseconds
 */
export interface ServiceConfig {
  apiKey: string;
  endpoint: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Result of a processing operation
 * @param success - Whether the operation succeeded
 * @param resourceId - ID of the resource that was processed
 * @param message - Human-readable status message
 * @param details - Optional additional details about the operation
 * @param errors - Optional array of error messages if the operation failed
 */
export interface ProcessingResult {
  success: boolean;
  resourceId: string;
  message: string;
  details?: Record<string, any>;
  errors?: string[];
}
```

### Benefits of Well-Documented Types

1. **Self-documenting code**: Types serve as inline documentation
2. **IDE support**: Better autocomplete and inline help
3. **Reduced errors**: Clear contracts between components
4. **Easier onboarding**: New developers can understand interfaces quickly
5. **Type safety**: Compile-time checking prevents many bugs

---

## Configuration Pattern

### Configuration Pattern Principle

Environment configuration always includes `clientConfig`, which can be used during tests to override AWS client configuration with a custom endpoint. This enables testing against local mock services like LocalStack.

**Key Guidelines:**

- Always include a `clientConfig` property in your environment configuration
- Make `clientConfig` properties optional (with `?`) so they're not required in production
- Include both `endpoint` and `credentials` in `clientConfig` for maximum flexibility
- Use this pattern consistently across all services and agents

### Configuration Structure

```typescript
// types.ts

/**
 * Base configuration for AWS client initialization
 * Used to override default AWS SDK configuration in tests
 * @param endpoint - Optional custom endpoint URL (e.g., for LocalStack)
 * @param credentials - Optional explicit credentials for testing
 */
export interface ClientConfig {
  endpoint?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

/**
 * Environment configuration for the service
 * @param resourceArn - ARN of the AWS resource to operate on
 * @param region - AWS region where resources are located
 * @param environment - Deployment environment (dev, staging, prod)
 * @param clientConfig - AWS client configuration overrides for testing
 */
export interface EnvironmentConfig {
  resourceArn: string;
  region: string;
  environment: string;
  clientConfig: ClientConfig;
}
```

### Using Configuration in Providers

```typescript
// storage-provider.ts

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { EnvironmentConfig } from "./types";

/**
 * Provider for S3 storage operations
 */
export class StorageProvider {
  private s3Client: S3Client;

  constructor(private readonly config: EnvironmentConfig) {
    // Initialize S3 client with configuration
    // The clientConfig spread will include endpoint and credentials if provided
    this.s3Client = new S3Client({
      region: this.config.region,
      ...this.config.clientConfig, // Spreads endpoint and credentials for testing
    });
  }

  async uploadFile(key: string, data: Buffer): Promise<void> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.extractBucketFromArn(this.config.resourceArn),
        Key: key,
        Body: data,
      }),
    );
  }

  async downloadFile(key: string): Promise<Buffer> {
    const response = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.extractBucketFromArn(this.config.resourceArn),
        Key: key,
      }),
    );

    return Buffer.from(await response.Body!.transformToByteArray());
  }

  private extractBucketFromArn(arn: string): string {
    // Parse bucket name from ARN
    return arn.split(":").pop()!;
  }
}
```

### Using Configuration in Tests

```typescript
// storage-provider.test.ts

import { StorageProvider } from "./storage-provider";
import { EnvironmentConfig } from "./types";
import { S3Client } from "@aws-sdk/client-s3";

describe("StorageProvider", () => {
  const testConfig: EnvironmentConfig = {
    resourceArn: "arn:aws:s3:::test-bucket",
    region: "us-east-1",
    environment: "test",
    clientConfig: {
      // Override endpoint to use LocalStack
      endpoint: "http://localhost:5000",
      credentials: {
        accessKeyId: "testing",
        secretAccessKey: "testing",
      },
    },
  };

  it("should initialize with custom endpoint", () => {
    const provider = new StorageProvider(testConfig);

    // Provider is now configured to use LocalStack
    expect(provider).toBeDefined();
  });

  it("should upload and download files", async () => {
    const provider = new StorageProvider(testConfig);

    const testData = Buffer.from("test content");
    await provider.uploadFile("test.txt", testData);

    const downloaded = await provider.downloadFile("test.txt");
    expect(downloaded.toString()).toBe("test content");
  });
});
```

### Production Configuration

```typescript
// utils.ts

import { CloudFormationCustomResourceEvent } from "aws-lambda";
import { EnvironmentConfig } from "./types";

/**
 * Validates and extracts environment configuration
 * In production, clientConfig will have undefined values
 * In tests, clientConfig will be populated with LocalStack endpoint
 */
export function validateEnvironment(
  event: CloudFormationCustomResourceEvent,
): EnvironmentConfig {
  // Required environment variables
  const resourceArn =
    process.env.RESOURCE_ARN || event.ResourceProperties.ResourceArn;

  const region = process.env.AWS_REGION || "us-east-1";
  const environment = process.env.ENVIRONMENT || "production";

  if (!resourceArn) {
    throw new Error("RESOURCE_ARN is required");
  }

  // Build client configuration for AWS SDK
  const clientConfig: any = {};

  // Override endpoint for local testing (LocalStack)
  if (process.env.AWS_ENDPOINT_URL) {
    clientConfig.endpoint = process.env.AWS_ENDPOINT_URL;
  }

  // Override credentials for local testing
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }

  return {
    resourceArn,
    region,
    environment,
    clientConfig,
  };
}
```

### Multiple AWS Services

When working with multiple AWS services, the pattern scales naturally:

```typescript
// types.ts

export interface EnvironmentConfig {
  resourceArn: string;
  tableName: string;
  queueUrl: string;
  region: string;
  environment: string;
  clientConfig: ClientConfig; // Same clientConfig used for all services
}

// providers.ts

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SQSClient } from "@aws-sdk/client-sqs";
import { S3Client } from "@aws-sdk/client-s3";
import { EnvironmentConfig } from "./types";

export class DynamoDbProvider {
  private client: DynamoDBClient;

  constructor(config: EnvironmentConfig) {
    this.client = new DynamoDBClient({
      region: config.region,
      ...config.clientConfig, // Same clientConfig pattern
    });
  }
}

export class SqsProvider {
  private client: SQSClient;

  constructor(config: EnvironmentConfig) {
    this.client = new SQSClient({
      region: config.region,
      ...config.clientConfig, // Same clientConfig pattern
    });
  }
}

export class S3Provider {
  private client: S3Client;

  constructor(config: EnvironmentConfig) {
    this.client = new S3Client({
      region: config.region,
      ...config.clientConfig, // Same clientConfig pattern
    });
  }
}
```

---

## Complete Example

Here's a complete example showing types, configuration, and usage:

```typescript
// ====================================
// types.ts - Type Definitions
// ====================================

/**
 * Base configuration for AWS client initialization
 * @param endpoint - Optional custom endpoint URL (e.g., for LocalStack)
 * @param credentials - Optional explicit credentials for testing
 */
export interface ClientConfig {
  endpoint?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

/**
 * Environment configuration for the document processing service
 * @param secretArn - ARN of the Secrets Manager secret containing credentials
 * @param clusterEndpoint - RDS Aurora cluster endpoint
 * @param bucketName - S3 bucket name for document storage
 * @param tableName - DynamoDB table name for metadata
 * @param region - AWS region where resources are located
 * @param environment - Deployment environment (dev, staging, prod)
 * @param clientConfig - AWS client configuration overrides for testing
 */
export interface ServiceConfig {
  secretArn: string;
  clusterEndpoint: string;
  bucketName: string;
  tableName: string;
  region: string;
  environment: string;
  clientConfig: ClientConfig;
}

/**
 * Document metadata
 * @param id - Unique document identifier
 * @param name - Document name
 * @param type - Document MIME type
 * @param size - Document size in bytes
 * @param uploadedAt - ISO timestamp of upload
 * @param tags - Optional metadata tags
 */
export interface DocumentMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  tags?: Record<string, string>;
}

/**
 * Processing result for a document operation
 * @param success - Whether the operation succeeded
 * @param documentId - ID of the processed document
 * @param message - Human-readable status message
 * @param metadata - Optional document metadata
 */
export interface ProcessingResult {
  success: boolean;
  documentId: string;
  message: string;
  metadata?: DocumentMetadata;
}

// ====================================
// utils.ts - Configuration Validation
// ====================================

import { CloudFormationCustomResourceEvent } from "aws-lambda";
import { ServiceConfig, ClientConfig } from "./types";

/**
 * Validates environment and builds service configuration
 */
export function validateEnvironment(
  event: CloudFormationCustomResourceEvent,
): ServiceConfig {
  // Required configuration
  const secretArn =
    process.env.SECRET_ARN || event.ResourceProperties.SecretArn;
  const clusterEndpoint =
    process.env.CLUSTER_ENDPOINT || event.ResourceProperties.ClusterEndpoint;
  const bucketName =
    process.env.BUCKET_NAME || event.ResourceProperties.BucketName;
  const tableName =
    process.env.TABLE_NAME || event.ResourceProperties.TableName;

  // Optional with defaults
  const region = process.env.AWS_REGION || "us-east-1";
  const environment = process.env.ENVIRONMENT || "production";

  // Validation
  if (!secretArn) throw new Error("SECRET_ARN is required");
  if (!clusterEndpoint) throw new Error("CLUSTER_ENDPOINT is required");
  if (!bucketName) throw new Error("BUCKET_NAME is required");
  if (!tableName) throw new Error("TABLE_NAME is required");

  // Build client configuration
  const clientConfig: ClientConfig = {};

  if (process.env.AWS_ENDPOINT_URL) {
    clientConfig.endpoint = process.env.AWS_ENDPOINT_URL;
  }

  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }

  return {
    secretArn,
    clusterEndpoint,
    bucketName,
    tableName,
    region,
    environment,
    clientConfig,
  };
}

// ====================================
// storage-provider.ts - Using Config
// ====================================

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { ServiceConfig, DocumentMetadata } from "./types";

export class StorageProvider {
  private s3Client: S3Client;

  constructor(private readonly config: ServiceConfig) {
    this.s3Client = new S3Client({
      region: this.config.region,
      ...this.config.clientConfig, // Spreads endpoint and credentials
    });
  }

  async storeDocument(
    documentId: string,
    data: Buffer,
    metadata: DocumentMetadata,
  ): Promise<void> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: documentId,
        Body: data,
        Metadata: {
          name: metadata.name,
          type: metadata.type,
          uploadedAt: metadata.uploadedAt,
        },
      }),
    );
  }
}

// ====================================
// metadata-provider.ts - Using Config
// ====================================

import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { ServiceConfig, DocumentMetadata } from "./types";

export class MetadataProvider {
  private dynamoClient: DynamoDBClient;

  constructor(private readonly config: ServiceConfig) {
    this.dynamoClient = new DynamoDBClient({
      region: this.config.region,
      ...this.config.clientConfig, // Spreads endpoint and credentials
    });
  }

  async saveMetadata(metadata: DocumentMetadata): Promise<void> {
    await this.dynamoClient.send(
      new PutItemCommand({
        TableName: this.config.tableName,
        Item: {
          id: { S: metadata.id },
          name: { S: metadata.name },
          type: { S: metadata.type },
          size: { N: metadata.size.toString() },
          uploadedAt: { S: metadata.uploadedAt },
        },
      }),
    );
  }
}

// ====================================
// agent.ts - Using Providers
// ====================================

import { ServiceConfig, DocumentMetadata, ProcessingResult } from "./types";
import { StorageProvider } from "./storage-provider";
import { MetadataProvider } from "./metadata-provider";

export class DocumentAgent {
  constructor(
    private readonly config: ServiceConfig,
    private readonly storageProvider: StorageProvider,
    private readonly metadataProvider: MetadataProvider,
  ) {}

  async processDocument(
    documentId: string,
    data: Buffer,
    metadata: DocumentMetadata,
  ): Promise<ProcessingResult> {
    // Store document
    await this.storageProvider.storeDocument(documentId, data, metadata);

    // Save metadata
    await this.metadataProvider.saveMetadata(metadata);

    return {
      success: true,
      documentId,
      message: "Document processed successfully",
      metadata,
    };
  }
}

// ====================================
// agent.test.ts - Testing with Config
// ====================================

import { ServiceConfig } from "./types";
import { DocumentAgent } from "./agent";
import { StorageProvider } from "./storage-provider";
import { MetadataProvider } from "./metadata-provider";

describe("DocumentAgent", () => {
  const testConfig: ServiceConfig = {
    secretArn: "arn:aws:secretsmanager:us-east-1:123456789012:secret:test",
    clusterEndpoint: "test-cluster.us-east-1.rds.amazonaws.com",
    bucketName: "test-bucket",
    tableName: "test-table",
    region: "us-east-1",
    environment: "test",
    clientConfig: {
      // LocalStack configuration for testing
      endpoint: "http://localhost:5000",
      credentials: {
        accessKeyId: "testing",
        secretAccessKey: "testing",
      },
    },
  };

  it("should process document with test configuration", async () => {
    // All AWS clients will use LocalStack endpoint
    const storageProvider = new StorageProvider(testConfig);
    const metadataProvider = new MetadataProvider(testConfig);
    const agent = new DocumentAgent(
      testConfig,
      storageProvider,
      metadataProvider,
    );

    const metadata = {
      id: "doc-123",
      name: "test.pdf",
      type: "application/pdf",
      size: 1024,
      uploadedAt: new Date().toISOString(),
    };

    const result = await agent.processDocument(
      "doc-123",
      Buffer.from("test"),
      metadata,
    );

    expect(result.success).toBe(true);
    expect(result.documentId).toBe("doc-123");
  });
});
```

---

## Summary

The types and configuration pattern provides:

1. **Clear type definitions** with comprehensive documentation
2. **Consistent configuration structure** across all services
3. **Testing support** through `clientConfig` that enables LocalStack integration
4. **Type safety** ensuring proper usage throughout the codebase
5. **Self-documenting code** through JSDoc comments
6. **Flexible AWS client initialization** that works in both production and test environments

This pattern makes the codebase maintainable, testable, and easy to understand for new contributors.
