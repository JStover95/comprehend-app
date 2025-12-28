# Testing Decision Guide

## Overview

This guide helps you choose the right testing approach for different scenarios. Follow the decision trees and examples to quickly determine the best strategy.

## Quick Decision Trees

### What Testing Approach Should I Use?

```plaintext
What are you testing?
│
├─ Lambda Handler Entrypoint
│  └─ Use: jest.spyOn on method prototypes
│     See: Handler Testing
│
├─ Agent / Orchestration Class
│  └─ Use: Dependency injection with mock providers
│     See: Dependency Injection, Factory Pattern
│
├─ Provider that uses AWS SDK
│  ├─ Service available in LocalStack?
│  │  ├─ Yes → Use: LocalStack with clientConfig
│  │  │        See: AWS Client Configuration
│  │  └─ No  → Use: Mock AWS SDK client directly
│  │           See: AWS SDK Mocking
│  │
│  └─ Testing orchestration that uses provider?
│     └─ Use: Mock provider wrapper
│        See: AWS SDK Mocking (Provider Wrappers)
│
├─ Configuration / Utility Class
│  └─ Use: Direct instantiation (no mocking needed)
│     See: Mocking Strategy
│
└─ I/O Operation Class
   └─ Use: Factory pattern mock
      See: Factory Pattern
```

## Factories vs Direct Mocks

### Factories vs Direct Mocks - Decision Flow

```plaintext
Does the class perform I/O operations?
│
├─ Yes → Does it need different behaviors in tests?
│  │
│  ├─ Yes → Create a factory mock class
│  │        - Database clients
│  │        - API clients
│  │        - AWS service providers
│  │        See: Factory Pattern
│  │
│  └─ No  → Use jest.spyOn or direct mock
│           See: Handler Testing
│
└─ No  → Direct instantiation with test config
          - Configuration builders
          - Data transformers
          - Validators
          See: Mocking Strategy
```

### Examples

| Class Type                           | I/O? | Approach             | Example                            |
| ------------------------------------ | ---- | -------------------- | ---------------------------------- |
| Database Connection Provider         | Yes  | Factory Mock         | `MockDatabaseProvider`             |
| HTTP Client                          | Yes  | Factory Mock         | `MockHttpClient`                   |
| Configuration Builder                | No   | Direct Instantiation | `new ConfigBuilder(testConfig)`    |
| Data Validator                       | No   | Direct Instantiation | `new Validator(testRules)`         |
| S3 Provider (LocalStack available)   | Yes  | LocalStack           | Use real client with test endpoint |
| Bedrock Provider (not in LocalStack) | Yes  | Mock SDK Client      | `MockBedrockRuntimeClient`         |
| Agent (uses providers)               | No\* | Dependency Injection | Inject mock providers              |

\*Agent doesn't do I/O directly, delegates to providers

## AWS Service Testing

### AWS Service Testing - Decision Flow

```plaintext
Which AWS service are you testing?
│
├─ Available in LocalStack?
│  (S3, DynamoDB, Secrets Manager, Lambda, SNS, SQS, etc.)
│  │
│  └─ Testing provider implementation?
│     ├─ Yes → Use: LocalStack with clientConfig override
│     │        Configure: endpoint: "http://localhost:5000"
│     │        See: AWS Client Configuration
│     │
│     └─ No (testing agent) → Use: Mock provider wrapper
│           See: AWS SDK Mocking (Provider Wrappers)
│
└─ NOT Available in LocalStack?
   (Bedrock etc.)
   │
   ├─ Testing provider implementation?
   │  └─ Use: Mock AWS SDK client directly
   │     Inject into real provider
   │     See: AWS SDK Mocking
   │
   └─ Testing agent that uses provider?
      └─ Use: Mock provider wrapper
         Extends real provider, injects mock client
         See: AWS SDK Mocking (Provider Wrappers)
```

## Testing Component Types

### Handler Testing

```typescript
// Use: jest.spyOn

describe("handler", () => {
  beforeEach(() => {
    jest.spyOn(Agent.prototype, "execute").mockResolvedValue("result");
  });

  it("should orchestrate execution", async () => {
    await handler(event, context);
    expect(Agent.prototype.execute).toHaveBeenCalled();
  });
});
```

**When to use:** Testing Lambda handler entrypoints

**See:** [Handler Testing](./handler-testing.md)

### Agent Testing

```typescript
// Use: Dependency injection with mock providers

describe("MyAgent", () => {
  let mockProvider: MockProvider;
  let agent: MyAgent;

  beforeEach(() => {
    mockProvider = new MockProvider(config);
    agent = new MyAgent(config, mockProvider);
  });

  it("should orchestrate operations", async () => {
    await agent.execute(data);
    expect(mockProvider.getCapturedCalls()).toHaveLength(1);
  });
});
```

**When to use:** Testing orchestration logic that coordinates multiple providers

**See:** [Dependency Injection](./dependency-injection.md), [AWS SDK Mocking](./aws-sdk-mocking.md)

### Provider Testing (LocalStack Available)

```typescript
// Use: LocalStack with clientConfig

describe("S3Provider", () => {
  beforeEach(() => {
    const config = {
      bucketArn: TEST_BUCKET_ARN,
      region: "us-east-1",
      clientConfig: {
        endpoint: "http://localhost:5000",
        credentials: { accessKeyId: "testing", secretAccessKey: "testing" },
      },
    };

    provider = new S3Provider(config);
  });

  it("should upload to S3", async () => {
    await provider.upload("key", data);
    // Verify using real S3 client pointing to LocalStack
  });
});
```

**When to use:** Testing providers for services available in LocalStack

**See:** [AWS Client Configuration](./aws-client-config.md)

