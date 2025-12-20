# Testing Handler Entrypoints

## Overview

Lambda handler entrypoints orchestrate the execution flow but don't contain business logic. Testing them focuses on initialization, orchestration, and error handling rather than implementation details.

## Principle

**Use Jest spies to mock dependencies at the method level, focusing tests on orchestration flow rather than business logic.**

## Key Guidelines

1. **Mock at the method level** - Use `jest.spyOn()` instead of creating factory implementations
2. **Focus on orchestration** - Verify the handler calls the right methods in the right order
3. **Test error handling** - Ensure errors are caught and handled appropriately
4. **Keep tests simple** - Handler tests should be straightforward, not testing business logic

## Basic Handler Structure

```typescript
// handler.ts

import { Context, APIGatewayProxyEvent } from "aws-lambda";
import { RequestValidator } from "./validator";
import { DataProcessor } from "./processor";
import { ResponseBuilder } from "./response";

/**
 * Lambda handler - orchestrates the execution flow
 */
export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<any> {
  try {
    // Validate request
    const validator = new RequestValidator();
    const validatedInput = validator.validate(event);

    // Process data
    const processor = new DataProcessor();
    const result = await processor.process(validatedInput);

    // Build response
    const responseBuilder = new ResponseBuilder();
    return responseBuilder.success(result);
  } catch (error: any) {
    const responseBuilder = new ResponseBuilder();
    return responseBuilder.error(error);
  }
}
```

## Testing Handler with Spies

```typescript
// handler.test.ts

import { handler } from "./handler";
import { RequestValidator } from "./validator";
import { DataProcessor } from "./processor";
import { ResponseBuilder } from "./response";
import { APIGatewayProxyEvent, Context } from "aws-lambda";

describe("handler", () => {
  let mockValidate: jest.SpyInstance;
  let mockProcess: jest.SpyInstance;
  let mockSuccess: jest.SpyInstance;
  let mockError: jest.SpyInstance;

  beforeEach(() => {
    // Spy on the methods of the actual classes
    mockValidate = jest
      .spyOn(RequestValidator.prototype, "validate")
      .mockReturnValue({ data: "validated" });

    mockProcess = jest
      .spyOn(DataProcessor.prototype, "process")
      .mockResolvedValue({ data: "processed" });

    mockSuccess = jest
      .spyOn(ResponseBuilder.prototype, "success")
      .mockReturnValue({ statusCode: 200, body: "success" });

    mockError = jest
      .spyOn(ResponseBuilder.prototype, "error")
      .mockReturnValue({ statusCode: 500, body: "error" });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should execute the flow successfully", async () => {
    const event = { body: '{"test": true}' } as APIGatewayProxyEvent;
    const context = {} as Context;

    const result = await handler(event, context);

    // Verify the flow
    expect(mockValidate).toHaveBeenCalledWith(event);
    expect(mockProcess).toHaveBeenCalledWith({ data: "validated" });
    expect(mockSuccess).toHaveBeenCalledWith({ data: "processed" });
    expect(result).toEqual({ statusCode: 200, body: "success" });
  });

  it("should handle validation errors", async () => {
    const error = new Error("Invalid input");
    mockValidate.mockImplementation(() => {
      throw error;
    });

    const event = { body: "invalid" } as APIGatewayProxyEvent;
    const context = {} as Context;

    const result = await handler(event, context);

    // Verify error handling
    expect(mockValidate).toHaveBeenCalled();
    expect(mockProcess).not.toHaveBeenCalled();
    expect(mockError).toHaveBeenCalledWith(error);
    expect(result).toEqual({ statusCode: 500, body: "error" });
  });

  it("should call methods in correct order", async () => {
    const callOrder: string[] = [];

    mockValidate.mockImplementation(() => {
      callOrder.push("validate");
      return { data: "validated" };
    });

    mockProcess.mockImplementation(async () => {
      callOrder.push("process");
      return { data: "processed" };
    });

    mockSuccess.mockImplementation(() => {
      callOrder.push("success");
      return { statusCode: 200 };
    });

    const event = {} as APIGatewayProxyEvent;
    const context = {} as Context;

    await handler(event, context);

    expect(callOrder).toEqual(["validate", "process", "success"]);
  });
});
```

