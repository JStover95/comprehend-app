# Agent Pattern

This document describes the agent pattern used in this project. Agents are classes that orchestrate complex operations by coordinating between multiple providers and services.

## Table of Contents

- [Overview](#overview)
- [Agent Structure](#agent-structure)
- [Handler Pattern](#handler-pattern)
- [Complete Example](#complete-example)

## Overview

Agents are the core business logic layer in this architecture. They receive initialized providers and configuration, then orchestrate operations through well-defined, idempotent methods.

### Key Characteristics

- **Stateless orchestration**: Agents coordinate operations without maintaining state
- **Dependency injection**: All dependencies are provided through the constructor
- **Idempotent operations**: Individual steps can be safely retried
- **Clear separation of concerns**: Agents focus on workflow, providers handle implementation details

## Agent Structure

### Agent Principle

Agents should generally follow a similar pattern:

- Receive initialized providers and configuration
- Execution steps are isolated in idempotent functions for easy mocking in tests
- A single entry point function handles the overall workflow

### Basic Structure

```typescript
// types.ts

export interface AgentConfig {
  resourceId: string;
  region: string;
  environment: string;
}

// data-provider.ts

/**
 * Provider that handles data operations
 */
export class DataProvider {
  constructor(private readonly config: AgentConfig) {}

  async fetchData(id: string): Promise<any> {
    // Implementation
  }

  async saveData(data: any): Promise<void> {
    // Implementation
  }
}

// notification-provider.ts

/**
 * Provider that handles notifications
 */
export class NotificationProvider {
  constructor(private readonly config: AgentConfig) {}

  async sendNotification(message: string): Promise<void> {
    // Implementation
  }
}

// processing-agent.ts

/**
 * Agent that orchestrates data processing operations
 *
 * The agent receives initialized providers and configuration,
 * then coordinates the workflow through idempotent methods.
 */
export class ProcessingAgent {
  constructor(
    private readonly config: AgentConfig,
    private readonly dataProvider: DataProvider,
    private readonly notificationProvider: NotificationProvider,
  ) {}

  /**
   * Main entry point - handles the overall workflow
   */
  async execute(input: ProcessingInput): Promise<ProcessingResult> {
    console.log(`Starting processing for ${input.id}`);

    try {
      // Step 1: Fetch data
      const data = await this.fetchAndValidate(input.id);

      // Step 2: Transform data
      const transformed = await this.transformData(data);

      // Step 3: Save results
      await this.saveResults(transformed);

      // Step 4: Notify completion
      await this.notifyCompletion(input.id);

      console.log(`Processing completed for ${input.id}`);
      return {
        success: true,
        resourceId: input.id,
        message: "Processing completed successfully",
      };
    } catch (error: any) {
      console.error(`Processing failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Step 1: Fetch and validate data (idempotent)
   * Private method that can be easily tested/mocked
   */
  private async fetchAndValidate(id: string): Promise<any> {
    console.log(`Fetching data for ${id}`);
    const data = await this.dataProvider.fetchData(id);

    if (!data) {
      throw new Error(`Data not found for ${id}`);
    }

    console.log(`Data fetched successfully`);
    return data;
  }

  /**
   * Step 2: Transform data (idempotent, pure function)
   */
  private async transformData(data: any): Promise<any> {
    console.log(`Transforming data`);

    // Transformation logic
    const transformed = {
      ...data,
      processed: true,
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
    };

    console.log(`Data transformed successfully`);
    return transformed;
  }

  /**
   * Step 3: Save results (idempotent - can be safely retried)
   */
  private async saveResults(data: any): Promise<void> {
    console.log(`Saving results`);
    await this.dataProvider.saveData(data);
    console.log(`Results saved successfully`);
  }

  /**
   * Step 4: Notify completion (idempotent)
   */
  private async notifyCompletion(id: string): Promise<void> {
    console.log(`Sending completion notification`);
    await this.notificationProvider.sendNotification(
      `Processing completed for ${id}`,
    );
    console.log(`Notification sent successfully`);
  }
}
```

### Testing the Agent

```typescript
// processing-agent.test.ts

describe("ProcessingAgent", () => {
  let config: AgentConfig;
  let mockDataProvider: jest.Mocked<DataProvider>;
  let mockNotificationProvider: jest.Mocked<NotificationProvider>;
  let agent: ProcessingAgent;

  beforeEach(() => {
    config = {
      resourceId: "test-resource",
      region: "us-east-1",
      environment: "test",
    };

    // Create mocked providers
    mockDataProvider = {
      fetchData: jest.fn(),
      saveData: jest.fn(),
    } as any;

    mockNotificationProvider = {
      sendNotification: jest.fn(),
    } as any;

    // Initialize agent with mocked dependencies
    agent = new ProcessingAgent(
      config,
      mockDataProvider,
      mockNotificationProvider,
    );
  });

  it("should execute the complete workflow", async () => {
    // Setup mock responses
    mockDataProvider.fetchData.mockResolvedValue({ id: "123", value: "test" });
    mockDataProvider.saveData.mockResolvedValue(undefined);
    mockNotificationProvider.sendNotification.mockResolvedValue(undefined);

    const input = { id: "123" };
    const result = await agent.execute(input);

    // Verify workflow execution
    expect(mockDataProvider.fetchData).toHaveBeenCalledWith("123");
    expect(mockDataProvider.saveData).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "123",
        value: "test",
        processed: true,
        environment: "test",
      }),
    );
    expect(mockNotificationProvider.sendNotification).toHaveBeenCalledWith(
      "Processing completed for 123",
    );
    expect(result.success).toBe(true);
  });

  it("should handle errors during data fetch", async () => {
    mockDataProvider.fetchData.mockRejectedValue(new Error("Network error"));

    const input = { id: "123" };

    await expect(agent.execute(input)).rejects.toThrow("Network error");

    // Verify workflow stopped after failure
    expect(mockDataProvider.fetchData).toHaveBeenCalled();
    expect(mockDataProvider.saveData).not.toHaveBeenCalled();
    expect(mockNotificationProvider.sendNotification).not.toHaveBeenCalled();
  });

  it("should handle missing data", async () => {
    mockDataProvider.fetchData.mockResolvedValue(null);

    const input = { id: "123" };

    await expect(agent.execute(input)).rejects.toThrow(
      "Data not found for 123",
    );
  });
});
```

### Key Benefits of This Pattern

1. **Testability**: Each step is isolated and can be tested independently
2. **Maintainability**: Clear structure makes it easy to understand the workflow
3. **Flexibility**: Steps can be reordered or modified without affecting others
4. **Idempotency**: Each step can be safely retried on failure
5. **Observability**: Logging at each step provides clear execution traces

## Handler Pattern

### Handler Principle

Handlers should always follow a similar pattern across agents:

- Validate environment
- Initialize providers and agent
- Run agent
- Handle errors
- Send response

The exact implementation may vary based on the specific agent, but the overall pattern should be consistent.

### Handler Structure

```typescript
// handler.ts

