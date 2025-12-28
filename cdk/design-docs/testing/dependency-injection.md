# Dependency Injection

## Overview

Initialize classes with mocked dependencies through constructor injection. This pattern makes dependencies explicit, simplifies testing, and improves code maintainability.

## Principle

**Use constructor injection to make dependencies explicit and enable easy substitution of mock implementations in tests.**

## Key Guidelines

1. **Constructor injection** - Pass dependencies through constructor parameters
2. **Accept interfaces** - Depend on interfaces or base classes, not concrete implementations
3. **Make dependencies explicit** - Constructor signature documents what a class needs
4. **Enable testability** - Easy to inject mocks for testing

## Basic Pattern

### Define Interfaces

```typescript
// interfaces.ts

export interface IStorageProvider {
  save(key: string, data: any): Promise<void>;
  load(key: string): Promise<any>;
}

export interface INotificationService {
  notify(message: string): Promise<void>;
}
```

### Implement Production Classes

```typescript
// storage-provider.ts

export class S3StorageProvider implements IStorageProvider {
  constructor(private readonly s3Client: S3Client) {}

  async save(key: string, data: any): Promise<void> {
    // Real S3 implementation
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: JSON.stringify(data),
      }),
    );
  }

  async load(key: string): Promise<any> {
    // Real S3 implementation
    const response = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    return JSON.parse(await response.Body.transformToString());
  }
}

// notification-service.ts

export class SNSNotificationService implements INotificationService {
  constructor(private readonly snsClient: SNSClient) {}

  async notify(message: string): Promise<void> {
    // Real SNS implementation
    await this.snsClient.send(
      new PublishCommand({
        TopicArn: this.topicArn,
        Message: message,
      }),
    );
  }
}
```

### Create Agent with Dependency Injection

```typescript
// processing-agent.ts

export class ProcessingAgent {
  constructor(
    private readonly storage: IStorageProvider,
    private readonly notifier: INotificationService,
  ) {}

  async processData(data: any): Promise<void> {
    // Process the data
    const processed = this.transform(data);

    // Save using injected storage
    await this.storage.save("result", processed);

    // Notify using injected notification service
    await this.notifier.notify("Processing complete");
  }

  private transform(data: any): any {
    // Transformation logic
    return { ...data, processed: true };
  }
}
```

## Testing with Dependency Injection

### Create Mock Implementations

```typescript
// mock-storage.ts

export class MockStorageProvider implements IStorageProvider {
  private storage = new Map<string, any>();

  async save(key: string, data: any): Promise<void> {
    this.storage.set(key, data);
  }

  async load(key: string): Promise<any> {
    return this.storage.get(key);
  }

  // Test helper methods
  getSaved(key: string): any {
    return this.storage.get(key);
  }

  clear(): void {
    this.storage.clear();
  }
}

// mock-notifier.ts

export class MockNotificationService implements INotificationService {
  private messages: string[] = [];

  async notify(message: string): Promise<void> {
    this.messages.push(message);
  }

  // Test helper methods
  getMessages(): string[] {
    return this.messages;
  }

  getLastMessage(): string | undefined {
    return this.messages[this.messages.length - 1];
  }

  clear(): void {
    this.messages = [];
  }
}
```

### Write Tests

```typescript
// processing-agent.test.ts

describe("ProcessingAgent", () => {
  let mockStorage: MockStorageProvider;
  let mockNotifier: MockNotificationService;
  let agent: ProcessingAgent;

  beforeEach(() => {
    // Create mocked dependencies
    mockStorage = new MockStorageProvider();
    mockNotifier = new MockNotificationService();

    // Inject mocks into the agent
    agent = new ProcessingAgent(mockStorage, mockNotifier);
  });

  it("should process and save data", async () => {
    // Execute the operation
    await agent.processData({ value: 123 });

    // Verify interactions
    expect(mockStorage.getSaved("result")).toEqual({
      value: 123,
      processed: true,
    });
    expect(mockNotifier.getMessages()).toContain("Processing complete");
  });

  it("should handle multiple operations", async () => {
    await agent.processData({ value: 1 });
    await agent.processData({ value: 2 });

    // Verify both were saved
    expect(mockStorage.getSaved("result")).toEqual({
      value: 2,
      processed: true,
    });

    // Verify both notifications
    expect(mockNotifier.getMessages()).toHaveLength(2);
  });

  it("should propagate storage errors", async () => {
    // Configure mock to throw error
    jest
      .spyOn(mockStorage, "save")
      .mockRejectedValue(new Error("Storage failed"));

    // Verify error propagates
    await expect(agent.processData({ value: 123 })).rejects.toThrow(
      "Storage failed",
    );
  });
});
```

## Advanced Pattern: Multiple Providers

### Agent with Multiple Dependencies

