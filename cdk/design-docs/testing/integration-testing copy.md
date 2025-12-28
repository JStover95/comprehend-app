# Integration Testing

This guide provides an overview of integration testing strategies for deployed AWS infrastructure.

## What Are Integration Tests?

Integration tests verify that deployed components work together correctly in a real AWS environment. They test:

- **End-to-End Workflows**: Complete user journeys across multiple services
- **Service Interactions**: Communication between deployed AWS services
- **Infrastructure Behavior**: Actual deployed resource configurations
- **Real Data Flow**: Actual messages, events, and data transformations

## When to Use Integration Tests

**Use integration tests when:**

- Verifying end-to-end workflows across multiple components
- Testing interactions between deployed AWS services
- Validating that deployed infrastructure works as expected
- Testing event-driven architectures (S3 → EventBridge → Lambda, etc.)
- Verifying cross-service integrations (API Gateway → Lambda → RDS)

**Don't use integration tests for:**

- Unit testing individual components (use unit tests instead)
- Testing business logic in isolation (use unit tests with mocks)
- Validating error handling paths (use unit tests with mock failures)
- Fast feedback during development (use unit tests)
- Testing code that doesn't interact with AWS services

## Prerequisites

1. **Deployed Stack**: Infrastructure must be deployed to a test AWS account/environment
2. **AWS Credentials**: Valid credentials with appropriate IAM permissions
3. **Test IAM Role**: Dedicated IAM role for test execution (security best practice)
4. **Environment Variables**: Configuration via `TEST_*` prefixed environment variables

## Quick Start

```bash
# Set required environment variables
export TEST_STACK_NAME="YourStack-dev"
export TEST_ASSUME_ROLE_ARN="arn:aws:iam::123456789012:role/integration-test-role"
export TEST_API_GATEWAY_URL="https://abc123.execute-api.us-east-1.amazonaws.com/dev"
export TEST_AWS_REGION="us-east-1"

# Run integration tests
npm test -- test/integration
```

## Documentation Structure

Integration testing documentation is organized into specialized guides:

### [🔐 Security Best Practices](./integration-testing-security.md)

Security requirements and best practices for integration testing.

**Topics:**

- IAM role requirements and configuration
- STS AssumeRole pattern
- Credential management and caching
- Environment variable security
- CI/CD security configuration

---

### [🌐 API Gateway Testing](./integration-testing-api-gateway.md)

Testing REST APIs with IAM authentication.

**Topics:**

- API Gateway with IAM authentication
- AWS Signature Version 4 signing
- Request signing provider pattern
- Making authenticated API requests
- Testing different HTTP methods
- Error handling and troubleshooting

---

### [🏗️ Test Infrastructure](./integration-testing-infrastructure.md)

Test setup, resource configuration, and garbage collection.

**Topics:**

- Test structure and organization
- Environment variable configuration
- Test setup pattern
- Garbage collector pattern
- Helper function organization
- Best practices

---

### [🔧 Helper Patterns](./integration-testing-patterns.md)

Reusable test utility patterns applicable to any project.

**Topics:**

- Test data factory pattern
- Response validation pattern
- Async waiting pattern
- Resource tracking pattern
- Request execution pattern
- Assertion helpers

## Implementation Guide

For step-by-step implementation, follow this order:

1. **[Security](./integration-testing-security.md)** - Set up IAM roles and credentials
2. **[Infrastructure](./integration-testing-infrastructure.md)** - Create test setup utilities
3. **[API Gateway](./integration-testing-api-gateway.md)** or other service guides - Implement service-specific testing
4. **[Patterns](./integration-testing-patterns.md)** - Add helper functions for common operations

## Related Documentation

- [Testing Summary](./summary.md) - Overview of all testing approaches
- [Handler Testing](./handler-testing.md) - Testing Lambda handlers (unit tests)
- [Decision Guide](./decision-guide.md) - Choosing between unit and integration tests
