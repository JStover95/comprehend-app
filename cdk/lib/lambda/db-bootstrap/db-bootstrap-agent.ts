import { CloudFormationCustomResourceEvent, Context } from "aws-lambda";
import { Pool } from "pg";
import { ServiceConfig } from "./types";
import { BootstrapError } from "./errors";
import { DbConnectionProvider } from "./db-connection-provider";
import { DbCredentialsProvider } from "./db-credentials-provider";
import { SchemaProvider } from "./schema-provider";
import { sendSuccess, sendFailure } from "./cfn-response-handler";

/**
 * Agent that orchestrates database bootstrap operations
 *
 * Coordinates between connection and schema providers to:
 * 1. Create database connection using master credentials
 * 2. Create IAM database user (if not exists)
 * 3. Execute schema SQL to create tables, indexes, and constraints
 * 4. Test IAM connection to verify authentication works
 * 5. Ensure proper cleanup of connections
 * 6. Handle CloudFormation custom resource responses
 *
 * All operations are idempotent and can be safely retried.
 */
export class DbBootstrapAgent {
  constructor(
    private readonly config: ServiceConfig,
    private readonly connectionProvider: DbConnectionProvider,
    private readonly schemaProvider: SchemaProvider,
    private readonly credentialsProvider?: DbCredentialsProvider,
  ) {}

  /**
   * Main entry point for handling CloudFormation custom resource events
   *
   * Routes to appropriate handler based on request type and sends
   * success/failure responses to CloudFormation.
   *
   * @param event - CloudFormation custom resource event
   * @param context - Lambda context
   */
  async run(
    event: CloudFormationCustomResourceEvent,
    context: Context,
  ): Promise<void> {
    if (event.RequestType === "Create") {
      await this.handleCreate(event, context);
    } else if (event.RequestType === "Update") {
      await this.handleUpdate(event, context);
    } else if (event.RequestType === "Delete") {
      await this.handleDelete(event, context);
    } else {
      // TypeScript exhaustiveness check - this should never happen
      const requestType = (event as { RequestType: string }).RequestType;
      const error = new BootstrapError(`Invalid request type: ${requestType}`);
      await sendFailure(event, context, error);
      throw error;
    }
  }

  /**
   * Handles Create requests by executing database bootstrap
   *
   * @param event - CloudFormation custom resource event
   * @param context - Lambda context
   */
  async handleCreate(
    event: CloudFormationCustomResourceEvent,
    context: Context,
  ): Promise<void> {
    try {
      await this.bootstrap();
      await sendSuccess(
        event,
        context,
        "Database schema bootstrap completed successfully",
      );
    } catch (error) {
      await sendFailure(event, context, error as Error);
      throw error;
    }
  }

  /**
   * Handles Update requests as no-op
   *
   * Schema changes are handled separately, not via CloudFormation updates.
   *
   * @param event - CloudFormation custom resource event
   * @param context - Lambda context
   */
  async handleUpdate(
    event: CloudFormationCustomResourceEvent,
    context: Context,
  ): Promise<void> {
    console.log("Update request - no-op (schema persists)");
    const physicalResourceId =
      "PhysicalResourceId" in event ? event.PhysicalResourceId : undefined;
    await sendSuccess(
      event,
      context,
      "Update completed (no-op)",
      physicalResourceId,
    );
  }

  /**
   * Handles Delete requests as no-op
   *
   * Database deletion is handled by CDK construct, not custom resource.
   *
   * @param event - CloudFormation custom resource event
   * @param context - Lambda context
   */
  async handleDelete(
    event: CloudFormationCustomResourceEvent,
    context: Context,
  ): Promise<void> {
    console.log(
      "Delete request - no-op (database deletion handled by construct)",
    );
    const physicalResourceId =
      "PhysicalResourceId" in event ? event.PhysicalResourceId : undefined;
    await sendSuccess(
      event,
      context,
      "Delete completed (no-op)",
      physicalResourceId,
    );
  }

