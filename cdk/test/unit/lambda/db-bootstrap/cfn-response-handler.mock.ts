import { CloudFormationCustomResourceEvent, Context } from "aws-lambda";

/**
 * Factory function to create a mock CloudFormation custom resource event
 */
export function mockBaseEvent(): CloudFormationCustomResourceEvent {
  return {
    RequestType: "Create",
    ResponseURL:
      "https://cloudformation-custom-resource-response-useast1.s3.amazonaws.com/test-bucket/test-path",
    StackId:
      "arn:aws:cloudformation:us-east-1:123456789012:stack/TestStack/abc123",
    RequestId: "test-request-id",
    ResourceType: "Custom::DatabaseBootstrap",
    LogicalResourceId: "DatabaseBootstrap",
    ResourceProperties: {
      ServiceToken:
        "arn:aws:lambda:us-east-1:123456789012:function:test-function",
      SecretArn:
        "arn:aws:secretsmanager:us-east-1:123456789012:secret:test-secret",
      ClusterEndpoint:
        "test-cluster.cluster-abc123.us-east-1.rds.amazonaws.com",
      ClusterPort: "5432",
      DatabaseName: "comprehend",
      IamUser: "db_service_user",
      Region: "us-east-1",
      Environment: "dev",
    },
    ServiceToken:
      "arn:aws:lambda:us-east-1:123456789012:function:test-function",
  };
}

/**
 * Factory function to create a mock Lambda context
 */
export function mockContext(): Context {
  return {
    awsRequestId: "test-request-id",
    functionName: "test-function",
    functionVersion: "$LATEST",
    invokedFunctionArn:
      "arn:aws:lambda:us-east-1:123456789012:function:test-function",
    memoryLimitInMB: "128",
    logGroupName: "/aws/lambda/test-function",
    logStreamName: "2024/01/01/[$LATEST]test-stream",
    getRemainingTimeInMillis: () => 30000,
    done: jest.fn(),
    fail: jest.fn(),
    succeed: jest.fn(),
    callbackWaitsForEmptyEventLoop: false,
  };
}
