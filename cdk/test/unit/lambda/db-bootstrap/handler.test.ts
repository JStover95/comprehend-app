import { handler } from "../../../../lib/lambda/db-bootstrap/handler";
import { CloudFormationCustomResourceEvent, Context } from "aws-lambda";
import { DbBootstrapAgent } from "../../../../lib/lambda/db-bootstrap/db-bootstrap-agent";
import { mockCreateEvent } from "./config.mock";
import * as config from "../../../../lib/lambda/db-bootstrap/config";
import * as cfnResponseHandler from "../../../../lib/lambda/db-bootstrap/cfn-response-handler";

// Mock dependencies
jest.mock("../../../../lib/lambda/db-bootstrap/config");
jest.mock("../../../../lib/lambda/db-bootstrap/db-bootstrap-agent");
jest.mock("../../../../lib/lambda/db-bootstrap/cfn-response-handler");

// ==========================================
// Test Configuration Constants
// ==========================================

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
// Tests
// ==========================================

describe("handler", () => {
  let mockRun: jest.SpyInstance;
  let mockSendFailure: jest.SpyInstance;
  let mockValidateConfig: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock validateConfig
    mockValidateConfig = jest.spyOn(config, "validateConfig").mockReturnValue({
      secretArn: "arn:aws:secretsmanager:us-east-1:123456789012:secret:test",
      clusterEndpoint:
        "test-cluster.cluster-abc123.us-east-1.rds.amazonaws.com",
      clusterPort: 5432,
      databaseName: "postgres",
      iamUser: "db_service_user",
      region: "us-east-1",
      environment: "dev",
    });

    // Mock DbBootstrapAgent.run
    mockRun = jest
      .spyOn(DbBootstrapAgent.prototype, "run")
      .mockResolvedValue(undefined);

    // Mock response handlers
    mockSendFailure = jest
      .spyOn(cfnResponseHandler, "sendFailure")
      .mockResolvedValue(undefined);
  });

  describe("Create request", () => {
    it("should delegate to agent.run for Create request", async () => {
      // Arrange
      const event = mockCreateEvent();
      mockValidateConfig.mockReturnValue({
        secretArn: "arn:aws:secretsmanager:us-east-1:123456789012:secret:test",
        clusterEndpoint:
          "test-cluster.cluster-abc123.us-east-1.rds.amazonaws.com",
        clusterPort: 5432,
        databaseName: "postgres",
        iamUser: "db_service_user",
        region: "us-east-1",
        environment: "dev",
      });

      // Act
      await handler(event, mockContext);

      // Assert
      expect(mockValidateConfig).toHaveBeenCalledWith(event);
      expect(mockRun).toHaveBeenCalledWith(event, mockContext);
      expect(mockSendFailure).not.toHaveBeenCalled();
    });

    it("should handle errors from agent.run", async () => {
      // Arrange
      const event = mockCreateEvent();
      const bootstrapError = new Error("Bootstrap failed");
      mockRun.mockRejectedValue(bootstrapError);
      mockValidateConfig.mockReturnValue({
        secretArn: "arn:aws:secretsmanager:us-east-1:123456789012:secret:test",
        clusterEndpoint:
          "test-cluster.cluster-abc123.us-east-1.rds.amazonaws.com",
        clusterPort: 5432,
        databaseName: "postgres",
        iamUser: "db_service_user",
        region: "us-east-1",
        environment: "dev",
      });

      // Act
      await expect(handler(event, mockContext)).rejects.toThrow(bootstrapError);

      // Assert
      expect(mockRun).toHaveBeenCalledWith(event, mockContext);
      // Handler should send failure response as safety net
      expect(mockSendFailure).toHaveBeenCalledWith(
        event,
        mockContext,
        bootstrapError,
      );
    });
  });

  describe("Update request", () => {
    it("should delegate to agent.run for Update request", async () => {
      // Arrange
      const createEvent = mockCreateEvent();
      const event: CloudFormationCustomResourceEvent = {
        ...createEvent,
        RequestType: "Update",
        PhysicalResourceId: "physical-resource-id",
        OldResourceProperties: createEvent.ResourceProperties,
      };
      mockValidateConfig.mockReturnValue({
        secretArn: "arn:aws:secretsmanager:us-east-1:123456789012:secret:test",
        clusterEndpoint:
          "test-cluster.cluster-abc123.us-east-1.rds.amazonaws.com",
        clusterPort: 5432,
        databaseName: "postgres",
        iamUser: "db_service_user",
        region: "us-east-1",
        environment: "dev",
      });

      // Act
      await handler(event, mockContext);

      // Assert
      expect(mockRun).toHaveBeenCalledWith(event, mockContext);
      expect(mockSendFailure).not.toHaveBeenCalled();
    });
  });

  describe("Delete request", () => {
    it("should delegate to agent.run for Delete request", async () => {
      // Arrange
      const event: CloudFormationCustomResourceEvent = {
        ...mockCreateEvent(),
        RequestType: "Delete",
        PhysicalResourceId: "physical-resource-id",
      };
      mockValidateConfig.mockReturnValue({
        secretArn: "arn:aws:secretsmanager:us-east-1:123456789012:secret:test",
        clusterEndpoint:
          "test-cluster.cluster-abc123.us-east-1.rds.amazonaws.com",
        clusterPort: 5432,
        databaseName: "postgres",
        iamUser: "db_service_user",
        region: "us-east-1",
        environment: "dev",
      });

      // Act
      await handler(event, mockContext);

      // Assert
      expect(mockRun).toHaveBeenCalledWith(event, mockContext);
      expect(mockSendFailure).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("should handle configuration validation errors", async () => {
      // Arrange
      const event = mockCreateEvent();
      const configError = new Error("Invalid configuration");
      mockValidateConfig.mockImplementation(() => {
        throw configError;
      });

      // Act
      await expect(handler(event, mockContext)).rejects.toThrow(configError);

      // Assert
      expect(mockRun).not.toHaveBeenCalled();
      expect(mockSendFailure).toHaveBeenCalledWith(
        event,
        mockContext,
        configError,
      );
    });

    it("should handle errors from agent.run for invalid request type", async () => {
      // Arrange
      const event = {
        ...mockCreateEvent(),
        RequestType: "Invalid" as any,
      };
      const invalidRequestError = new Error("Invalid request type: Invalid");
      mockRun.mockRejectedValue(invalidRequestError);
      mockValidateConfig.mockReturnValue({
        secretArn: "arn:aws:secretsmanager:us-east-1:123456789012:secret:test",
        clusterEndpoint:
          "test-cluster.cluster-abc123.us-east-1.rds.amazonaws.com",
        clusterPort: 5432,
        databaseName: "postgres",
        iamUser: "db_service_user",
        region: "us-east-1",
        environment: "dev",
      });

      // Act
      await expect(handler(event, mockContext)).rejects.toThrow();

      // Assert
      expect(mockRun).toHaveBeenCalledWith(event, mockContext);
      expect(mockSendFailure).toHaveBeenCalled();
    });
  });
});
