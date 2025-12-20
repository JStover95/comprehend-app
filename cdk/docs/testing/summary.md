# Testing Strategy Summary

This directory contains comprehensive testing patterns and strategies used throughout this project. The documents are organized by topic to make it easy to find specific guidance.

## Quick Navigation

### Core Concepts

- **[Mocking Strategy](./mocking-strategy.md)** - Principles for mocking in tests, what to mock and how
- **[Environment Variables and Constants](./environment-and-constants.md)** - Setting up test configuration and constants
- **[Dependency Injection](./dependency-injection.md)** - Using constructor injection for testability

### Mocking Patterns

- **[Factory Pattern for Mocks](./factory-pattern.md)** - When and how to create mock factories
- **[AWS SDK Mocking](./aws-sdk-mocking.md)** - Mocking AWS SDK clients and creating provider wrappers
- **[AWS Client Configuration](./aws-client-config.md)** - Configuring AWS clients for testing with LocalStack

### Testing Specific Components

- **[Handler Testing](./handler-testing.md)** - Testing Lambda handler entrypoints
- **[Integration Testing](./integration-testing.md)** - End-to-end testing against live AWS resources
- **[Decision Guide](./decision-guide.md)** - Decision tree for choosing the right testing approach

### Integration Testing

- **[Integration Testing](./integration-testing.md)** - Quick start and introduction
- **[API Gateway Testing](./integration-testing-api-gateway.md)** - Testing REST APIs with IAM authentication
- **[Test Infrastructure](./integration-testing-infrastructure.md)** - Test setup and resource management
- **[Security Best Practices](./integration-testing-security.md)** - IAM roles and credentials
- **[Helper Patterns](./integration-testing-patterns.md)** - Reusable test utilities

## Quick Reference

### "I need to test..."

| Scenario                                   | Read This                                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| A new Lambda function                      | [Handler Testing](./handler-testing.md)                                                    |
| An agent that orchestrates providers       | [Dependency Injection](./dependency-injection.md), [Factory Pattern](./factory-pattern.md) |
| A provider that uses AWS SDK               | [AWS SDK Mocking](./aws-sdk-mocking.md)                                                    |
| A service available in LocalStack          | [AWS Client Configuration](./aws-client-config.md)                                         |
| A service NOT in LocalStack (like Bedrock) | [AWS SDK Mocking](./aws-sdk-mocking.md)                                                    |
| Error handling and edge cases              | [Factory Pattern](./factory-pattern.md)                                                    |
| End-to-end workflows across services       | [Integration Testing](./integration-testing.md)                                            |
| Deployed infrastructure behavior           | [Integration Testing](./integration-testing.md)                                            |
| API Gateway endpoints with IAM auth        | [API Gateway Testing](./integration-testing-api-gateway.md)                                |
| Test security and IAM role setup           | [Security Best Practices](./integration-testing-security.md)                               |

### "I'm not sure whether to..."

| Question                                | Answer                                                                      |
| --------------------------------------- | --------------------------------------------------------------------------- |
| Use a factory or direct instantiation?  | See [Decision Guide](./decision-guide.md#factories-vs-direct-mocks)         |
| Mock the AWS SDK or use LocalStack?     | See [Decision Guide](./decision-guide.md#aws-service-testing)               |
| Create a mock provider wrapper?         | See [AWS SDK Mocking](./aws-sdk-mocking.md#creating-mock-provider-wrappers) |
| Use jest.spyOn or dependency injection? | See [Handler Testing](./handler-testing.md)                                 |
| Use unit tests or integration tests?     | See [Integration Testing](./integration-testing.md#when-to-use-integration-tests), [Decision Guide](./decision-guide.md) |
| Set up IAM authentication for tests?    | See [Security Best Practices](./integration-testing-security.md)            |

## Key Principles

### Unit Testing Principles

1. **Plan your mocking strategy first** - Identify what's constant vs what needs flexible mocking
2. **Declare test configuration upfront** - Make test constants visible at the top of files
3. **Use factories for I/O operations** - Classes that perform I/O need flexible mock behavior
4. **Mock AWS SDK clients directly** - When service not in LocalStack, test real provider implementations
5. **Create provider wrappers for reusability** - When testing orchestration that uses providers
6. **Inject dependencies** - Use constructor injection for easy testing
7. **Skip factories for non-I/O classes** - Instantiate them directly with test config
8. **Use spies for handler testing** - Test orchestration flow, not implementation details

### Integration Testing Principles

1. **Use dedicated test IAM roles** - Always use STS AssumeRole, never use admin or production credentials
2. **TEST_ prefix for all variables** - All integration test environment variables must use `TEST_` prefix
3. **Environment variables only** - Configure via environment variables
4. **Track and clean up resources** - Use garbage collector pattern to clean up test artifacts
5. **Test against dedicated environments** - Never test against production resources

## Getting Started

### For Your First Test

1. Start with [Mocking Strategy](./mocking-strategy.md) to understand the principles
2. Read [Environment Variables and Constants](./environment-and-constants.md) to set up your test file
3. Follow the [Decision Guide](./decision-guide.md) to choose the right approach
4. Refer to specific pattern documents as needed

### For Specific Situations

Jump directly to the relevant document from the [Quick Navigation](#quick-navigation) section above.

## Examples

Every document includes complete, working examples that demonstrate the patterns in action. These examples are based on real code from this project and follow best practices.

## Contributing

When adding new testing patterns:

1. Add examples to the appropriate document
2. Update this summary if adding a new category
3. Update the [Decision Guide](./decision-guide.md) if introducing new decision points
4. Keep examples practical and based on real use cases
