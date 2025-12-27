import { CloudFormationCustomResourceEvent, Context } from "aws-lambda";
import { validateConfig } from "./config";
import { DbBootstrapAgent } from "./db-bootstrap-agent";
import { DbConnectionProvider } from "./db-connection-provider";
import { DbCredentialsProvider } from "./db-credentials-provider";
import { SchemaProvider } from "./schema-provider";
import { sendFailure } from "./cfn-response-handler";
import { BootstrapError } from "./errors";

/**
 * CloudFormation custom resource handler for database bootstrap
 *
 * Validates configuration, initializes the agent, and delegates to agent.run().
 * Handles any unhandled errors that may occur during initialization or execution.
 *
 * @param event - CloudFormation custom resource event
 * @param context - Lambda context
 */
export async function handler(
  event: CloudFormationCustomResourceEvent,
  context: Context,
): Promise<void> {
  console.log("Event received:", JSON.stringify(event, null, 2));

  try {
    // Step 1: Validate environment and parse configuration
    const config = validateConfig(event);

    // Step 2: Initialize providers
    const connectionProvider = new DbConnectionProvider(config);
    const schemaProvider = new SchemaProvider(config);
    const credentialsProvider = new DbCredentialsProvider(config);

    // Step 3: Initialize agent
    const agent = new DbBootstrapAgent(
      config,
      connectionProvider,
      schemaProvider,
      credentialsProvider,
    );

    // Step 4: Delegate to agent to handle the request
    await agent.run(event, context);
  } catch (error) {
    // Handle any unhandled errors (e.g., configuration errors, agent initialization failures)
    console.error("Handler error:", error);

    if (error instanceof BootstrapError) {
      console.error(`Bootstrap error: ${error.message}`);
      if (error.cause) {
        console.error(`Cause: ${error.cause.message}`);
      }
      console.error(`Stack trace:`, error.stack);
    } else {
      console.error("Unexpected error:", error);
    }

    // Send failure response for unhandled errors
    // Note: If the error occurred in agent.run(), it will have already sent a failure response
    // This is a safety net for errors that occur before agent.run() is called
    try {
      await sendFailure(event, context, error as Error);
    } catch (sendError) {
      // If sending failure response fails, log it but don't mask the original error
      console.error("Failed to send failure response:", sendError);
    }
    throw error;
  }
}