## Testing Handler with Agent Pattern

### Handler with Agent

```typescript
// handler.ts

import { CloudFormationCustomResourceEvent, Context } from "aws-lambda";
import { DbBootstrapAgent } from "./db-bootstrap-agent";
import { DbCredentialsProvider } from "./db-credentials-provider";
import { DbConnectionProvider } from "./db-connection-provider";
import { sendCfnResponse } from "./cfn-response-handler";

export async function handler(
  event: CloudFormationCustomResourceEvent,
  context: Context,
): Promise<void> {
  try {
    // Initialize providers
    const credentialsProvider = new DbCredentialsProvider(config);
    const connectionProvider = new DbConnectionProvider(config);

    // Initialize agent
    const agent = new DbBootstrapAgent(
      config,
      credentialsProvider,
      connectionProvider,
    );

    // Execute based on CloudFormation request type
    let result: string;
    switch (event.RequestType) {
      case "Create":
        result = await agent.handleCreate();
        break;
      case "Update":
        result = await agent.handleUpdate();
        break;
      case "Delete":
        result = await agent.handleDelete();
        break;
    }

    // Send success response
    await sendCfnResponse(event, context, "SUCCESS", result);
  } catch (error: any) {
    // Send failure response
    await sendCfnResponse(event, context, "FAILED", error.message);
    throw error;
  }
}
```

### Testing with Spies

```typescript
// handler.test.ts

import { handler } from "./handler";
import { DbBootstrapAgent } from "./db-bootstrap-agent";
import { DbCredentialsProvider } from "./db-credentials-provider";
import { DbConnectionProvider } from "./db-connection-provider";
import { sendCfnResponse } from "./cfn-response-handler";
import { CloudFormationCustomResourceEvent, Context } from "aws-lambda";

// Mock the CFN response handler
jest.mock("./cfn-response-handler");

describe("handler", () => {
  let mockHandleCreate: jest.SpyInstance;
  let mockHandleUpdate: jest.SpyInstance;
  let mockHandleDelete: jest.SpyInstance;
  let mockSendCfnResponse: jest.MockedFunction<typeof sendCfnResponse>;

  beforeEach(() => {
    // Spy on agent methods
    mockHandleCreate = jest
      .spyOn(DbBootstrapAgent.prototype, "handleCreate")
      .mockResolvedValue("create-result");

    mockHandleUpdate = jest
      .spyOn(DbBootstrapAgent.prototype, "handleUpdate")
      .mockResolvedValue("update-result");

    mockHandleDelete = jest
      .spyOn(DbBootstrapAgent.prototype, "handleDelete")
      .mockResolvedValue("delete-result");

    mockSendCfnResponse = sendCfnResponse as jest.MockedFunction<
      typeof sendCfnResponse
    >;
    mockSendCfnResponse.mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should handle Create request", async () => {
    const event = {
      RequestType: "Create",
      ResourceProperties: {},
    } as CloudFormationCustomResourceEvent;

    const context = {} as Context;

    await handler(event, context);

    expect(mockHandleCreate).toHaveBeenCalled();
    expect(mockSendCfnResponse).toHaveBeenCalledWith(
      event,
      context,
      "SUCCESS",
      "create-result",
    );
  });

  it("should handle Update request", async () => {
    const event = {
      RequestType: "Update",
      ResourceProperties: {},
    } as CloudFormationCustomResourceEvent;

    const context = {} as Context;

    await handler(event, context);

    expect(mockHandleUpdate).toHaveBeenCalled();
    expect(mockSendCfnResponse).toHaveBeenCalledWith(
      event,
      context,
      "SUCCESS",
      "update-result",
    );
  });

  it("should handle Delete request", async () => {
    const event = {
      RequestType: "Delete",
      ResourceProperties: {},
    } as CloudFormationCustomResourceEvent;

    const context = {} as Context;

    await handler(event, context);

    expect(mockHandleDelete).toHaveBeenCalled();
    expect(mockSendCfnResponse).toHaveBeenCalledWith(
      event,
      context,
      "SUCCESS",
      "delete-result",
    );
  });

  it("should handle agent errors", async () => {
    const error = new Error("Agent failed");
    mockHandleCreate.mockRejectedValue(error);

    const event = {
      RequestType: "Create",
      ResourceProperties: {},
    } as CloudFormationCustomResourceEvent;

    const context = {} as Context;

    await expect(handler(event, context)).rejects.toThrow("Agent failed");

    expect(mockSendCfnResponse).toHaveBeenCalledWith(
      event,
      context,
      "FAILED",
      "Agent failed",
    );
  });
});
```

