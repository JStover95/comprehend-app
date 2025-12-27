import { DbBootstrapAgent } from "../../../../lib/lambda/db-bootstrap/db-bootstrap-agent";
import { ServiceConfig } from "../../../../lib/lambda/db-bootstrap/types";
import {
  BootstrapError,
  SchemaError,
  ConnectionError,
} from "../../../../lib/lambda/db-bootstrap/errors";
import { MockPool, asMockPool } from "../../../utils/mock-pool";
import { Pool } from "pg";
import { CloudFormationCustomResourceEvent, Context } from "aws-lambda";
import { mockCreateEvent } from "./config.mock";
import * as cfnResponseHandler from "../../../../lib/lambda/db-bootstrap/cfn-response-handler";

// Mock response handlers
jest.mock("../../../../lib/lambda/db-bootstrap/cfn-response-handler");

// ==========================================
// Test Configuration Constants
// ==========================================

const CLUSTER_ENDPOINT =
  "test-cluster.cluster-abc123.us-east-1.rds.amazonaws.com";
const CLUSTER_PORT = 5432;
const DB_NAME = "postgres";
const IAM_USERNAME = "db_service_user";
const SECRET_ARN =
  "arn:aws:secretsmanager:us-east-1:123456789012:secret:test-secret";

const baseConfig: ServiceConfig = {
  secretArn: SECRET_ARN,
  clusterEndpoint: CLUSTER_ENDPOINT,
  clusterPort: CLUSTER_PORT,
  databaseName: DB_NAME,
  iamUser: IAM_USERNAME,
  environment: "dev",
};

const mockContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: "test-function",
  functionVersion: "$LATEST",
  invokedFunctionArn:
    "arn:aws:lambda:us-east-1:123456789012:function:test-function",
  memoryLimitInMB: "128",
  awsRequestId: "test-request-id",
  logGroupName: "/aws/lambda/test-function",
  logStreamName: "2024/01/01/[$LATEST]test-stream",
  getRemainingTimeInMillis: () => 30000,
  done: jest.fn(),
  fail: jest.fn(),
  succeed: jest.fn(),
};

// ==========================================
// Mocks
// ==========================================

class MockDbConnectionProvider {
  private mockPool: MockPool;

  constructor(mockPool: MockPool) {
    this.mockPool = mockPool;
  }

  async createMasterPool(): Promise<Pool> {
    return asMockPool(this.mockPool);
  }
}

class MockSchemaProvider {
  private shouldFail = false;
  private error?: Error;

  withError(error: Error): this {
    this.shouldFail = true;
    this.error = error;
    return this;
  }

  async executeSchema(pool: Pool): Promise<void> {
    if (this.shouldFail) {
      throw this.error || new SchemaError("Schema execution failed");
    }
    // Simulate schema execution
    await pool.query("SELECT 1");
  }
}

// ==========================================
// Tests
// ==========================================