### Provider Testing (LocalStack NOT Available)

```typescript
// Use: Mock AWS SDK client

describe("BedrockProvider", () => {
  let mockClient: MockBedrockRuntimeClient;
  let provider: BedrockProvider;

  beforeEach(() => {
    mockClient = new MockBedrockRuntimeClient();
    provider = new BedrockProvider(config);
    (provider as any).bedrockClient = mockClient;
  });

  it("should invoke model", async () => {
    mockClient.withResponse("input", [1, 2, 3]);
    const result = await provider.embed("input");
    expect(result).toEqual([1, 2, 3]);
  });
});
```

**When to use:** Testing providers for services NOT available in LocalStack

**See:** [AWS SDK Mocking](./aws-sdk-mocking.md)

### Configuration Class Testing

```typescript
// Use: Direct instantiation

describe("ConfigBuilder", () => {
  it("should build config", () => {
    const builder = new ConfigBuilder({
      host: "localhost",
      port: 5432,
    });

    const config = builder.buildDatabaseConfig();
    expect(config.host).toBe("localhost");
  });
});
```

**When to use:** Testing classes that only transform configuration

**See:** [Mocking Strategy](./mocking-strategy.md)

## Common Scenarios

### Scenario: New Lambda with S3 and Secrets Manager

**Question:** How do I test this?

**Answer:**

1. **Handler:** Use jest.spyOn
2. **Agent:** Use dependency injection with mock providers
3. **S3 Provider:** Use LocalStack (service available)
4. **Secrets Provider:** Use LocalStack (service available)

**See:**

- [Handler Testing](./handler-testing.md)
- [Dependency Injection](./dependency-injection.md)
- [AWS Client Configuration](./aws-client-config.md)

### Scenario: New Lambda with Bedrock

**Question:** Bedrock isn't in LocalStack, how do I test?

**Answer:**

1. **Handler:** Use jest.spyOn on agent methods
2. **Agent:** Use mock provider wrapper (`MockBedrockProvider`)
3. **Bedrock Provider:** Mock SDK client directly in provider tests

**See:**

- [AWS SDK Mocking](./aws-sdk-mocking.md)
- [Handler Testing](./handler-testing.md)

### Scenario: Testing Error Handling

**Question:** How do I test error scenarios?

**Answer:**

- **In Handler:** Configure spy to throw error
- **In Agent:** Configure mock provider to throw error
- **In Provider:** Configure mock SDK client to throw error

```typescript
// Handler test
jest.spyOn(Agent.prototype, "execute").mockRejectedValue(new Error("Failed"));

// Agent test
mockProvider.withError(new Error("Provider failed"));

// Provider test
mockClient.withError(new Error("AWS service failed"));
```

**See:**

- [Factory Pattern](./factory-pattern.md)
- [AWS SDK Mocking](./aws-sdk-mocking.md)

### Scenario: Testing Multiple AWS Services

**Question:** How do I test an agent that uses S3, DynamoDB, and Bedrock?

**Answer:**

- **S3:** Mock provider wrapper (or LocalStack in provider tests)
- **DynamoDB:** Mock provider wrapper (or LocalStack in provider tests)
- **Bedrock:** Mock provider wrapper (mock SDK client in provider tests)
- **Agent:** Inject all three mock provider wrappers

```typescript
describe("MultiServiceAgent", () => {
  let mockS3: MockS3Provider;
  let mockDynamo: MockDynamoProvider;
  let mockBedrock: MockBedrockProvider;

  beforeEach(() => {
    mockS3 = new MockS3Provider(config);
    mockDynamo = new MockDynamoProvider(config);
    mockBedrock = new MockBedrockProvider(config);

    agent = new MultiServiceAgent(config, mockS3, mockDynamo, mockBedrock);
  });
});
```

**See:**

- [Dependency Injection](./dependency-injection.md)
- [AWS SDK Mocking](./aws-sdk-mocking.md)

## Quick Reference

### "Should I create a factory mock?"

| Scenario              | Factory? | Reason                                  |
| --------------------- | -------- | --------------------------------------- |
| Database provider     | ✅ Yes   | I/O operations, needs flexible behavior |
| AWS SDK client        | ✅ Yes   | I/O operations, multiple test scenarios |
| Configuration builder | ❌ No    | No I/O, use direct instantiation        |
| Handler function      | ❌ No    | Use jest.spyOn instead                  |
| Data transformer      | ❌ No    | No I/O, pure functions                  |

### "Should I use LocalStack or mock?"

| Service         | Use        | Reason                            |
| --------------- | ---------- | --------------------------------- |
| S3              | LocalStack | Available, close to real behavior |
| DynamoDB        | LocalStack | Available, close to real behavior |
| Secrets Manager | LocalStack | Available, close to real behavior |
| Bedrock         | Mock       | Not available in LocalStack       |

### "Should I create a provider wrapper?"

| Scenario                           | Wrapper? | Reason                         |
| ---------------------------------- | -------- | ------------------------------ |
| Testing provider itself            | ❌ No    | Inject mock client directly    |
| Testing agent using provider       | ✅ Yes   | Cleaner, reusable across tests |
| One test file using provider       | ❌ No    | Direct injection is fine       |
| Multiple test files using provider | ✅ Yes   | Reusability, consistency       |

## Next Steps

For detailed information on each approach, see:

- [Mocking Strategy](./mocking-strategy.md)
- [Environment Variables and Constants](./environment-and-constants.md)
- [Factory Pattern for Mocks](./factory-pattern.md)
- [AWS SDK Mocking](./aws-sdk-mocking.md)
- [AWS Client Configuration](./aws-client-config.md)
- [Dependency Injection](./dependency-injection.md)
- [Handler Testing](./handler-testing.md)
