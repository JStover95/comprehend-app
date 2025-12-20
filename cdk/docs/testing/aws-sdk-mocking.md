# AWS SDK Mocking

## Overview

When an AWS service is not available in LocalStack or you want to test the actual provider implementation, mock the AWS SDK client directly and inject it into your provider. This allows you to test real provider logic (error handling, response parsing, etc.) while controlling I/O.

## When to Use This Approach

✅ **Use AWS SDK Mocking When:**

- Service not available in LocalStack (e.g., Bedrock Runtime)
- Want to test actual provider implementation, not just orchestration
- Need fine-grained control over SDK responses
- Testing error handling and edge cases in provider logic

❌ **Don't Use When:**

- Service is available in LocalStack (use LocalStack instead)
- Only testing orchestration (use jest.spyOn on provider methods)
- Integration tests (use real service or LocalStack)

## Key Guidelines

1. **Create a mock factory** that mimics the AWS SDK client's `send()` method
2. **Inject the mock client** into the real provider class for testing
3. **Capture SDK commands** to verify interactions
4. **Support configurable responses** and errors
5. **Use method chaining** for easy test configuration

## Example: Mocking Bedrock Runtime Client

### Step 1: Create the Mock Client

```typescript
// test/utils/mock-bedrock-client.ts

import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

interface CapturedCommand {
  command: InvokeModelCommand;
  input: any;
}

interface MockResponse {
  body: Uint8Array;
}

/**
 * Mock Bedrock Runtime Client for testing
 * Mocks the send() method to avoid actual AWS calls
 */
export class MockBedrockRuntimeClient {
  private capturedCommands: CapturedCommand[] = [];
  private mockResponses: Map<string, MockResponse> = new Map();
  private mockError?: Error;
  private shouldFailOnText: Set<string> = new Set();

  /**
   * Sets a mock response for a specific input text
   */
  withResponse(inputText: string, embedding: number[]): this {
    const responseBody = JSON.stringify({ embedding });
    this.mockResponses.set(inputText, {
      body: new TextEncoder().encode(responseBody),
    });
    return this;
  }

  /**
   * Sets an error to throw on the next send call
   */
  withError(error: Error): this {
    this.mockError = error;
    return this;
  }

  /**
   * Configures the mock to fail for a specific input text
   */
  withFailureForText(inputText: string): this {
    this.shouldFailOnText.add(inputText);
    return this;
  }

  /**
   * Gets all captured commands
   */
  getCapturedCommands(): CapturedCommand[] {
    return this.capturedCommands;
  }

  /**
   * Mock implementation of BedrockRuntimeClient.send
   */
  async send(command: InvokeModelCommand): Promise<any> {
    // Extract input from command
    const input = (command as any).input;
    const bodyString = input?.body || "{}";
    const bodyJson = JSON.parse(bodyString);
    const inputText = bodyJson.inputText || "";

    // Capture the command
    this.capturedCommands.push({ command, input: bodyJson });

    // If configured to fail for this text, throw error
    if (this.shouldFailOnText.has(inputText)) {
      throw new Error(`Bedrock failed for input: ${inputText}`);
    }

    // If a general error is configured, throw it
    if (this.mockError) {
      const error = this.mockError;
      this.mockError = undefined; // Clear error after throwing
      throw error;
    }

    // If a mock response exists for this input text, return it
    if (this.mockResponses.has(inputText)) {
      return this.mockResponses.get(inputText);
    }

    // Return a default mock response
    const defaultEmbedding = Array(1536).fill(0.1);
    const responseBody = JSON.stringify({ embedding: defaultEmbedding });
    return {
      body: new TextEncoder().encode(responseBody),
    };
  }
}
```

### Step 2: Test the Provider Directly

