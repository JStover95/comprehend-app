import { CloudFormationCustomResourceEvent } from "aws-lambda";
import { ServiceConfig, ClientConfig } from "./types";
import { BootstrapError } from "./errors";

/**
 * Validates environment and builds service configuration from CloudFormation event
 * @param event - CloudFormation custom resource event
 * @returns Validated service configuration
 * @throws BootstrapError if required properties are missing
 */
export function validateConfig(
  event: CloudFormationCustomResourceEvent,
): ServiceConfig {
  // Extract required properties from event
  // Note: The ResourceProperties are typed as Record<string, any>, so we need to cast them to the correct types
  const secretArn =
    process.env.SECRET_ARN ||
    (event.ResourceProperties?.SecretArn as string | undefined);
  const clusterEndpoint =
    process.env.CLUSTER_ENDPOINT ||
    (event.ResourceProperties?.ClusterEndpoint as string | undefined);
  const clusterPort =
    process.env.CLUSTER_PORT ||
    (event.ResourceProperties?.ClusterPort as string | undefined) ||
    "5432";
  const databaseName =
    process.env.DATABASE_NAME ||
    (event.ResourceProperties?.DatabaseName as string | undefined);
  const iamUser =
    process.env.IAM_USER ||
    (event.ResourceProperties?.IamUser as string | undefined);

  // Optional with defaults
  const region =
    process.env.AWS_REGION ||
    (event.ResourceProperties?.Region as string | undefined) ||
    "us-east-1";
  const environment =
    process.env.ENVIRONMENT ||
    (event.ResourceProperties?.Environment as string | undefined) ||
    "production";

  // Validation
  if (!secretArn) {
    throw new BootstrapError("SECRET_ARN is required");
  }
  if (!clusterEndpoint) {
    throw new BootstrapError("CLUSTER_ENDPOINT is required");
  }
  if (!databaseName) {
    throw new BootstrapError("DATABASE_NAME is required");
  }
  if (!iamUser) {
    throw new BootstrapError("IAM_USER is required");
  }

  // Parse cluster port
  const port = parseInt(clusterPort, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new BootstrapError(
      `Invalid CLUSTER_PORT: ${clusterPort}. Must be a number between 1 and 65535`,
    );
  }

  // Build client configuration for AWS SDK
  const clientConfig: ClientConfig = {};

  // Override endpoint for local testing (LocalStack)
  if (process.env.AWS_ENDPOINT_URL) {
    clientConfig.endpoint = process.env.AWS_ENDPOINT_URL;
  }

  // Override credentials for local testing
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }

  return {
    secretArn,
    clusterEndpoint,
    clusterPort: port,
    databaseName,
    iamUser,
    region,
    environment,
    clientConfig,
  };
}
