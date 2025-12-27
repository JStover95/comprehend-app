import { Pool } from "pg";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { ServiceConfig } from "./types";
import { ConnectionError } from "./errors";

/**
 * Type guard to validate database credentials structure
 */
function isDatabaseCredentials(
  value: unknown,
): value is { username: string; password: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "username" in value &&
    "password" in value &&
    typeof (value as { username: unknown }).username === "string" &&
    typeof (value as { password: unknown }).password === "string"
  );
}

/**
 * Provider for managing database connection pools
 *
 * Handles creation of connection pools using either:
 * - Master credentials from Secrets Manager (for bootstrap operations)
 * - IAM authentication tokens (for service operations)
 */
export class DbConnectionProvider {
  private secretsManager: SecretsManagerClient;

  constructor(private readonly config: ServiceConfig) {
    if (config.clientConfig) {
      this.secretsManager = new SecretsManagerClient({
        endpoint: config.clientConfig.endpoint,
        credentials: config.clientConfig.credentials,
      });
    } else {
      this.secretsManager = new SecretsManagerClient();
    }
  }

  /**
   * Creates a connection pool using master credentials from Secrets Manager
   * Used during bootstrap operations when IAM authentication is not available
   *
   * @returns Connection pool configured with master credentials
   * @throws ConnectionError if credentials cannot be retrieved or pool creation fails
   */
  async createMasterPool(): Promise<Pool> {
    try {
      // Retrieve master credentials from Secrets Manager
      const response = await this.secretsManager.send(
        new GetSecretValueCommand({
          SecretId: this.config.secretArn,
        }),
      );

      if (!response.SecretString) {
        throw new ConnectionError(
          "Secret value is empty or missing SecretString",
        );
      }

      // Parse secret JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(response.SecretString);
      } catch (error) {
        throw new ConnectionError(
          "Failed to parse secret value as JSON",
          error as Error,
        );
      }

      // Validate structure using type guard
      if (!isDatabaseCredentials(parsed)) {
        throw new ConnectionError(
          "Secret value does not contain valid username and password fields",
        );
      }

      const credentials = parsed;

      // Create connection pool with master credentials
      const pool = new Pool({
        host: this.config.clusterEndpoint,
        port: this.config.clusterPort,
        database: this.config.databaseName,
        user: credentials.username,
        password: credentials.password,
        ssl: {
          rejectUnauthorized: true,
        },
        // Connection pool settings
        max: 5, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 10000, // Return error after 10 seconds if connection cannot be established
      });

      return pool;
    } catch (error) {
      if (error instanceof ConnectionError) {
        throw error;
      }
      throw new ConnectionError(
        "Failed to retrieve master credentials from Secrets Manager",
        error as Error,
      );
    }
  }
}
