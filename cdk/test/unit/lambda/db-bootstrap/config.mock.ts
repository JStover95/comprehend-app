import {
  CloudFormationCustomResourceCreateEvent,
  CloudFormationCustomResourceUpdateEvent,
  CloudFormationCustomResourceDeleteEvent,
} from "aws-lambda";

/**
 * Factory function to create a mock CloudFormation Create event
 */
export function mockCreateEvent(): CloudFormationCustomResourceCreateEvent {
  return {
    RequestType: "Create",
    StackId:
      "arn:aws:cloudformation:us-east-1:123456789012:stack/TestStack/abc123",
    RequestId: "test-request-id",
    LogicalResourceId: "DatabaseBootstrap",
    ResponseURL:
      "https://cloudformation-custom-resource-response-useast1.s3.amazonaws.com/test-bucket/test-path",
    ServiceToken:
      "arn:aws:lambda:us-east-1:123456789012:function:test-function",
    ResourceType: "Custom::DatabaseBootstrap",
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
  };
}

/**
 * Factory function to create a mock CloudFormation Update event
 */
export function mockUpdateEvent(): CloudFormationCustomResourceUpdateEvent {
  return {
    RequestType: "Update",
    StackId:
      "arn:aws:cloudformation:us-east-1:123456789012:stack/TestStack/abc123",
    RequestId: "test-request-id",
    LogicalResourceId: "DatabaseBootstrap",
    ResponseURL:
      "https://cloudformation-custom-resource-response-useast1.s3.amazonaws.com/test-bucket/test-path",
    ServiceToken:
      "arn:aws:lambda:us-east-1:123456789012:function:test-function",
    PhysicalResourceId: "test-physical-resource-id",
    OldResourceProperties: {
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
    ResourceType: "Custom::DatabaseBootstrap",
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
  };
}

/**
 * Factory function to create a mock CloudFormation Delete event
 */
export function mockDeleteEvent(): CloudFormationCustomResourceDeleteEvent {
  return {
    RequestType: "Delete",
    StackId:
      "arn:aws:cloudformation:us-east-1:123456789012:stack/TestStack/abc123",
    RequestId: "test-request-id",
    LogicalResourceId: "DatabaseBootstrap",
    ResponseURL:
      "https://cloudformation-custom-resource-response-useast1.s3.amazonaws.com/test-bucket/test-path",
    ServiceToken:
      "arn:aws:lambda:us-east-1:123456789012:function:test-function",
    PhysicalResourceId: "test-physical-resource-id",
    ResourceType: "Custom::DatabaseBootstrap",
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
  };
}
