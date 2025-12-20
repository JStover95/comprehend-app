# Design Documentation

This directory contains documentation on the design patterns and architectural decisions used in this project. These patterns are meant to guide future contributions and ensure consistency across the codebase.

## Table of Contents

- [Overview](#overview)
- [Documentation Structure](#documentation-structure)
- [Quick Start](#quick-start)
- [When to Use These Patterns](#when-to-use-these-patterns)

## Overview

This project follows a structured approach to building AWS Lambda functions and agents. The patterns documented here were developed to maximize:

- **Testability**: Easy to write comprehensive tests
- **Maintainability**: Clear structure that's easy to understand and modify
- **Consistency**: Similar patterns across different components
- **Type Safety**: Strong typing with TypeScript
- **Observability**: Clear logging and error handling

## Documentation Structure

### [Testing Strategy](./testing/)

Comprehensive guide to testing patterns used in this project, organized into focused documents:

**Unit Testing:**

- **[Summary](./testing/summary.md)** - Overview and quick navigation for all testing topics
- **[Mocking Strategy](./testing/mocking-strategy.md)** - Principles for what and how to mock
- **[Environment Variables and Constants](./testing/environment-and-constants.md)** - Test configuration setup
- **[Factory Pattern for Mocks](./testing/factory-pattern.md)** - Creating reusable mock factories
- **[AWS SDK Mocking](./testing/aws-sdk-mocking.md)** - Mocking AWS SDK clients and provider wrappers
- **[AWS Client Configuration](./testing/aws-client-config.md)** - Configuring AWS clients for LocalStack
- **[Dependency Injection](./testing/dependency-injection.md)** - Using constructor injection for testability
- **[Handler Testing](./testing/handler-testing.md)** - Testing Lambda handler entrypoints
- **[Integration Testing](./testing/integration-testing.md)** - End-to-end testing against live AWS resources

**Integration Testing:**

- **[Integration Testing](./testing/integration-testing.md)** - Quick start and introduction
- **[API Gateway Testing](./testing/integration-testing-api-gateway.md)** - Testing REST APIs with IAM authentication
- **[Test Infrastructure](./testing/integration-testing-infrastructure.md)** - Test setup and resource management
- **[Security Best Practices](./testing/integration-testing-security.md)** - IAM roles and credentials
- **[Helper Patterns](./testing/integration-testing-patterns.md)** - Reusable test utilities

**Guidance:**

- **[Decision Guide](./testing/decision-guide.md)** - Decision trees for choosing the right approach

**Read this if:**

- You're writing tests for any component
- You need to mock AWS services
- You're unsure whether to use a factory or direct mock
- You're setting up test configuration
- You need guidance on which testing approach to use
- You're writing integration tests against deployed infrastructure
- You need to set up IAM authentication for API Gateway testing
- You're implementing test security best practices

### [Agent Pattern](./agent-pattern.md)

Describes the agent pattern used for orchestrating business logic.

**Topics covered:**

- Agent structure and responsibilities
- Idempotent operation design
- Provider pattern for dependency isolation
- Handler pattern for Lambda entrypoints
- Error handling and logging
- Complete working examples

**Read this if:**

- You're creating a new Lambda function
- You're building a new agent or service
- You need to orchestrate multiple providers
- You're implementing CloudFormation custom resources

### [Types and Configuration](./types-and-configuration.md)

Guidelines for defining types and managing configuration.

**Topics covered:**

- Type definition principles with JSDoc
- Configuration structure with `clientConfig`
- Support for local testing environments
- Working with multiple AWS services
- Complete configuration examples

**Read this if:**

- You're defining new types or interfaces
- You're adding configuration for a new service
- You need to support testing with LocalStack
- You're working with AWS SDK clients

## Quick Start

### For Writing a New Lambda Function

1. **Define Types** ([Types and Configuration](./types-and-configuration.md))

   ```typescript
   export interface MyServiceConfig {
     resourceArn: string;
     region: string;
     clientConfig: ClientConfig;
   }
   ```

2. **Create Providers** ([Agent Pattern](./agent-pattern.md))

   ```typescript
   export class MyProvider {
     constructor(private readonly config: MyServiceConfig) {
       // Initialize AWS clients with config.clientConfig
     }
   }
   ```

3. **Create Agent** ([Agent Pattern](./agent-pattern.md))

   ```typescript
   export class MyAgent {
     constructor(
       private readonly config: MyServiceConfig,
       private readonly provider: MyProvider,
     ) {}

     async execute(): Promise<string> {
       // Orchestrate operations through idempotent methods
     }
   }
   ```

4. **Create Handler** ([Agent Pattern](./agent-pattern.md))

   ```typescript
   export async function handler(event, context) {
     // Validate, initialize, execute, handle errors
   }
   ```

5. **Write Tests** ([Testing Strategy](./testing-strategy.md))

   ```typescript
   describe("MyAgent", () => {
     // Set up mocks, test with LocalStack configuration
   });
   ```

### For Writing Tests

1. **Set up test configuration** ([Environment Variables and Constants](./testing/environment-and-constants.md))

   ```typescript
   const AWS_ENDPOINT = "http://localhost:5000";
   process.env.AWS_ENDPOINT_URL = AWS_ENDPOINT;
   ```

2. **Create mocks based on I/O patterns** ([Decision Guide](./testing/decision-guide.md))
   - Factory for I/O classes
   - Direct instantiation for non-I/O classes
   - Jest spies for handler tests

3. **Configure AWS clients for testing** ([AWS Client Configuration](./testing/aws-client-config.md))

   ```typescript
   const testConfig = {
     // ... other config
     clientConfig: {
       endpoint: "http://localhost:5000",
       credentials: {
         accessKeyId: "testing",
         secretAccessKey: "testing",
       },
     },
   };
   ```

## When to Use These Patterns

### Agent Pattern

**Use when:**

- Building Lambda functions that orchestrate multiple operations
- Implementing CloudFormation custom resources
- Coordinating between multiple AWS services
- Business logic needs to be testable in isolation

**Don't use when:**

- Simple single-operation functions
- Direct API proxies with no business logic
- Static utility functions

### Factory Pattern for Mocks

**Use when:**

- Testing classes that perform I/O operations
- Need to capture and verify interactions
- Multiple test scenarios require different behaviors
- Testing database, API, or AWS service interactions

**Don't use when:**

- Class doesn't perform I/O operations
- Testing simple data transformations
- Configuration-only classes

### Configuration with clientConfig

**Use when:**

- Initializing any AWS SDK client
- Building services that need to support testing
- Working with Secrets Manager, S3, DynamoDB, RDS, etc.

**Always use:**

- This is a standard pattern that should be used consistently across all services

### Handler Testing with Spies

**Use when:**

- Testing Lambda handler functions
- Focus is on orchestration flow, not implementation
- Verifying correct initialization and error handling

**Don't use when:**

- Testing business logic (test the agent directly instead)
- Testing provider implementations (use factories instead)

### Integration Testing

**Use when:**

- Verifying end-to-end workflows across multiple components
- Testing interactions between deployed AWS services
- Validating deployed infrastructure works correctly
- Validating that stack outputs and resource configurations are correct
- Testing event-driven architectures (S3 → EventBridge → Lambda)
- Verifying cross-service integrations
- Testing API Gateway endpoints with IAM authentication

**Don't use when:**

- Unit testing individual components (use unit tests instead)
- Testing business logic in isolation (use unit tests with mocks)
- Fast feedback during development (use unit tests)
- Testing code that doesn't interact with AWS services

**Key Requirements:**

- Use dedicated test IAM role via STS AssumeRole
- All environment variables must use `TEST_` prefix
- Configure via environment variables
- Implement garbage collection for test resource cleanup

## Examples by Use Case

### I'm building a new Lambda function that interacts with RDS and S3

1. Read: [Types and Configuration](./types-and-configuration.md) - Define config with clientConfig
2. Read: [Agent Pattern](./agent-pattern.md) - Structure your agent and providers
3. Read: [Testing Summary](./testing/summary.md) - Overview of testing approaches
4. Read: [AWS Client Configuration](./testing/aws-client-config.md) - Test with LocalStack

### I'm writing tests for an existing agent

1. Read: [Testing Summary](./testing/summary.md) - Get an overview of all testing approaches
2. Read: [Environment Variables and Constants](./testing/environment-and-constants.md) - Set up test config
3. Read: [Decision Guide](./testing/decision-guide.md) - Choose the right mocking approach
4. Read: [AWS Client Configuration](./testing/aws-client-config.md) - Configure for LocalStack

### I'm writing integration tests for deployed infrastructure

1. Read: [Integration Testing](./testing/integration-testing.md) - Quick start guide
2. Read: [Security Best Practices](./testing/integration-testing-security.md) - Set up IAM roles first
3. Read: [Test Infrastructure](./testing/integration-testing-infrastructure.md) - Set up test utilities
4. Read: [API Gateway Testing](./testing/integration-testing-api-gateway.md) - Test REST APIs (if applicable)
5. Read: [Helper Patterns](./testing/integration-testing-patterns.md) - Implement reusable utilities
6. Ensure stack is deployed and environment variables are configured with `TEST_` prefix

### I'm adding a new AWS service integration

1. Read: [Types and Configuration](./types-and-configuration.md#configuration-pattern) - Add to clientConfig
2. Read: [Agent Pattern](./agent-pattern.md#agent-structure) - Create provider class
3. Read: [Decision Guide](./testing/decision-guide.md) - Determine testing approach
4. Read: [Factory Pattern](./testing/factory-pattern.md) or [AWS SDK Mocking](./testing/aws-sdk-mocking.md) - Create mocks

### I'm implementing a CloudFormation custom resource

1. Read: [Agent Pattern](./agent-pattern.md#handler-pattern) - Follow handler structure
2. Read: [Agent Pattern](./agent-pattern.md#agent-structure) - Implement handleCreate/Update/Delete
3. See: `lambda/db-bootstrap/` for a complete reference implementation

### I need to add error handling

1. See: `lambda/db-bootstrap/errors.ts` - Custom error classes
2. Read: [Agent Pattern](./agent-pattern.md#handler-pattern) - Error handling in handlers
3. Read: [Agent Pattern](./agent-pattern.md#agent-structure) - Try-finally patterns for cleanup

### I'm adding a new parameter to an existing API endpoint

1. Read: [Types and Configuration](./types-and-configuration.md) - Update interface definitions
2. Read: [Testing Summary](./testing/summary.md) - Understand unit and integration testing approach
3. Reference implementation: Search threshold parameter feature
   - Types: Add parameter to request interface with JSDoc
   - Validator: Add validation logic with constants for min/max values
   - Provider: Implement business logic (e.g., SQL query modifications)
   - Tests: Add unit tests for validator, agent, handler, and provider
   - Integration tests: Add end-to-end tests for new parameter behavior
   - Documentation: Update OpenAPI spec with new parameter schema

## Database Connection Pattern

The project uses a **separation of concerns** pattern for database connections:

- **DbCredentialsProvider**: Generates IAM authentication tokens using RDS Signer
- **DbConnectionProvider**: Creates connection pools from configuration and auth tokens

This pattern is used consistently in:

- `lambda/db-bootstrap/` - Reference implementation
- `lambda/api/` - API Lambda functions

**Benefits:**

- Clear separation between authentication and connection management
- Easy to test credentials generation and connection creation independently
- Consistent pattern across all Lambda functions
- Better connection management with Pool instead of Client

**Usage Pattern:**

```typescript
const credentialsProvider = new DbCredentialsProvider(config);
const connectionProvider = new DbConnectionProvider(config);
const authToken = await credentialsProvider.createIamAuthToken();
const pool = connectionProvider.createIamPool(authToken);

try {
  // Use pool for operations
} finally {
  await pool.end();
}
```
