# Environment Variables and Constants

## Overview

Tests should always start with a declaration block for environment variables and constants. This makes it clear what configuration is needed for the tests and allows for easy modifications.

## Principle

**Declare all test configuration upfront for visibility and maintainability:**

- AWS credentials should be mocked to safe values like `"testing"`
- Use a custom endpoint to point to local mocked services (e.g., LocalStack)
- Declare all test constants at the top of the test file
- Set up environment variables before any test execution

## Key Guidelines

1. **Group configuration constants** - Keep all test config in one place at the top
2. **Use descriptive names** - Make it clear what each constant represents
3. **Set safe AWS credentials** - Use `"testing"` to prevent accidental AWS calls
4. **Configure endpoints for LocalStack** - Point to `http://localhost:5000` by default
5. **Set environment variables early** - Before any imports that use them

## Example

### Test Configuration Block

```typescript
// agent.test.ts

// ==========================================
// Test Configuration Constants
// ==========================================

const AWS_ENDPOINT = "http://localhost:5000";
const AWS_DEFAULT_REGION = "us-east-1";
const AWS_ACCESS_KEY_ID = "testing";
const AWS_SECRET_ACCESS_KEY = "testing";
const AWS_REGION = "us-east-1";
const AWS_ACCOUNT_ID = "123456789012";

const SERVICE_URL = "http://localhost:3000";
const TEST_RESOURCE_NAME = "test-resource";
const TEST_RESOURCE_ARN = `arn:aws:service:${AWS_REGION}:${AWS_ACCOUNT_ID}:resource/${TEST_RESOURCE_NAME}`;

// Set up environment variables for testing
process.env.AWS_ENDPOINT_URL = AWS_ENDPOINT;
process.env.AWS_DEFAULT_REGION = AWS_DEFAULT_REGION;
process.env.AWS_ACCESS_KEY_ID = AWS_ACCESS_KEY_ID;
process.env.AWS_SECRET_ACCESS_KEY = AWS_SECRET_ACCESS_KEY;
process.env.AWS_REGION = AWS_REGION;
process.env.RESOURCE_ARN = TEST_RESOURCE_ARN;

// ==========================================
// Tests
// ==========================================

describe("MyAgent", () => {
  // Tests go here
});
```

### Database Configuration

```typescript
// db-agent.test.ts

// ==========================================
// Test Configuration Constants
// ==========================================

// AWS Configuration
const AWS_ENDPOINT = "http://localhost:5000";
const AWS_REGION = "us-east-1";
const AWS_ACCESS_KEY_ID = "testing";
const AWS_SECRET_ACCESS_KEY = "testing";

// Database Configuration
const DB_HOST = "localhost";
const DB_PORT = 5432;
const DB_NAME = "test_db";
const DB_SECRET_ARN =
  "arn:aws:secretsmanager:us-east-1:123456789012:secret:test-secret";

// Test Data
const TEST_USER_ID = "user-123";
const TEST_TIMESTAMP = "2024-01-01T00:00:00Z";

// Set up environment
process.env.AWS_ENDPOINT_URL = AWS_ENDPOINT;
process.env.AWS_REGION = AWS_REGION;
process.env.AWS_ACCESS_KEY_ID = AWS_ACCESS_KEY_ID;
process.env.AWS_SECRET_ACCESS_KEY = AWS_SECRET_ACCESS_KEY;
process.env.DB_SECRET_ARN = DB_SECRET_ARN;
process.env.DB_HOST = DB_HOST;
process.env.DB_PORT = String(DB_PORT);
process.env.DB_NAME = DB_NAME;

// ==========================================
// Tests
// ==========================================

describe("DatabaseAgent", () => {
  // Tests go here
});
```

## Common Patterns

### AWS Services Configuration

```typescript
const AWS_ENDPOINT = "http://localhost:5000";
const AWS_REGION = "us-east-1";
const AWS_ACCESS_KEY_ID = "testing";
const AWS_SECRET_ACCESS_KEY = "testing";

process.env.AWS_ENDPOINT_URL = AWS_ENDPOINT;
process.env.AWS_REGION = AWS_REGION;
process.env.AWS_ACCESS_KEY_ID = AWS_ACCESS_KEY_ID;
process.env.AWS_SECRET_ACCESS_KEY = AWS_SECRET_ACCESS_KEY;
```

### ARN Construction

```typescript
const AWS_ACCOUNT_ID = "123456789012";
const AWS_REGION = "us-east-1";
const RESOURCE_NAME = "my-resource";

const RESOURCE_ARN = `arn:aws:service:${AWS_REGION}:${AWS_ACCOUNT_ID}:resource/${RESOURCE_NAME}`;
```

### Service Endpoints

```typescript
const BEDROCK_ENDPOINT = "http://localhost:5000";
const LAMBDA_ENDPOINT = "http://localhost:5000";
const S3_ENDPOINT = "http://localhost:5000";
```

## Benefits

1. **Clarity** - All test configuration in one visible place
2. **Safety** - Prevents accidental real AWS calls with `"testing"` credentials
3. **Flexibility** - Easy to change endpoints for different testing environments
4. **Maintainability** - Changes to configuration are straightforward
5. **Documentation** - Serves as documentation for what the tests need

## Tips

1. **Comment sections** - Use comment blocks to separate configuration categories
2. **Use constants for calculations** - Build ARNs and URLs from base constants
3. **Keep it DRY** - Extract common configuration to shared test utilities if used across files
4. **Document special values** - Add comments for non-obvious configuration choices

## Next Steps

- For configuring AWS clients: See [AWS Client Configuration](./aws-client-config.md)
- For using these constants in tests: See [Factory Pattern for Mocks](./factory-pattern.md)
- For dependency injection: See [Dependency Injection](./dependency-injection.md)