## Testing Initialization Logic

```typescript
// handler.ts

import { validateEnvironment } from "./utils";

export async function handler(event: any, context: Context): Promise<any> {
  // Validate environment
  const config = validateEnvironment();

  // Create providers with config
  const storageProvider = new StorageProvider(config);
  const notificationService = new NotificationService(config);

  // Create agent
  const agent = new ProcessingAgent(storageProvider, notificationService);

  // Execute
  const result = await agent.execute(event.data);

  return { statusCode: 200, body: result };
}

// handler.test.ts

describe("handler", () => {
  let mockValidateEnvironment: jest.SpyInstance;
  let mockExecute: jest.SpyInstance;

  beforeEach(() => {
    mockValidateEnvironment = jest
      .spyOn(require("./utils"), "validateEnvironment")
      .mockReturnValue({
        region: "us-east-1",
        bucketArn: "arn:aws:s3:::test-bucket",
      });

    mockExecute = jest
      .spyOn(ProcessingAgent.prototype, "execute")
      .mockResolvedValue("result");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should validate environment and execute", async () => {
    const event = { data: "test" };
    const context = {} as Context;

    const result = await handler(event, context);

    expect(mockValidateEnvironment).toHaveBeenCalled();
    expect(mockExecute).toHaveBeenCalledWith("test");
    expect(result.statusCode).toBe(200);
  });

  it("should handle validation errors", async () => {
    mockValidateEnvironment.mockImplementation(() => {
      throw new Error("Missing environment variable");
    });

    const event = { data: "test" };
    const context = {} as Context;

    await expect(handler(event, context)).rejects.toThrow(
      "Missing environment variable",
    );
  });
});
```

## What to Test in Handlers

### ✅ Do Test

- Orchestration flow (correct sequence of calls)
- Error handling (try/catch behavior)
- Request type routing (Create/Update/Delete)
- Response building (success/failure)
- Initialization logic (environment validation, config)

### ❌ Don't Test

- Business logic (test in agent tests)
- Provider implementations (test in provider tests)
- Data transformations (test in utility tests)
- Complex error scenarios (test in agent tests)

## Benefits

1. **Focused Tests** - Handler tests are simple and focused on orchestration
2. **Fast Execution** - No real I/O, just verifying method calls
3. **Easy Maintenance** - Changes to business logic don't affect handler tests
4. **Clear Intent** - Tests document the execution flow
5. **Separation of Concerns** - Business logic tested separately

## Tips

1. **Keep it Simple** - Handler tests should be straightforward
2. **Mock at Method Level** - Use jest.spyOn, not factory classes
3. **Test the Flow** - Verify calls happen in the right order
4. **Test Error Paths** - Ensure errors are handled correctly
5. **Don't Test Implementation** - Focus on orchestration, not details

## Next Steps

- For testing agents: See [Dependency Injection](./dependency-injection.md)
- For testing providers: See [AWS SDK Mocking](./aws-sdk-mocking.md)
- For decision guidance: See [Decision Guide](./decision-guide.md)