describe("DbBootstrapAgent", () => {
  let mockPool: MockPool;
  let mockConnectionProvider: MockDbConnectionProvider;
  let mockSchemaProvider: MockSchemaProvider;
  let mockSendSuccess: jest.SpyInstance;
  let mockSendFailure: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPool = new MockPool();
    mockConnectionProvider = new MockDbConnectionProvider(mockPool);
    mockSchemaProvider = new MockSchemaProvider();

    // Mock response handlers
    mockSendSuccess = jest
      .spyOn(cfnResponseHandler, "sendSuccess")
      .mockResolvedValue(undefined);

    mockSendFailure = jest
      .spyOn(cfnResponseHandler, "sendFailure")
      .mockResolvedValue(undefined);
  });

  describe("bootstrap", () => {
    it("should execute schema bootstrap successfully", async () => {
      // Arrange
      mockPool.withDefaultResponse({ rows: [], rowCount: 0 });
      const agent = new DbBootstrapAgent(
        baseConfig,
        mockConnectionProvider as any,
        mockSchemaProvider as any,
      );

      // Act
      await agent.bootstrap();

      // Assert
      // Verify pool was created and used
      expect(mockPool.getCapturedQueries().length).toBeGreaterThan(0);
      // Verify pool.end() was called
      expect(mockPool.wasEndCalled()).toBe(true);
    });

    it("should close connection pool after bootstrap", async () => {
      // Arrange
      mockPool.withDefaultResponse({ rows: [], rowCount: 0 });
      const agent = new DbBootstrapAgent(
        baseConfig,
        mockConnectionProvider as any,
        mockSchemaProvider as any,
      );

      // Act
      await agent.bootstrap();

      // Assert
      expect(mockPool.wasEndCalled()).toBe(true);
    });

    it("should throw BootstrapError if connection provider fails", async () => {
      // Arrange
      const connectionError = new ConnectionError("Connection failed");
      const failingProvider = {
        createMasterPool: jest.fn().mockRejectedValue(connectionError),
      };
      const agent = new DbBootstrapAgent(
        baseConfig,
        failingProvider as any,
        mockSchemaProvider as any,
      );

      // Act & Assert
      await expect(agent.bootstrap()).rejects.toThrow(BootstrapError);
      await expect(agent.bootstrap()).rejects.toThrow(
        "Failed to bootstrap database schema",
      );
    });

    it("should throw BootstrapError if schema provider fails", async () => {
      // Arrange
      mockPool.withDefaultResponse({ rows: [], rowCount: 0 });
      const schemaError = new SchemaError("Schema execution failed");
      mockSchemaProvider.withError(schemaError);
      const agent = new DbBootstrapAgent(
        baseConfig,
        mockConnectionProvider as any,
        mockSchemaProvider as any,
      );

      // Act & Assert
      await expect(agent.bootstrap()).rejects.toThrow(BootstrapError);
      await expect(agent.bootstrap()).rejects.toThrow(
        "Failed to bootstrap database schema",
      );
    });

    it("should ensure pool is closed even if schema execution fails", async () => {
      // Arrange
      mockPool.withDefaultResponse({ rows: [], rowCount: 0 });
      const schemaError = new SchemaError("Schema execution failed");
      mockSchemaProvider.withError(schemaError);
      const agent = new DbBootstrapAgent(
        baseConfig,
        mockConnectionProvider as any,
        mockSchemaProvider as any,
      );

      // Act & Assert
      await expect(agent.bootstrap()).rejects.toThrow();

      // Verify pool was still closed despite error
      expect(mockPool.wasEndCalled()).toBe(true);
    });

    it("should handle multiple bootstrap calls idempotently", async () => {
      // Arrange
      mockPool.withDefaultResponse({ rows: [], rowCount: 0 });
      const agent = new DbBootstrapAgent(
        baseConfig,
        mockConnectionProvider as any,
        mockSchemaProvider as any,
      );

      // Act - Execute bootstrap twice
      await agent.bootstrap();
      mockPool.clearCapturedQueries();
      await agent.bootstrap();

      // Assert - Should not throw errors
      expect(mockPool.wasEndCalled()).toBe(true);
    });
  });

  describe("run", () => {
    it("should route Create requests to handleCreate", async () => {
      // Arrange
      const event = mockCreateEvent();
      mockPool.withDefaultResponse({ rows: [], rowCount: 0 });
      const agent = new DbBootstrapAgent(
        baseConfig,
        mockConnectionProvider as any,
        mockSchemaProvider as any,
      );
      const handleCreateSpy = jest.spyOn(agent, "handleCreate");

      // Act
      await agent.run(event, mockContext);

      // Assert
      expect(handleCreateSpy).toHaveBeenCalledWith(event, mockContext);
    });

    it("should route Update requests to handleUpdate", async () => {
      // Arrange
      const createEvent = mockCreateEvent();
      const event: CloudFormationCustomResourceEvent = {
        ...createEvent,
        RequestType: "Update",
        PhysicalResourceId: "physical-resource-id",
        OldResourceProperties: createEvent.ResourceProperties,
      };
      const agent = new DbBootstrapAgent(
        baseConfig,
        mockConnectionProvider as any,
        mockSchemaProvider as any,
      );
      const handleUpdateSpy = jest.spyOn(agent, "handleUpdate");

      // Act
      await agent.run(event, mockContext);

      // Assert
      expect(handleUpdateSpy).toHaveBeenCalledWith(event, mockContext);
    });

    it("should route Delete requests to handleDelete", async () => {
      // Arrange
      const event: CloudFormationCustomResourceEvent = {
        ...mockCreateEvent(),
        RequestType: "Delete",
        PhysicalResourceId: "physical-resource-id",
      };
      const agent = new DbBootstrapAgent(
        baseConfig,
        mockConnectionProvider as any,
        mockSchemaProvider as any,
      );
      const handleDeleteSpy = jest.spyOn(agent, "handleDelete");

      // Act
      await agent.run(event, mockContext);

      // Assert
      expect(handleDeleteSpy).toHaveBeenCalledWith(event, mockContext);
    });

    it("should send failure response for invalid request type", async () => {
      // Arrange
      const event = {
        ...mockCreateEvent(),
        RequestType: "Invalid" as any,
      };
      const agent = new DbBootstrapAgent(
        baseConfig,
        mockConnectionProvider as any,
        mockSchemaProvider as any,
      );

      // Act
      await expect(agent.run(event, mockContext)).rejects.toThrow(
        BootstrapError,
      );

      // Assert
      expect(mockSendFailure).toHaveBeenCalledWith(
        event,
        mockContext,
        expect.any(BootstrapError),
      );
    });
  });

  describe("handleCreate", () => {
    it("should execute bootstrap and send success response", async () => {
      // Arrange
      const event = mockCreateEvent();
      mockPool.withDefaultResponse({ rows: [], rowCount: 0 });
      const agent = new DbBootstrapAgent(
        baseConfig,
        mockConnectionProvider as any,
        mockSchemaProvider as any,
      );

      // Act
      await agent.handleCreate(event, mockContext);

      // Assert
      expect(mockPool.getCapturedQueries().length).toBeGreaterThan(0);
      expect(mockPool.wasEndCalled()).toBe(true);
      expect(mockSendSuccess).toHaveBeenCalledWith(
        event,
        mockContext,
        "Database schema bootstrap completed successfully",
      );
      expect(mockSendFailure).not.toHaveBeenCalled();
    });

    it("should send failure response if bootstrap fails", async () => {
      // Arrange
      const event = mockCreateEvent();
      const schemaError = new SchemaError("Schema execution failed");
      mockSchemaProvider.withError(schemaError);
      mockPool.withDefaultResponse({ rows: [], rowCount: 0 });
      const agent = new DbBootstrapAgent(
        baseConfig,
        mockConnectionProvider as any,
        mockSchemaProvider as any,
      );

      // Act
      await expect(agent.handleCreate(event, mockContext)).rejects.toThrow(
        BootstrapError,
      );

      // Assert
      expect(mockSendFailure).toHaveBeenCalledWith(
        event,
        mockContext,
        expect.any(BootstrapError),
      );
      expect(mockSendSuccess).not.toHaveBeenCalled();
    });
  });

  describe("handleUpdate", () => {
    it("should send success response as no-op", async () => {
      // Arrange
      const createEvent = mockCreateEvent();
      const event: CloudFormationCustomResourceEvent = {
        ...createEvent,
        RequestType: "Update",
        PhysicalResourceId: "physical-resource-id",
        OldResourceProperties: createEvent.ResourceProperties,
      };
      const agent = new DbBootstrapAgent(
        baseConfig,
        mockConnectionProvider as any,
        mockSchemaProvider as any,
      );

      // Act
      await agent.handleUpdate(event, mockContext);

      // Assert
      expect(mockSendSuccess).toHaveBeenCalledWith(
        event,
        mockContext,
        "Update completed (no-op)",
        "physical-resource-id",
      );
      expect(mockSendFailure).not.toHaveBeenCalled();
      // Verify bootstrap was not called
      expect(mockPool.getCapturedQueries().length).toBe(0);
    });
  });

  describe("handleDelete", () => {
    it("should send success response as no-op", async () => {
      // Arrange
      const event: CloudFormationCustomResourceEvent = {
        ...mockCreateEvent(),
        RequestType: "Delete",
        PhysicalResourceId: "physical-resource-id",
      };
      const agent = new DbBootstrapAgent(
        baseConfig,
        mockConnectionProvider as any,
        mockSchemaProvider as any,
      );

      // Act
      await agent.handleDelete(event, mockContext);

      // Assert
      expect(mockSendSuccess).toHaveBeenCalledWith(
        event,
        mockContext,
        "Delete completed (no-op)",
        "physical-resource-id",
      );
      expect(mockSendFailure).not.toHaveBeenCalled();
      // Verify bootstrap was not called
      expect(mockPool.getCapturedQueries().length).toBe(0);
    });
  });
});
