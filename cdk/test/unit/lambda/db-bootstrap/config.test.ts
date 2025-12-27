import { validateConfig } from "../../../../lib/lambda/db-bootstrap/config";
import { BootstrapError } from "../../../../lib/lambda/db-bootstrap/errors";
import { mockCreateEvent } from "./config.mock";

// ==========================================
// Test Configuration Constants
// ==========================================

const AWS_ENDPOINT = "http://localhost:5000";
const AWS_DEFAULT_REGION = "us-east-1";
const AWS_ACCESS_KEY_ID = "testing";
const AWS_SECRET_ACCESS_KEY = "testing";
const AWS_REGION = "us-east-1";
const AWS_ACCOUNT_ID = "123456789012";
const SECRET_NAME = "test-secret";
const SECRET_ARN = `arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:${SECRET_NAME}`;
const CLUSTER_ENDPOINT =
  "test-cluster.cluster-abc123.us-east-1.rds.amazonaws.com";
const DB_NAME = "comprehend";
const IAM_USERNAME = "db_service_user";

// ==========================================
// Tests
// ==========================================

describe("validateConfig", () => {
  beforeEach(() => {
    // Set default environment variables for tests
    // Individual tests can override or delete these as needed
    process.env.AWS_ENDPOINT_URL = AWS_ENDPOINT;
    process.env.AWS_DEFAULT_REGION = AWS_DEFAULT_REGION;
    process.env.AWS_ACCESS_KEY_ID = AWS_ACCESS_KEY_ID;
    process.env.AWS_SECRET_ACCESS_KEY = AWS_SECRET_ACCESS_KEY;
    process.env.AWS_REGION = AWS_REGION;
    process.env.SECRET_ARN = SECRET_ARN;
    process.env.CLUSTER_ENDPOINT = CLUSTER_ENDPOINT;
    process.env.DATABASE_NAME = DB_NAME;
    process.env.IAM_USER = IAM_USERNAME;
    // Clear these to ensure clean state (they may be set by previous tests)
    delete process.env.CLUSTER_PORT;
    delete process.env.ENVIRONMENT;
  });

  describe("successful validation", () => {
    it("should parse configuration from event ResourceProperties", () => {
      // Clear client config environment variables to test empty clientConfig
      delete process.env.AWS_ENDPOINT_URL;
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;

      const event = mockCreateEvent();
      event.ResourceProperties = {
        ...event.ResourceProperties,
        SecretArn: SECRET_ARN,
        ClusterEndpoint: CLUSTER_ENDPOINT,
        ClusterPort: "5432",
        DatabaseName: DB_NAME,
        IamUser: IAM_USERNAME,
        Environment: "dev",
      };

      const config = validateConfig(event);

      expect(config.secretArn).toBe(SECRET_ARN);
      expect(config.clusterEndpoint).toBe(CLUSTER_ENDPOINT);
      expect(config.clusterPort).toBe(5432);
      expect(config.databaseName).toBe(DB_NAME);
      expect(config.iamUser).toBe(IAM_USERNAME);
      expect(config.environment).toBe("dev");
      expect(config.clientConfig).toBeUndefined();
    });

    it("should parse configuration from environment variables", () => {
      const event = mockCreateEvent();
      // Clear event properties to force environment variable usage
      event.ResourceProperties = {
        ...event.ResourceProperties,
        SecretArn: undefined,
        ClusterEndpoint: undefined,
        ClusterPort: undefined,
        DatabaseName: undefined,
        IamUser: undefined,
        Environment: undefined,
      };

      // Override environment variables with test-specific values
      process.env.CLUSTER_PORT = "5433";
      process.env.DATABASE_NAME = "testdb";
      process.env.IAM_USER = "env_user";
      process.env.AWS_REGION = "us-west-2";
      process.env.ENVIRONMENT = "staging";

      const config = validateConfig(event);

      expect(config.secretArn).toBe(SECRET_ARN);
      expect(config.clusterEndpoint).toBe(CLUSTER_ENDPOINT);
      expect(config.clusterPort).toBe(5433);
      expect(config.databaseName).toBe("testdb");
      expect(config.iamUser).toBe("env_user");
      expect(config.environment).toBe("staging");
    });

    it("should prefer environment variables over event properties", () => {
      const event = mockCreateEvent();
      event.ResourceProperties = {
        ...event.ResourceProperties,
        SecretArn: "event-secret",
        ClusterEndpoint: "event-endpoint",
        DatabaseName: "event-db",
        IamUser: "event-user",
      };

      // Environment variables are already set in beforeEach
      // They should take precedence over event properties

      const config = validateConfig(event);

      expect(config.secretArn).toBe(SECRET_ARN);
      expect(config.clusterEndpoint).toBe(CLUSTER_ENDPOINT);
      expect(config.databaseName).toBe(DB_NAME);
      expect(config.iamUser).toBe(IAM_USERNAME);
    });

    it("should use default port 5432 when not provided", () => {
      // Clear CLUSTER_PORT to test default value
      delete process.env.CLUSTER_PORT;

      const event = mockCreateEvent();
      event.ResourceProperties = {
        ...event.ResourceProperties,
        SecretArn: SECRET_ARN,
        ClusterEndpoint: CLUSTER_ENDPOINT,
        DatabaseName: DB_NAME,
        IamUser: IAM_USERNAME,
        ClusterPort: undefined,
      };

      const config = validateConfig(event);

      expect(config.clusterPort).toBe(5432);
    });

    it("should use default environment when not provided", () => {
      // Clear ENVIRONMENT to test default value
      delete process.env.ENVIRONMENT;

      const event = mockCreateEvent();
      event.ResourceProperties = {
        ...event.ResourceProperties,
        SecretArn: SECRET_ARN,
        ClusterEndpoint: CLUSTER_ENDPOINT,
        DatabaseName: DB_NAME,
        IamUser: IAM_USERNAME,
        Environment: undefined,
      };

      const config = validateConfig(event);

      expect(config.environment).toBe("production");
    });

    it("should include clientConfig when all required env vars are set", () => {
      const event = mockCreateEvent();
      event.ResourceProperties = {
        ...event.ResourceProperties,
        SecretArn: SECRET_ARN,
        ClusterEndpoint: CLUSTER_ENDPOINT,
        DatabaseName: DB_NAME,
        IamUser: IAM_USERNAME,
      };

      const config = validateConfig(event);

      expect(config.clientConfig).toBeDefined();
      expect(config.clientConfig?.endpoint).toBe(AWS_ENDPOINT);
      expect(config.clientConfig?.credentials).toEqual({
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      });
    });

    it("should not include clientConfig when only endpoint is set", () => {
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;

      const event = mockCreateEvent();
      event.ResourceProperties = {
        ...event.ResourceProperties,
        SecretArn: SECRET_ARN,
        ClusterEndpoint: CLUSTER_ENDPOINT,
        DatabaseName: DB_NAME,
        IamUser: IAM_USERNAME,
      };

      const config = validateConfig(event);

      expect(config.clientConfig).toBeUndefined();
    });

    it("should not include clientConfig when only credentials are set", () => {
      delete process.env.AWS_ENDPOINT_URL;

      const event = mockCreateEvent();
      event.ResourceProperties = {
        ...event.ResourceProperties,
        SecretArn: SECRET_ARN,
        ClusterEndpoint: CLUSTER_ENDPOINT,
        DatabaseName: DB_NAME,
        IamUser: IAM_USERNAME,
      };

      const config = validateConfig(event);

      expect(config.clientConfig).toBeUndefined();
    });
  });

  describe("validation errors", () => {
    it("should throw BootstrapError when SECRET_ARN is missing", () => {
      // Clear SECRET_ARN to test validation
      delete process.env.SECRET_ARN;

      const event = mockCreateEvent();
      event.ResourceProperties = {
        ...event.ResourceProperties,
        SecretArn: undefined,
        ClusterEndpoint: CLUSTER_ENDPOINT,
        DatabaseName: DB_NAME,
        IamUser: IAM_USERNAME,
      };

      expect(() => validateConfig(event)).toThrow(BootstrapError);
      expect(() => validateConfig(event)).toThrow("SECRET_ARN is required");
    });

    it("should throw BootstrapError when CLUSTER_ENDPOINT is missing", () => {
      // Clear CLUSTER_ENDPOINT to test validation
      delete process.env.CLUSTER_ENDPOINT;

      const event = mockCreateEvent();
      event.ResourceProperties = {
        ...event.ResourceProperties,
        SecretArn: SECRET_ARN,
        ClusterEndpoint: undefined,
        DatabaseName: DB_NAME,
        IamUser: IAM_USERNAME,
      };

      expect(() => validateConfig(event)).toThrow(BootstrapError);
      expect(() => validateConfig(event)).toThrow(
        "CLUSTER_ENDPOINT is required",
      );
    });

    it("should throw BootstrapError when DATABASE_NAME is missing", () => {
      // Clear DATABASE_NAME to test validation
      delete process.env.DATABASE_NAME;

      const event = mockCreateEvent();
      event.ResourceProperties = {
        ...event.ResourceProperties,
        SecretArn: SECRET_ARN,
        ClusterEndpoint: CLUSTER_ENDPOINT,
        DatabaseName: undefined,
        IamUser: IAM_USERNAME,
      };

      expect(() => validateConfig(event)).toThrow(BootstrapError);
      expect(() => validateConfig(event)).toThrow("DATABASE_NAME is required");
    });

    it("should throw BootstrapError when IAM_USER is missing", () => {
      // Clear IAM_USER to test validation
      delete process.env.IAM_USER;

      const event = mockCreateEvent();
      event.ResourceProperties = {
        ...event.ResourceProperties,
        SecretArn: SECRET_ARN,
        ClusterEndpoint: CLUSTER_ENDPOINT,
        DatabaseName: DB_NAME,
        IamUser: undefined,
      };

      expect(() => validateConfig(event)).toThrow(BootstrapError);
      expect(() => validateConfig(event)).toThrow("IAM_USER is required");
    });

    it("should throw BootstrapError when CLUSTER_PORT is invalid (not a number)", () => {
      // Clear CLUSTER_PORT from env to ensure event property is used
      delete process.env.CLUSTER_PORT;

      const event = mockCreateEvent();
      event.ResourceProperties = {
        ...event.ResourceProperties,
        SecretArn: SECRET_ARN,
        ClusterEndpoint: CLUSTER_ENDPOINT,
        DatabaseName: DB_NAME,
        IamUser: IAM_USERNAME,
        ClusterPort: "invalid",
      };

      expect(() => validateConfig(event)).toThrow(BootstrapError);
      expect(() => validateConfig(event)).toThrow("Invalid CLUSTER_PORT");
    });

    it("should throw BootstrapError when CLUSTER_PORT is out of range (< 1)", () => {
      // Clear CLUSTER_PORT from env to ensure event property is used
      delete process.env.CLUSTER_PORT;

      const event = mockCreateEvent();
      event.ResourceProperties = {
        ...event.ResourceProperties,
        SecretArn: SECRET_ARN,
        ClusterEndpoint: CLUSTER_ENDPOINT,
        DatabaseName: DB_NAME,
        IamUser: IAM_USERNAME,
        ClusterPort: "0",
      };

      expect(() => validateConfig(event)).toThrow(BootstrapError);
      expect(() => validateConfig(event)).toThrow("Invalid CLUSTER_PORT");
    });

    it("should throw BootstrapError when CLUSTER_PORT is out of range (> 65535)", () => {
      // Clear CLUSTER_PORT from env to ensure event property is used
      delete process.env.CLUSTER_PORT;

      const event = mockCreateEvent();
      event.ResourceProperties = {
        ...event.ResourceProperties,
        SecretArn: SECRET_ARN,
        ClusterEndpoint: CLUSTER_ENDPOINT,
        DatabaseName: DB_NAME,
        IamUser: IAM_USERNAME,
        ClusterPort: "65536",
      };

      expect(() => validateConfig(event)).toThrow(BootstrapError);
      expect(() => validateConfig(event)).toThrow("Invalid CLUSTER_PORT");
    });
  });
});