```typescript
// data-sync-agent.ts

export class DataSyncAgent {
  constructor(
    private readonly sourceStorage: IStorageProvider,
    private readonly targetStorage: IStorageProvider,
    private readonly notifier: INotificationService,
    private readonly logger: ILogger,
  ) {}

  async syncData(key: string): Promise<void> {
    this.logger.info(`Starting sync for key: ${key}`);

    try {
      // Load from source
      const data = await this.sourceStorage.load(key);

      // Save to target
      await this.targetStorage.save(key, data);

      // Notify success
      await this.notifier.notify(`Sync complete for ${key}`);

      this.logger.info(`Sync successful for key: ${key}`);
    } catch (error) {
      this.logger.error(`Sync failed for key: ${key}`, error);
      throw error;
    }
  }
}
```

### Testing with Multiple Mocks

```typescript
// data-sync-agent.test.ts

describe("DataSyncAgent", () => {
  let sourceStorage: MockStorageProvider;
  let targetStorage: MockStorageProvider;
  let notifier: MockNotificationService;
  let logger: MockLogger;
  let agent: DataSyncAgent;

  beforeEach(() => {
    sourceStorage = new MockStorageProvider();
    targetStorage = new MockStorageProvider();
    notifier = new MockNotificationService();
    logger = new MockLogger();

    agent = new DataSyncAgent(sourceStorage, targetStorage, notifier, logger);
  });

  it("should sync data between storages", async () => {
    // Prepare source data
    await sourceStorage.save("test-key", { value: 123 });

    // Execute sync
    await agent.syncData("test-key");

    // Verify data was copied
    expect(targetStorage.getSaved("test-key")).toEqual({ value: 123 });

    // Verify notification
    expect(notifier.getLastMessage()).toBe("Sync complete for test-key");

    // Verify logging
    expect(logger.getInfoLogs()).toContain("Starting sync for key: test-key");
    expect(logger.getInfoLogs()).toContain("Sync successful for key: test-key");
  });

  it("should handle source load errors", async () => {
    // Configure source to fail
    jest
      .spyOn(sourceStorage, "load")
      .mockRejectedValue(new Error("Source unavailable"));

    // Verify error handling
    await expect(agent.syncData("test-key")).rejects.toThrow(
      "Source unavailable",
    );

    // Verify nothing was saved to target
    expect(targetStorage.getSaved("test-key")).toBeUndefined();

    // Verify error was logged
    expect(logger.getErrorLogs()).toContain("Sync failed for key: test-key");
  });
});
```

## Production Usage

### Handler with Real Dependencies

```typescript
// handler.ts

import { ProcessingAgent } from "./processing-agent";
import { S3StorageProvider } from "./storage-provider";
import { SNSNotificationService } from "./notification-service";
import { S3Client } from "@aws-sdk/client-s3";
import { SNSClient } from "@aws-sdk/client-sns";

export async function handler(event: any, context: any): Promise<any> {
  // Create AWS clients
  const s3Client = new S3Client({ region: process.env.AWS_REGION });
  const snsClient = new SNSClient({ region: process.env.AWS_REGION });

  // Create real providers
  const storage = new S3StorageProvider(s3Client);
  const notifier = new SNSNotificationService(snsClient);

  // Inject real dependencies into agent
  const agent = new ProcessingAgent(storage, notifier);

  // Execute
  await agent.processData(event.data);

  return { statusCode: 200, body: "Success" };
}
```

## Benefits

1. **Testability** - Easy to inject mocks for testing
2. **Clarity** - Dependencies are explicit in constructor
3. **Flexibility** - Easy to swap implementations (e.g., different storage providers)
4. **Decoupling** - Classes depend on interfaces, not concrete implementations
5. **Maintainability** - Changes to dependencies don't affect dependent classes

## Patterns to Avoid

### ❌ Don't: Create Dependencies Internally

```typescript
// BAD: Hard to test
export class ProcessingAgent {
  private storage: IStorageProvider;

  constructor() {
    // Creates dependency internally - can't inject mock
    this.storage = new S3StorageProvider(new S3Client());
  }
}
```

### ✅ Do: Inject Dependencies

```typescript
// GOOD: Easy to test
export class ProcessingAgent {
  constructor(private readonly storage: IStorageProvider) {}
}
```

### ❌ Don't: Use Global State

```typescript
// BAD: Global state makes testing difficult
let globalStorage: IStorageProvider;

export class ProcessingAgent {
  async processData(data: any): Promise<void> {
    await globalStorage.save("result", data);
  }
}
```

### ✅ Do: Pass Dependencies

```typescript
// GOOD: Dependencies passed explicitly
export class ProcessingAgent {
  constructor(private readonly storage: IStorageProvider) {}

  async processData(data: any): Promise<void> {
    await this.storage.save("result", data);
  }
}
```

## Next Steps

- For mocking strategies: See [Mocking Strategy](./mocking-strategy.md)
- For factory patterns: See [Factory Pattern for Mocks](./factory-pattern.md)
- For AWS SDK mocking: See [AWS SDK Mocking](./aws-sdk-mocking.md)
