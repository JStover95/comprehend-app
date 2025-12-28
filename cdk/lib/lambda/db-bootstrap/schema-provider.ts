import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import { ServiceConfig } from "./types";
import { SchemaError } from "./errors";

/**
 * Provider for executing database schema SQL
 *
 * Reads schema.sql from the bundled Lambda package and executes it
 * against the database. All SQL statements use IF NOT EXISTS patterns
 * to ensure idempotent execution.
 */
export class SchemaProvider {
  constructor(private readonly config: ServiceConfig) {}

  /**
   * Executes the schema SQL file against the database
   *
   * The schema.sql file is bundled with the Lambda function and contains:
   * - pg_bigm extension installation
   * - All table definitions
   * - All indexes
   * - All foreign key constraints
   *
   * All operations use IF NOT EXISTS to ensure idempotency.
   *
   * @param pool - Database connection pool
   * @throws SchemaError if schema file cannot be read or execution fails
   */
  async executeSchema(pool: Pool): Promise<void> {
    try {
      // Read schema.sql from bundled Lambda package
      // The schema directory is bundled alongside the Lambda code
      const schemaPath = path.join(__dirname, "schema", "schema.sql");
      let schemaSql: string;

      try {
        schemaSql = fs.readFileSync(schemaPath, "utf-8");
      } catch (error) {
        throw new SchemaError(
          `Failed to read schema file at ${schemaPath}`,
          error as Error,
        );
      }

      // Execute the schema SQL
      // The SQL file contains multiple statements separated by semicolons
      // pg.query can handle multiple statements in a single call
      try {
        await pool.query(schemaSql);
      } catch (error) {
        throw new SchemaError("Failed to execute schema SQL", error as Error);
      }
    } catch (error) {
      if (error instanceof SchemaError) {
        throw error;
      }
      throw new SchemaError(
        "Unexpected error during schema execution",
        error as Error,
      );
    }
  }
}