```typescript
// bedrock-provider.test.ts

import { BedrockProvider } from "../../../lambdas/single-embedder/bedrock-provider";
import { MockBedrockRuntimeClient } from "../../utils/mock-bedrock-client";

describe("BedrockProvider", () => {
  let mockClient: MockBedrockRuntimeClient;
  let provider: BedrockProvider;

  beforeEach(() => {
    const config = {
      modelId: "amazon.titan-embed-text-v1",
      region: "us-east-1",
      clientConfig: {},
    };

    mockClient = new MockBedrockRuntimeClient();
    provider = new BedrockProvider(config);

    // Inject the mock client into the real provider
    (provider as any).bedrockClient = mockClient;
  });

  it("should embed a form successfully", async () => {
    const form = {
      formText: "hello",
      checksum: "checksum-1",
      writtenForm: "hello",
    };

    // Configure mock response
    mockClient.withResponse("hello", [1, 2, 3]);

    const result = await provider.embedForm(form);

    // Verify the result from real provider logic
    expect(result.vector).toEqual([1, 2, 3]);
    expect(result.checksum).toBe("checksum-1");

    // Verify the SDK interaction
    const captured = mockClient.getCapturedCommands();
    expect(captured).toHaveLength(1);
    expect(captured[0].input.inputText).toBe("hello");
  });

  it("should handle Bedrock errors correctly", async () => {
    const form = {
      formText: "test",
      checksum: "checksum-test",
      writtenForm: "test",
    };

    // Simulate Bedrock error
    mockClient.withError(new Error("Service unavailable"));

    // Tests real provider error handling
    await expect(provider.embedForm(form)).rejects.toThrow();
  });

  it("should handle multiple forms with partial failures", async () => {
    // Configure one input to fail
    mockClient.withFailureForText("bad");

    const forms = [
      { formText: "good", checksum: "1", writtenForm: "good" },
      { formText: "bad", checksum: "2", writtenForm: "bad" },
      { formText: "good2", checksum: "3", writtenForm: "good2" },
    ];

    // Test real provider's error handling logic
    const results = await provider.embedForms(forms);

    // Should skip failed form and continue
    expect(results).toHaveLength(2);
    expect(results[0].checksum).toBe("1");
    expect(results[1].checksum).toBe("3");

    // All three were attempted
    expect(mockClient.getCapturedCommands()).toHaveLength(3);
  });
});
```

## Creating Mock Provider Wrappers for Reusability

When you need to use a mocked provider in multiple test suites (e.g., testing an agent that uses the provider), create a **mock provider wrapper class** that encapsulates the mock client injection.

### When to Use Provider Wrappers

✅ **Use When:**

- Testing orchestration classes (agents) that use providers
- Need to reuse the same mock provider across multiple test files
- Want cleaner test code without manual client injection
- Want domain-specific convenience methods

❌ **Don't Use When:**

- Testing the provider implementation itself (inject client directly)
- One-off tests that don't need reusability
- Need maximum control over the mock client

### Example: Mock Provider Wrapper

```typescript
// test/unit/single-embedder/single-embedder.mock.ts

import { BedrockProvider } from "../../../lambdas/single-embedder/bedrock-provider";
import { LambdaProvider } from "../../../lambdas/single-embedder/lambda-provider";
import { MockBedrockRuntimeClient } from "../../utils/mock-bedrock-client";
import { MockLambdaClient } from "../../utils/mock-lambda-client";
import { EmbedderConfig } from "../../../lambdas/single-embedder/types";

/**
 * Mock BedrockProvider for testing
 * Wraps the real provider and injects a mock client
 */
export class MockBedrockProvider extends BedrockProvider {
  private mockClient: MockBedrockRuntimeClient;

  constructor(config: EmbedderConfig) {
    super(config);
    // Create and inject the mock client
    this.mockClient = new MockBedrockRuntimeClient();
    (this as any).bedrockClient = this.mockClient;
  }

  // Convenience methods that delegate to the mock client
  withResponse(inputText: string, embedding: number[]): this {
    this.mockClient.withResponse(inputText, embedding);
    return this;
  }

  withError(error: Error): this {
    this.mockClient.withError(error);
    return this;
  }

  withFailureForText(inputText: string): this {
    this.mockClient.withFailureForText(inputText);
    return this;
  }

  getCapturedCommands(): any[] {
    return this.mockClient.getCapturedCommands();
  }

  getLastCommand(): any | undefined {
    return this.mockClient.getLastCommand();
  }

  clearCapturedCommands(): void {
    this.mockClient.clearCapturedCommands();
  }
}

/**
 * Mock LambdaProvider for testing
 * Wraps the real provider and injects a mock client
 */
export class MockLambdaProvider extends LambdaProvider {
  private mockClient: MockLambdaClient;

  constructor(config: EmbedderConfig) {
    super(config);
    // Create and inject the mock client
    this.mockClient = new MockLambdaClient();
    (this as any).lambdaClient = this.mockClient;
  }

  // Convenience methods that delegate to the mock client
  withResponse(functionName: string, response: any): this {
    this.mockClient.withResponse(functionName, response);
    return this;
  }

  withDefaultResponse(response: any): this {
    this.mockClient.withDefaultResponse(response);
    return this;
  }

  withError(functionName: string, error: Error): this {
    this.mockClient.withError(functionName, error);
    return this;
  }

  withGlobalError(error: Error): this {
    this.mockClient.withGlobalError(error);
    return this;
  }

  getCapturedCommands(): any[] {
    return this.mockClient.getCapturedCommands();
  }

  getLastCommand(): any | undefined {
    return this.mockClient.getLastCommand();
  }

  clearCapturedCommands(): void {
    this.mockClient.clearCapturedCommands();
  }
}
```

### Using Mock Provider Wrappers in Agent Tests

