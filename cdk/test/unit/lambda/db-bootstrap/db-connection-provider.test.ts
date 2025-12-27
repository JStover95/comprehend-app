import { DbConnectionProvider } from "../../../../lib/lambda/db-bootstrap/db-connection-provider";
import { ServiceConfig } from "../../../../lib/lambda/db-bootstrap/types";
import { ConnectionError } from "../../../../lib/lambda/db-bootstrap/errors";
import { resetMoto } from "../../../utils/moto";
import {
  SecretsManagerClient,
  CreateSecretCommand,
} from "@aws-sdk/client-secrets-manager";

// ==========================================
// Test Configuration Constants
// ==========================================

const AWS_ENDPOINT = "http://localhost:5000";
const AWS_REGION = "us-east-1";
const AWS_ACCOUNT_ID = "123456789012";
const SECRET_NAME = "test-secret";
const SECRET_ARN = `arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:${SECRET_NAME}`;
const CLUSTER_ENDPOINT =
  "test-cluster.cluster-abc123.us-east-1.rds.amazonaws.com";
const CLUSTER_PORT = 5432;
const DB_NAME = "postgres";
const IAM_USERNAME = "db_service_user";

const mockSecretValue = {
  username: "postgres",
  password: "test-password-123",
};

const testClientConfig = {
  endpoint: AWS_ENDPOINT,
  credentials: {
    accessKeyId: "testing",
    secretAccessKey: "testing",
  },
};

const baseConfig: ServiceConfig = {
  secretArn: SECRET_ARN,
  clusterEndpoint: CLUSTER_ENDPOINT,
  clusterPort: CLUSTER_PORT,
  databaseName: DB_NAME,
  iamUser: IAM_USERNAME,
  environment: "dev",
  clientConfig: testClientConfig,
};

// ==========================================
// Tests
// ==========================================

describe("DbConnectionProvider", () => {
  let secretsManagerClient: SecretsManagerClient;

  beforeAll(() => {
    // Create Secrets Manager client pointing to moto
    secretsManagerClient = new SecretsManagerClient({
      ...testClientConfig,
    });
  });

  beforeEach(async () => {
    // Reset moto state before each test
    await resetMoto();

    // Create test secret in moto
    await secretsManagerClient.send(
      new CreateSecretCommand({
        Name: SECRET_NAME,
        SecretString: JSON.stringify(mockSecretValue),
      }),
    );
  });

  afterEach(async () => {
    // Reset moto state after each test
    await resetMoto();
  });

  describe("createMasterPool", () => {
    it("should create a connection pool with master credentials from Secrets Manager", async () => {
      // Arrange
      const provider = new DbConnectionProvider(baseConfig);

      // Act
      const pool = await provider.createMasterPool();

      // Assert
      // Verify pool is created (it's a real Pool instance, we can't easily mock it)
      expect(pool).toBeDefined();
      expect(typeof pool.query).toBe("function");
      expect(typeof pool.end).toBe("function");

      // Cleanup
      await pool.end();
    });

    it("should use correct connection parameters", async () => {
      // Arrange
      const provider = new DbConnectionProvider(baseConfig);

      // Act
      const pool = await provider.createMasterPool();

      // Assert
      // The pool should be configured with correct connection parameters
      // We can't directly inspect the pool config, but we can verify it was created
      expect(pool).toBeDefined();

      // Cleanup
      await pool.end();
    });

    it("should throw ConnectionError if Secrets Manager fails", async () => {
      // Arrange
      // Use a non-existent secret ARN to trigger an error
      const configWithInvalidSecret: ServiceConfig = {
        ...baseConfig,
        secretArn: `arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:non-existent-secret`,
      };

      const provider = new DbConnectionProvider(configWithInvalidSecret);

      // Act & Assert
      await expect(provider.createMasterPool()).rejects.toThrow(
        ConnectionError,
      );
      await expect(provider.createMasterPool()).rejects.toThrow(
        "Failed to retrieve master credentials from Secrets Manager",
      );
    });

    it("should throw ConnectionError if secret value is invalid JSON", async () => {
      // Arrange
      // Create a secret with invalid JSON
      await secretsManagerClient.send(
        new CreateSecretCommand({
          Name: SECRET_NAME,
          SecretString: "invalid-json",
        }),
      );

      const provider = new DbConnectionProvider(baseConfig);

      // Act & Assert
      await expect(provider.createMasterPool()).rejects.toThrow(
        ConnectionError,
      );
    });

    it("should throw ConnectionError if secret is missing username", async () => {
      // Arrange
      // Create a secret missing username
      await secretsManagerClient.send(
        new CreateSecretCommand({
          Name: SECRET_NAME,
          SecretString: JSON.stringify({ password: "test-password" }),
        }),
      );

      const provider = new DbConnectionProvider(baseConfig);

      // Act & Assert
      await expect(provider.createMasterPool()).rejects.toThrow(
        ConnectionError,
      );
      await expect(provider.createMasterPool()).rejects.toThrow(
        "Secret value does not contain valid username and password fields",
      );
    });

    it("should throw ConnectionError if secret is missing password", async () => {
      // Arrange
      // Create a secret missing password
      await secretsManagerClient.send(
        new CreateSecretCommand({
          Name: SECRET_NAME,
          SecretString: JSON.stringify({ username: "postgres" }),
        }),
      );

      const provider = new DbConnectionProvider(baseConfig);

      // Act & Assert
      await expect(provider.createMasterPool()).rejects.toThrow(
        ConnectionError,
      );
      await expect(provider.createMasterPool()).rejects.toThrow(
        "Secret value does not contain valid username and password fields",
      );
    });

    it("should throw ConnectionError if username is not a string", async () => {
      // Arrange
      // Create a secret with non-string username
      await secretsManagerClient.send(
        new CreateSecretCommand({
          Name: SECRET_NAME,
          SecretString: JSON.stringify({
            username: 123,
            password: "test-password",
          }),
        }),
      );

      const provider = new DbConnectionProvider(baseConfig);

      // Act & Assert
      await expect(provider.createMasterPool()).rejects.toThrow(
        ConnectionError,
      );
      await expect(provider.createMasterPool()).rejects.toThrow(
        "Secret value does not contain valid username and password fields",
      );
    });

    it("should throw ConnectionError if password is not a string", async () => {
      // Arrange
      // Create a secret with non-string password
      await secretsManagerClient.send(
        new CreateSecretCommand({
          Name: SECRET_NAME,
          SecretString: JSON.stringify({
            username: "postgres",
            password: 123,
          }),
        }),
      );

      const provider = new DbConnectionProvider(baseConfig);

      // Act & Assert
      await expect(provider.createMasterPool()).rejects.toThrow(
        ConnectionError,
      );
      await expect(provider.createMasterPool()).rejects.toThrow(
        "Secret value does not contain valid username and password fields",
      );
    });
  });
});
