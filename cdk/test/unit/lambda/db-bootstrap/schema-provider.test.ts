import { SchemaProvider } from "../../../../lib/lambda/db-bootstrap/schema-provider";
import { ServiceConfig } from "../../../../lib/lambda/db-bootstrap/types";
import { SchemaError } from "../../../../lib/lambda/db-bootstrap/errors";
import { MockPool, asMockPool } from "../../../utils/mock-pool";
import * as fs from "fs";

// ==========================================
// Test Configuration Constants
// ==========================================

const CLUSTER_ENDPOINT =
  "test-cluster.cluster-abc123.us-east-1.rds.amazonaws.com";
const CLUSTER_PORT = 5432;
const DB_NAME = "postgres";
const IAM_USERNAME = "db_service_user";
const SECRET_ARN =
  "arn:aws:secretsmanager:us-east-1:123456789012:secret:test-secret";

const baseConfig: ServiceConfig = {
  secretArn: SECRET_ARN,
  clusterEndpoint: CLUSTER_ENDPOINT,
  clusterPort: CLUSTER_PORT,
  databaseName: DB_NAME,
  iamUser: IAM_USERNAME,
  environment: "dev",
};

// ==========================================
// Tests
// ==========================================

describe("SchemaProvider", () => {
  let mockPool: MockPool;

  beforeEach(() => {
    mockPool = new MockPool();
  });

  describe("executeSchema", () => {
    it("should read and execute schema.sql file", async () => {
      // Arrange
      const provider = new SchemaProvider(baseConfig);
      mockPool.withDefaultResponse({ rows: [], rowCount: 0 });

      // Act
      await provider.executeSchema(asMockPool(mockPool));

      // Assert
      const queries = mockPool.getCapturedQueries();
      expect(queries.length).toBeGreaterThan(0);

      // Verify schema SQL was executed (should contain CREATE statements)
      const sqlStatements = queries.map((q) => q.sql).join(" ");
      expect(sqlStatements).toContain("CREATE EXTENSION");
      expect(sqlStatements).toContain("CREATE TABLE");
      expect(sqlStatements).toContain("CREATE INDEX");
    });

    it("should execute schema with IF NOT EXISTS patterns for idempotency", async () => {
      // Arrange
      const provider = new SchemaProvider(baseConfig);
      mockPool.withDefaultResponse({ rows: [], rowCount: 0 });

      // Act
      await provider.executeSchema(asMockPool(mockPool));

      // Assert
      const queries = mockPool.getCapturedQueries();
      const sqlStatements = queries.map((q) => q.sql).join(" ");

      // Verify idempotent patterns
      expect(sqlStatements).toContain("IF NOT EXISTS");
      expect(sqlStatements).toContain("CREATE EXTENSION IF NOT EXISTS");
      expect(sqlStatements).toContain("CREATE TABLE IF NOT EXISTS");
      expect(sqlStatements).toContain("CREATE INDEX IF NOT EXISTS");
    });

    it("should create all required tables", async () => {
      // Arrange
      const provider = new SchemaProvider(baseConfig);
      mockPool.withDefaultResponse({ rows: [], rowCount: 0 });

      // Act
      await provider.executeSchema(asMockPool(mockPool));

      // Assert
      const queries = mockPool.getCapturedQueries();
      const sqlStatements = queries.map((q) => q.sql).join(" ");

      // Verify all 6 tables are created
      expect(sqlStatements).toContain('CREATE TABLE IF NOT EXISTS "user"');
      expect(sqlStatements).toContain("CREATE TABLE IF NOT EXISTS exercise");
      expect(sqlStatements).toContain("CREATE TABLE IF NOT EXISTS token");
      expect(sqlStatements).toContain("CREATE TABLE IF NOT EXISTS vocab");
      expect(sqlStatements).toContain(
        "CREATE TABLE IF NOT EXISTS join_vocab_token",
      );
      expect(sqlStatements).toContain(
        "CREATE TABLE IF NOT EXISTS chat_message",
      );
    });

    it("should install pgroonga extension", async () => {
      // Arrange
      const provider = new SchemaProvider(baseConfig);
      mockPool.withDefaultResponse({ rows: [], rowCount: 0 });

      // Act
      await provider.executeSchema(asMockPool(mockPool));

      // Assert
      const queries = mockPool.getCapturedQueries();
      const sqlStatements = queries.map((q) => q.sql).join(" ");

      expect(sqlStatements).toContain(
        "CREATE EXTENSION IF NOT EXISTS pgroonga",
      );
    });

    it("should create all required indexes", async () => {
      // Arrange
      const provider = new SchemaProvider(baseConfig);
      mockPool.withDefaultResponse({ rows: [], rowCount: 0 });

      // Act
      await provider.executeSchema(asMockPool(mockPool));

      // Assert
      const queries = mockPool.getCapturedQueries();
      const sqlStatements = queries.map((q) => q.sql).join(" ");

      // Verify indexes are created
      expect(sqlStatements).toContain("idx_exercise_user_date");
      expect(sqlStatements).toContain("idx_token_exercise_order");
      expect(sqlStatements).toContain("idx_vocab_exercise");
      expect(sqlStatements).toContain("idx_chat_exercise_date");
    });

    it("should throw SchemaError if schema file cannot be read", async () => {
      // Arrange
      const provider = new SchemaProvider(baseConfig);
      // Mock fs.readFileSync to throw an error
      const originalReadFileSync = fs.readFileSync;
      jest.spyOn(fs, "readFileSync").mockImplementation(() => {
        throw new Error("File not found");
      });

      // Act & Assert
      await expect(
        provider.executeSchema(asMockPool(mockPool)),
      ).rejects.toThrow(SchemaError);

      // Restore
      jest.spyOn(fs, "readFileSync").mockImplementation(originalReadFileSync);
    });

    it("should throw SchemaError if database query fails", async () => {
      // Arrange
      const provider = new SchemaProvider(baseConfig);
      const dbError = new Error("Database connection failed");
      mockPool.withError(dbError);

      // Act & Assert
      await expect(
        provider.executeSchema(asMockPool(mockPool)),
      ).rejects.toThrow(SchemaError);
    });

    it("should be idempotent - can be executed multiple times safely", async () => {
      // Arrange
      const provider = new SchemaProvider(baseConfig);
      mockPool.withDefaultResponse({ rows: [], rowCount: 0 });

      // Act - Execute schema twice
      await provider.executeSchema(asMockPool(mockPool));
      mockPool.clearCapturedQueries();
      await provider.executeSchema(asMockPool(mockPool));

      // Assert - Should not throw errors and should execute same statements
      const queries = mockPool.getCapturedQueries();
      expect(queries.length).toBeGreaterThan(0);

      // All statements should have IF NOT EXISTS
      const sqlStatements = queries.map((q) => q.sql).join(" ");
      expect(sqlStatements).toContain("IF NOT EXISTS");
    });
  });
});