```typescript
// test/unit/single-embedder/single-embedder.test.ts

import { SingleEmbedderAgent } from "../../../lambdas/single-embedder/single-embedder-agent";
import {
  MockBedrockProvider,
  MockLambdaProvider,
} from "./single-embedder.mock";
import { validateEnvironment } from "../../../lambdas/single-embedder/utils";

describe("SingleEmbedderAgent", () => {
  let defaultConfig: ReturnType<typeof validateEnvironment>;
  let mockBedrockProvider: MockBedrockProvider;
  let mockLambdaProvider: MockLambdaProvider;

  beforeAll(() => {
    defaultConfig = validateEnvironment();
  });

  beforeEach(() => {
    // Create mock providers with mock clients already injected
    mockBedrockProvider = new MockBedrockProvider(defaultConfig);
    mockLambdaProvider = new MockLambdaProvider(defaultConfig);
  });

  describe("execute", () => {
    it("should successfully process forms and persist embeddings", async () => {
      // Configure mock responses using convenience methods
      mockBedrockProvider.withResponse("hello", [0.1, 0.2, 0.3]);
      mockBedrockProvider.withResponse("world", [0.4, 0.5, 0.6]);
      mockLambdaProvider.withDefaultResponse({ StatusCode: 200 });

      // Inject mock providers into the agent
      const agent = new SingleEmbedderAgent(
        defaultConfig,
        mockBedrockProvider,
        mockLambdaProvider,
      );

      const payload = {
        runId: "test-run",
        forms: [
          { formText: "hello", checksum: "hash-1", writtenForm: "hello" },
          { formText: "world", checksum: "hash-2", writtenForm: "world" },
        ],
      };

      const result = await agent.execute(payload);

      // Verify results from real agent logic
      expect(result.embeddings).toHaveLength(2);
      expect(result.embeddings[0].vector).toEqual([0.1, 0.2, 0.3]);
      expect(result.embeddings[1].vector).toEqual([0.4, 0.5, 0.6]);

      // Verify interactions via convenience methods
      const bedrockCommands = mockBedrockProvider.getCapturedCommands();
      expect(bedrockCommands).toHaveLength(2);

      const lambdaCommands = mockLambdaProvider.getCapturedCommands();
      expect(lambdaCommands).toHaveLength(1);
      expect(lambdaCommands[0].payload.embeddings).toHaveLength(2);
    });

    it("should handle partial failures gracefully", async () => {
      // Configure one form to fail
      mockBedrockProvider.withResponse("good", [0.1, 0.2, 0.3]);
      mockBedrockProvider.withFailureForText("bad");
      mockLambdaProvider.withDefaultResponse({ StatusCode: 200 });

      const agent = new SingleEmbedderAgent(
        defaultConfig,
        mockBedrockProvider,
        mockLambdaProvider,
      );

      const payload = {
        runId: "test-run",
        forms: [
          { formText: "good", checksum: "hash-1", writtenForm: "good" },
          { formText: "bad", checksum: "hash-2", writtenForm: "bad" },
        ],
      };

      const result = await agent.execute(payload);

      // Real provider logic handles partial success
      expect(result.embeddings).toHaveLength(1);
      expect(result.embeddings[0].checksum).toBe("hash-1");

      // Both forms were attempted
      expect(mockBedrockProvider.getCapturedCommands()).toHaveLength(2);

      // Only successful embedding was persisted
      expect(
        mockLambdaProvider.getCapturedCommands()[0].payload.embeddings,
      ).toHaveLength(1);
    });
  });
});
```

## Benefits of This Approach

### Testing Real Implementation

- Tests actual provider code, not mock subclasses
- Catches real bugs in error handling, response parsing, edge cases
- Uses production code paths

### Flexibility

- Easy to configure different responses per test
- Support for complex scenarios and partial failures
- Clear, chainable configuration API

### Verification

- Capture and verify SDK commands
- Inspect what was sent to the AWS SDK
- Validate request parameters

### Maintainability

- Changes to provider don't require updating mock subclasses
- Mock logic centralized in reusable utilities
- Clean separation between mock infrastructure and tests

## Comparison: Direct Injection vs Provider Wrappers

### Use Direct Injection When

- Testing the provider implementation itself
- One-off tests that don't need reusability
- Need maximum control over the mock client
- Testing provider error handling

### Use Provider Wrappers When

- Testing orchestration (agents, handlers) that use providers
- Same mock provider needed in multiple test suites
- Want cleaner, more readable test code
- Testing high-level business logic

## Next Steps

- For LocalStack configuration: See [AWS Client Configuration](./aws-client-config.md)
- For dependency injection: See [Dependency Injection](./dependency-injection.md)
- For decision guidance: See [Decision Guide](./decision-guide.md)
