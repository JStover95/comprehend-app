import { CloudFormationCustomResourceEvent, Context } from "aws-lambda";
import { ServiceConfig } from "./types";
import { BootstrapError } from "./errors";
import { DbConnectionProvider } from "./db-connection-provider";
import { SchemaProvider } from "./schema-provider";
import { sendSuccess, sendFailure } from "./cfn-response-handler";

/**
 * Agent that orchestrates database bootstrap operations
 *
 * Coordinates between connection and schema providers to:
 * 1. Create database connection using master credentials
 * 2. Execute schema SQL to create tables, indexes, and constraints
 * 3. Ensure proper cleanup of connections
 * 4. Handle CloudFormation custom resource responses
 *
 * All operations are idempotent and can be safely retried.
 */
export class DbBootstrapAgent {
  constructor(
    private readonly config: ServiceConfig,
    private readonly connectionProvider: DbConnectionProvider,
    private readonly schemaProvider: SchemaProvider,
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
   * Creates a connection pool, executes the schema SQL, and ensures
   * the connection is properly closed even if errors occur.
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
      // Execute schema SQL
      await this.schemaProvider.executeSchema(pool);
    } catch (error) {
      // Ensure pool is closed even if schema execution fails
      await pool.end();
      throw new BootstrapError(
        "Failed to bootstrap database schema",
        error as Error,
      );
    } finally {
      // Always close the connection pool
      await pool.end();
    }
  }
}
