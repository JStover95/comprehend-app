import { CloudFormationCustomResourceEvent } from "aws-lambda";
import {
  sendResponse,
  sendSuccess,
  sendFailure,
} from "../../../../lib/lambda/db-bootstrap/cfn-response-handler";
import { mockBaseEvent, mockContext } from "./cfn-response-handler.mock";
import * as https from "https";

// Mock https module
jest.mock("https");

describe("cfn-response-handler", () => {
  const baseEvent = mockBaseEvent();
  const context = mockContext();

  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create fresh mocks for each test
    mockResponse = {
      statusCode: 200,
      on: jest.fn((event: string, callback: () => void) => {
        if (event === "end") {
          // In the real implementation, resume() is called right after on("end", ...)
          // Fire the callback asynchronously to match real behavior
          process.nextTick(callback);
        }
        return mockResponse;
      }),
      resume: jest.fn(),
    };

    mockRequest = {
      on: jest.fn((event: string, callback: (error?: Error) => void) => {
        if (event === "error") {
          // Store error callback for testing
          mockRequest._errorCallback = callback;
        }
        return mockRequest;
      }),
      write: jest.fn(),
      end: jest.fn(),
    } as any;

    // Mock https.request to call the callback with mockResponse
    (https.request as jest.Mock).mockImplementation(
      (options, callback?: (res: typeof mockResponse) => void) => {
        // Call the callback with mockResponse synchronously
        if (callback) {
          callback(mockResponse);
        }
        return mockRequest;
      },
    );
  });

  describe("sendResponse", () => {
    it("should send SUCCESS response with all fields", async () => {
      await sendResponse(
        baseEvent,
        context,
        "SUCCESS",
        "Bootstrap completed",
        "physical-resource-id",
        { key: "value" },
      );

      expect(https.request).toHaveBeenCalledWith(
        expect.objectContaining({
          hostname:
            "cloudformation-custom-resource-response-useast1.s3.amazonaws.com",
          method: "PUT",
          path: "/test-bucket/test-path",
        }),
        expect.any(Function),
      );

      expect(mockRequest.write).toHaveBeenCalledWith(
        expect.stringContaining('"Status":"SUCCESS"'),
      );
      expect(mockRequest.write).toHaveBeenCalledWith(
        expect.stringContaining('"Reason":"Bootstrap completed"'),
      );
      expect(mockRequest.write).toHaveBeenCalledWith(
        expect.stringContaining('"PhysicalResourceId":"physical-resource-id"'),
      );
      expect(mockRequest.write).toHaveBeenCalledWith(
        expect.stringContaining('"Data":{"key":"value"}'),
      );
      expect(mockRequest.end).toHaveBeenCalled();
    });

    it("should send FAILED response with error reason", async () => {
      await sendResponse(
        baseEvent,
        context,
        "FAILED",
        "Bootstrap failed: Connection timeout",
        "physical-resource-id",
      );

      expect(mockRequest.write).toHaveBeenCalledWith(
        expect.stringContaining('"Status":"FAILED"'),
      );
      expect(mockRequest.write).toHaveBeenCalledWith(
        expect.stringContaining(
          '"Reason":"Bootstrap failed: Connection timeout"',
        ),
      );
    });

    it("should use logStreamName as default PhysicalResourceId when not provided", async () => {
      const eventWithoutPhysicalId: CloudFormationCustomResourceEvent = {
        ...baseEvent,
      };

      await sendResponse(eventWithoutPhysicalId, context, "SUCCESS");

      expect(mockRequest.write).toHaveBeenCalledWith(
        expect.stringContaining(
          `"PhysicalResourceId":"${context.logStreamName}"`,
        ),
      );
    });

    it("should use logStreamName as default Reason when not provided", async () => {
      await sendResponse(baseEvent, context, "SUCCESS");

      expect(mockRequest.write).toHaveBeenCalledWith(
        expect.stringContaining(`"Reason":"${context.logStreamName}"`),
      );
    });

    it("should reject when response status code is not 200", async () => {
      mockResponse.statusCode = 500;

      await expect(sendResponse(baseEvent, context, "SUCCESS")).rejects.toThrow(
        "Failed to send CloudFormation response: HTTP 500 no status message",
      );
    });

    it("should reject when request fails", async () => {
      const error = new Error("Network error");
      (https.request as jest.Mock).mockImplementation((options, callback) => {
        setTimeout(() => {
          if (callback) {
            callback(mockResponse);
          }
          if (mockRequest._errorCallback) {
            mockRequest._errorCallback(error);
          }
        }, 0);
        return mockRequest;
      });

      await expect(sendResponse(baseEvent, context, "SUCCESS")).rejects.toThrow(
        "Network error",
      );
    });

    it("should throw error when ResponseURL is missing", async () => {
      const eventWithoutUrl: CloudFormationCustomResourceEvent = {
        ...baseEvent,
        ResponseURL: undefined as any,
      };

      await expect(
        sendResponse(eventWithoutUrl, context, "SUCCESS"),
      ).rejects.toThrow("ResponseURL is missing from event");
    });
  });

  describe("sendSuccess", () => {
    it("should send SUCCESS response with message", async () => {
      await sendSuccess(
        baseEvent,
        context,
        "Bootstrap completed successfully",
        "physical-resource-id",
        { databaseName: "comprehend" },
      );

      expect(mockRequest.write).toHaveBeenCalledWith(
        expect.stringContaining('"Status":"SUCCESS"'),
      );
      expect(mockRequest.write).toHaveBeenCalledWith(
        expect.stringContaining('"Reason":"Bootstrap completed successfully"'),
      );
      expect(mockRequest.write).toHaveBeenCalledWith(
        expect.stringContaining('"PhysicalResourceId":"physical-resource-id"'),
      );
      expect(mockRequest.write).toHaveBeenCalledWith(
        expect.stringContaining('"Data":{"databaseName":"comprehend"}'),
      );
    });

    it("should send SUCCESS response without optional parameters", async () => {
      await sendSuccess(baseEvent, context);

      expect(mockRequest.write).toHaveBeenCalledWith(
        expect.stringContaining('"Status":"SUCCESS"'),
      );
    });
  });

  describe("sendFailure", () => {
    it("should send FAILED response with error message", async () => {
      const error = new Error("Database connection failed");
      await sendFailure(baseEvent, context, error, "physical-resource-id");

      expect(mockRequest.write).toHaveBeenCalledWith(
        expect.stringContaining('"Status":"FAILED"'),
      );
      expect(mockRequest.write).toHaveBeenCalledWith(
        expect.stringContaining('"Reason":"Database connection failed"'),
      );
      expect(mockRequest.write).toHaveBeenCalledWith(
        expect.stringContaining('"PhysicalResourceId":"physical-resource-id"'),
      );
    });

    it("should send FAILED response without physical resource ID", async () => {
      const error = new Error("Schema execution failed");
      await sendFailure(baseEvent, context, error);

      expect(mockRequest.write).toHaveBeenCalledWith(
        expect.stringContaining('"Status":"FAILED"'),
      );
      expect(mockRequest.write).toHaveBeenCalledWith(
        expect.stringContaining('"Reason":"Schema execution failed"'),
      );
    });
  });
});