import { CustomEvent, Context } from "aws-lambda";
import { ResponseHandler } from "./response-handler";
import { validateEnvironment } from "./utils";
import { DataProvider } from "./data-provider";
import { NotificationProvider } from "./notification-provider";
import { ProcessingAgent } from "./processing-agent";
import { ConfigurationError, ProcessingError } from "./errors";

/**
 * Lambda handler - orchestrates initialization and execution
 */
export async function handler(
  event: CustomEvent,
  context: Context,
): Promise<void> {
  console.log("Event received:", JSON.stringify(event, null, 2));

  // Initialize response handler
  const responseHandler = new ResponseHandler(event, context);

  try {
    // Step 1: Validate environment
    const config = validateEnvironment(event);

    // Step 2: Initialize providers
    const dataProvider = new DataProvider(config);
    const notificationProvider = new NotificationProvider(config);

    // Step 3: Initialize agent
    const agent = new ProcessingAgent(
      config,
      dataProvider,
      notificationProvider,
    );

    // Step 4: Run agent based on request type
    let result: string;
    switch (event.requestType) {
      case "Create":
        const createResult = await agent.execute(event.input);
        result = createResult.message;
        break;

      case "Update":
        // Update logic (often a no-op)
        result = "Update completed";
        await responseHandler.sendSuccess(result, event.resourceId);
        return;

      case "Delete":
        // Delete logic (often a no-op)
        result = "Delete completed";
        await responseHandler.sendSuccess(result, event.resourceId);
        return;

      default:
        throw new ConfigurationError(
          `Invalid request type: ${(event as any).requestType}`,
        );
    }

    // Step 5: Send success response
    await responseHandler.sendSuccess(result);
  } catch (error: any) {
    // Step 6: Handle errors with appropriate logging
    if (error instanceof ConfigurationError) {
      console.error(`Configuration error: ${error.message}`);
      console.error(`Stack trace:`, error.stack);
    } else if (error instanceof ProcessingError) {
      console.error(`Processing error: ${error.message}`);
      if (error.cause) {
        console.error(`Cause: ${error.cause.message}`);
      }
      console.error(`Stack trace:`, error.stack);
    } else {
      console.error("Unexpected error:", error);
    }

    // Step 7: Send failure response and rethrow
    await responseHandler.sendFailure(error);
    throw error;
  }
}
```

### Handler Testing

```typescript
// handler.test.ts

