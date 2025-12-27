import {
  CloudFormationCustomResourceEvent,
  CloudFormationCustomResourceResponse,
  Context,
} from "aws-lambda";
import * as https from "https";
import { IncomingMessage } from "http";
import { URL } from "url";

/**
 * Sends a CloudFormation custom resource response
 * @param event - CloudFormation custom resource event
 * @param context - Lambda context
 * @param status - Response status (SUCCESS or FAILED)
 * @param reason - Optional reason for failure
 * @param physicalResourceId - Optional physical resource ID
 * @param data - Optional response data
 */
export async function sendResponse(
  event: CloudFormationCustomResourceEvent,
  context: Context,
  status: "SUCCESS" | "FAILED",
  reason?: string,
  physicalResourceId?: string,
  data?: Record<string, unknown>,
): Promise<void> {
  const responseUrl = event.ResponseURL;
  if (!responseUrl) {
    throw new Error("ResponseURL is missing from event");
  }

  // PhysicalResourceId exists on Update and Delete events, but not Create events
  const eventPhysicalResourceId =
    "PhysicalResourceId" in event ? event.PhysicalResourceId : undefined;

  const responseBody: CloudFormationCustomResourceResponse = {
    Status: status,
    Reason: reason || context.logStreamName || "See CloudWatch Logs",
    PhysicalResourceId:
      physicalResourceId || eventPhysicalResourceId || context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    NoEcho: false,
    Data: data,
  };

  const responseBodyString = JSON.stringify(responseBody);

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(responseUrl);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "PUT",
      headers: {
        "Content-Type": "",
        "Content-Length": responseBodyString.length,
      },
    };

    const req = https.request(options, (res: IncomingMessage) => {
      res.on("end", () => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(
            new Error(
              `Failed to send CloudFormation response: ${res.statusCode}`,
            ),
          );
        }
      });
      res.resume();
    });

    req.on("error", (error: Error) => {
      reject(
        new Error(`Failed to send CloudFormation response: ${error.message}`),
      );
    });

    req.write(responseBodyString);
    req.end();
  });
}

/**
 * Sends a success response to CloudFormation
 * @param event - CloudFormation custom resource event
 * @param context - Lambda context
 * @param message - Success message
 * @param physicalResourceId - Optional physical resource ID
 * @param data - Optional response data
 */
export async function sendSuccess(
  event: CloudFormationCustomResourceEvent,
  context: Context,
  message?: string,
  physicalResourceId?: string,
  data?: Record<string, unknown>,
): Promise<void> {
  return sendResponse(
    event,
    context,
    "SUCCESS",
    message,
    physicalResourceId,
    data,
  );
}

/**
 * Sends a failure response to CloudFormation
 * @param event - CloudFormation custom resource event
 * @param context - Lambda context
 * @param error - Error that caused the failure
 * @param physicalResourceId - Optional physical resource ID
 */
export async function sendFailure(
  event: CloudFormationCustomResourceEvent,
  context: Context,
  error: Error,
  physicalResourceId?: string,
): Promise<void> {
  return sendResponse(
    event,
    context,
    "FAILED",
    error.message,
    physicalResourceId,
  );
}
