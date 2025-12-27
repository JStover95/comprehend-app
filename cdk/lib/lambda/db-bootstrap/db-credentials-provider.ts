import { Signer } from "@aws-sdk/rds-signer";
import { ServiceConfig } from "./types";
import { ConnectionError } from "./errors";

/**
 * Extracts AWS region from an ARN
 * @param arn - AWS resource ARN
 * @returns Region string (e.g., "us-east-1")
 */
function extractRegionFromArn(arn: string): string {
  // ARN format: arn:aws:service:region:account:resource
  const parts = arn.split(":");
  if (parts.length >= 4 && parts[3]) {
    return parts[3];
  }
  // Fallback to environment variable or default
  return process.env.AWS_REGION || "us-east-1";
}

/**
 * Provider for generating IAM database authentication tokens
 *
 * Uses RDS Signer to generate temporary authentication tokens
 * for IAM database authentication. These tokens are short-lived
 * and automatically rotated.
 */
export class DbCredentialsProvider {
  private signer: Signer;

  constructor(private readonly config: ServiceConfig) {
    // Extract region from secret ARN or use environment variable
    const region = extractRegionFromArn(config.secretArn);

    // Initialize RDS Signer
    this.signer = new Signer({
      region,
      hostname: config.clusterEndpoint,
      port: config.clusterPort,
      username: config.iamUser,
    });
  }

  /**
   * Generates an IAM authentication token for database connection
   *
   * The token is valid for 15 minutes and can be used as a password
   * when connecting to the database with the IAM username.
   *
   * @returns Promise resolving to the authentication token string
   * @throws ConnectionError if token generation fails
   */
  async createIamAuthToken(): Promise<string> {
    try {
      const token = await this.signer.getAuthToken();
      return token;
    } catch (error) {
      throw new ConnectionError(
        "Failed to generate IAM authentication token",
        error as Error,
      );
    }
  }
}