  /**
   * Executes the database bootstrap process
   *
   * Creates a connection pool, creates IAM database user, executes the schema SQL,
   * tests IAM connection, and ensures the connection is properly closed even if errors occur.
   *
   * @throws BootstrapError if any step of the bootstrap process fails
   */
  async bootstrap(): Promise<void> {
    let pool;
    try {
      // Create connection pool using master credentials
      pool = await this.connectionProvider.createMasterPool();
    } catch (error) {
      // Wrap connection errors in BootstrapError
      throw new BootstrapError(
        "Failed to bootstrap database schema",
        error as Error,
      );
    }

    try {
      // Step 1: Create IAM database user (idempotent)
      await this.createIamUser(pool);

      // Step 2: Execute schema SQL
      await this.schemaProvider.executeSchema(pool);

      // Step 3: Test IAM connection (if credentials provider is available)
      if (this.credentialsProvider) {
        await this.testIamConnection();
      }
    } catch (error) {
      throw new BootstrapError(
        "Failed to bootstrap database schema",
        error as Error,
      );
    } finally {
      // Always close the connection pool if it was created
      if (pool) {
        await pool.end();
      }
    }
  }

  /**
   * Creates IAM database user if it doesn't exist (idempotent)
   *
   * Uses a DO block with exception handling to make this idempotent,
   * as PostgreSQL doesn't support IF NOT EXISTS with CREATE USER.
   * Uses PostgreSQL's quote_ident() function to safely escape identifiers.
   * Grants necessary privileges for IAM authentication and database access.
   *
   * @param pool - Database connection pool
   * @throws BootstrapError if user creation fails
   */
  private async createIamUser(pool: Pool): Promise<void> {
    try {
      // Use DO block with quote_ident() to safely escape username
      // PostgreSQL doesn't support IF NOT EXISTS with CREATE USER
      const createUserQuery = `
        DO $$
        DECLARE
          username TEXT := $1;
        BEGIN
          IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = username) THEN
            EXECUTE 'CREATE USER ' || quote_ident(username);
          END IF;
        END
        $$;
      `;
      await pool.query(createUserQuery, [this.config.iamUser]);

      // Grant IAM authentication role and database privileges
      // Execute GRANT statements using EXECUTE with quote_ident() for safe escaping
      const grantQuery = `
        DO $$
        DECLARE
          username TEXT := $1;
          dbname TEXT := $2;
        BEGIN
          EXECUTE 'GRANT rds_iam TO ' || quote_ident(username);
          EXECUTE 'GRANT CONNECT ON DATABASE ' || quote_ident(dbname) || ' TO ' || quote_ident(username);
          EXECUTE 'GRANT USAGE ON SCHEMA public TO ' || quote_ident(username);
          EXECUTE 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ' || quote_ident(username);
          EXECUTE 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ' || quote_ident(username);
          EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ' || quote_ident(username);
        END
        $$;
      `;
      await pool.query(grantQuery, [
        this.config.iamUser,
        this.config.databaseName,
      ]);

      console.log(
        `IAM database user '${this.config.iamUser}' created or already exists with privileges granted`,
      );
    } catch (error) {
      throw new BootstrapError(
        `Failed to create IAM database user '${this.config.iamUser}'`,
        error as Error,
      );
    }
  }

  /**
   * Tests IAM connection by generating a token and connecting to the database
   *
   * @throws BootstrapError if IAM connection test fails
   */
  private async testIamConnection(): Promise<void> {
    if (!this.credentialsProvider) {
      console.log(
        "Credentials provider not available, skipping IAM connection test",
      );
      return;
    }

    let iamPool;
    try {
      // Generate IAM authentication token
      const authToken = await this.credentialsProvider.createIamAuthToken();

      // Create IAM connection pool
      iamPool = this.connectionProvider.createIamPool(authToken);

      // Test connection with a simple query
      await iamPool.query("SELECT 1");
      console.log("IAM connection test successful");
    } catch (error) {
      // Log error but don't fail bootstrap if IAM test fails
      // (schema bootstrap is more critical)
      console.error("IAM connection test failed:", error);
      throw new BootstrapError("IAM connection test failed", error as Error);
    } finally {
      // Always close IAM pool
      if (iamPool) {
        await iamPool.end();
      }
    }
  }
}