import { handler } from "./handler";
import { ResponseHandler } from "./response-handler";
import { ProcessingAgent } from "./processing-agent";

describe("handler", () => {
  let mockSendSuccess: jest.SpyInstance;
  let mockSendFailure: jest.SpyInstance;
  let mockExecute: jest.SpyInstance;

  beforeEach(() => {
    // Mock response handler methods
    mockSendSuccess = jest
      .spyOn(ResponseHandler.prototype, "sendSuccess")
      .mockResolvedValue(undefined);

    mockSendFailure = jest
      .spyOn(ResponseHandler.prototype, "sendFailure")
      .mockResolvedValue(undefined);

    // Mock agent methods
    mockExecute = jest
      .spyOn(ProcessingAgent.prototype, "execute")
      .mockResolvedValue({
        success: true,
        resourceId: "test-123",
        message: "Processing completed successfully",
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Create request", () => {
    it("should handle Create request successfully", async () => {
      const event = {
        requestType: "Create",
        input: { id: "test-123" },
      };
      const context = {} as Context;

      await handler(event as any, context);

      expect(mockExecute).toHaveBeenCalledWith(event.input);
      expect(mockSendSuccess).toHaveBeenCalledWith(
        "Processing completed successfully",
      );
      expect(mockSendFailure).not.toHaveBeenCalled();
    });
  });

  describe("Update request", () => {
    it("should handle Update request", async () => {
      const event = {
        requestType: "Update",
        resourceId: "test-123",
      };
      const context = {} as Context;

      await handler(event as any, context);

      expect(mockExecute).not.toHaveBeenCalled();
      expect(mockSendSuccess).toHaveBeenCalledWith(
        "Update completed",
        "test-123",
      );
    });
  });

  describe("Delete request", () => {
    it("should handle Delete request", async () => {
      const event = {
        requestType: "Delete",
        resourceId: "test-123",
      };
      const context = {} as Context;

      await handler(event as any, context);

      expect(mockExecute).not.toHaveBeenCalled();
      expect(mockSendSuccess).toHaveBeenCalledWith(
        "Delete completed",
        "test-123",
      );
    });
  });

  describe("Error handling", () => {
    it("should handle errors from agent", async () => {
      const testError = new Error("Processing failed");
      mockExecute.mockRejectedValue(testError);

      const event = {
        requestType: "Create",
        input: { id: "test-123" },
      };
      const context = {} as Context;

      await expect(handler(event as any, context)).rejects.toThrow(
        "Processing failed",
      );

      expect(mockSendFailure).toHaveBeenCalledWith(testError);
      expect(mockSendSuccess).not.toHaveBeenCalled();
    });

    it("should handle invalid request type", async () => {
      const event = {
        requestType: "Invalid",
      };
      const context = {} as Context;

      await expect(handler(event as any, context)).rejects.toThrow(
        "Invalid request type",
      );

      expect(mockSendFailure).toHaveBeenCalled();
    });
  });

  describe("Execution flow", () => {
    it("should call components in correct order", async () => {
      const callOrder: string[] = [];

      mockExecute.mockImplementation(async () => {
        callOrder.push("execute");
        return {
          success: true,
          resourceId: "test-123",
          message: "Done",
        };
      });

      mockSendSuccess.mockImplementation(async () => {
        callOrder.push("sendSuccess");
      });

      const event = {
        requestType: "Create",
        input: { id: "test-123" },
      };
      const context = {} as Context;

      await handler(event as any, context);

      expect(callOrder).toEqual(["execute", "sendSuccess"]);
    });
  });
});
```

## Complete Example

Here's a complete example showing how an agent and handler work together:

```typescript
// ====================================
// Configuration and Types
// ====================================

// config.ts
export interface ServiceConfig {
  apiEndpoint: string;
  timeout: number;
  retries: number;
  clientConfig: {
    endpoint?: string;
    credentials?: {
      accessKeyId: string;
      secretAccessKey: string;
    };
  };
}

// ====================================
// Providers
// ====================================

// api-provider.ts
export class ApiProvider {
  constructor(private readonly config: ServiceConfig) {}

  async callApi(endpoint: string, payload: any): Promise<any> {
    // API call implementation
    console.log(`Calling API: ${endpoint}`);
    return { status: "success", data: payload };
  }
}

// storage-provider.ts
export class StorageProvider {
  constructor(private readonly config: ServiceConfig) {}

  async store(key: string, value: any): Promise<void> {
    console.log(`Storing data with key: ${key}`);
    // Storage implementation
  }

  async retrieve(key: string): Promise<any> {
    console.log(`Retrieving data with key: ${key}`);
    // Retrieval implementation
    return { key, value: "stored-data" };
  }
}

// ====================================
// Agent
// ====================================

// service-agent.ts
export class ServiceAgent {
  constructor(
    private readonly config: ServiceConfig,
    private readonly apiProvider: ApiProvider,
    private readonly storageProvider: StorageProvider,
  ) {}

  /**
   * Main workflow entry point
   */
  async processRequest(requestId: string, data: any): Promise<string> {
    console.log(`Processing request ${requestId}`);

    try {
      // Step 1: Retrieve existing data
      const existingData = await this.retrieveExistingData(requestId);

      // Step 2: Merge with new data
      const mergedData = this.mergeData(existingData, data);

      // Step 3: Call external API
      const apiResult = await this.callExternalApi(mergedData);

      // Step 4: Store result
      await this.storeResult(requestId, apiResult);

      console.log(`Request ${requestId} processed successfully`);
      return "Request processed successfully";
    } catch (error: any) {
      console.error(`Failed to process request ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Idempotent step: Retrieve existing data
   */
  private async retrieveExistingData(requestId: string): Promise<any> {
    console.log(`Retrieving existing data for ${requestId}`);
    return await this.storageProvider.retrieve(requestId);
  }

  /**
   * Pure function: Merge data
   */
  private mergeData(existing: any, newData: any): any {
    console.log(`Merging data`);
    return {
      ...existing,
      ...newData,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Idempotent step: Call external API
   */
  private async callExternalApi(data: any): Promise<any> {
    console.log(`Calling external API`);
    return await this.apiProvider.callApi("/process", data);
  }

  /**
   * Idempotent step: Store result
   */
  private async storeResult(requestId: string, result: any): Promise<void> {
    console.log(`Storing result for ${requestId}`);
    await this.storageProvider.store(requestId, result);
  }
}

// ====================================
// Handler
// ====================================

// handler.ts
import { APIGatewayProxyEvent, Context } from "aws-lambda";

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<any> {
  console.log("Request received:", JSON.stringify(event, null, 2));

  try {
    // Step 1: Validate environment
    const config: ServiceConfig = {
      apiEndpoint: process.env.API_ENDPOINT || "https://api.example.com",
      timeout: parseInt(process.env.TIMEOUT || "30000"),
      retries: parseInt(process.env.RETRIES || "3"),
      clientConfig: {
        endpoint: process.env.AWS_ENDPOINT_URL,
        credentials: process.env.AWS_ACCESS_KEY_ID
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            }
          : undefined,
      },
    };

    // Step 2: Parse request
    const requestId = event.requestContext.requestId;
    const data = JSON.parse(event.body || "{}");

    // Step 3: Initialize providers
    const apiProvider = new ApiProvider(config);
    const storageProvider = new StorageProvider(config);

    // Step 4: Initialize agent
    const agent = new ServiceAgent(config, apiProvider, storageProvider);

    // Step 5: Execute workflow
    const result = await agent.processRequest(requestId, data);

    // Step 6: Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: result,
      }),
    };
  } catch (error: any) {
    console.error("Request failed:", error);

    // Step 7: Return error response
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
}
```

## Summary

The agent pattern provides a consistent, testable structure for orchestrating complex operations:

1. **Agents** orchestrate workflows by coordinating between providers
2. **Providers** handle specific implementation details (API calls, database operations, etc.)
3. **Handlers** manage initialization and request routing
4. **Idempotent steps** allow for safe retries and clear testing
5. **Dependency injection** enables easy mocking and testing

This pattern ensures that business logic is clearly separated from infrastructure concerns, making the codebase maintainable and testable.
