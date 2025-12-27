import { DbCredentialsProvider } from "../../../../lib/lambda/db-bootstrap/db-credentials-provider";
import { ServiceConfig } from "../../../../lib/lambda/db-bootstrap/types";

// ==========================================
// Test Configuration Constants
// ==========================================

const AWS_REGION = "us-east-1";
const CLUSTER_ENDPOINT =
  "test-cluster.cluster-abc123.us-east-1.rds.amazonaws.com";
const CLUSTER_PORT = 5432;
const DB_NAME = "postgres";
const IAM_USERNAME = "db_service_user";
const SECRET_ARN = `arn:aws:secretsmanager:${AWS_REGION}:123456789012:secret:test-secret`;

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

describe("DbCredentialsProvider", () => {
  describe("createIamAuthToken", () => {
    it("should generate IAM auth token successfully", async () => {
      // RDS Signer will call LocalStack/moto, which mocks the service externally
      const provider = new DbCredentialsProvider(baseConfig);
      const token = await provider.createIamAuthToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("should generate token with custom configuration", async () => {
      // RDS Signer will call LocalStack/moto, which mocks the service externally
      const config: ServiceConfig = {
        ...baseConfig,
        clusterEndpoint: "custom-endpoint.example.com",
        clusterPort: 5433,
        iamUser: "custom_user",
      };
      const provider = new DbCredentialsProvider(config);
      const token = await provider.createIamAuthToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("should work with clientConfig for testing", async () => {
      // RDS Signer will call LocalStack/moto, which mocks the service externally
      const testClientConfig = {
        endpoint: "http://localhost:5000",
        credentials: {
          accessKeyId: "testing",
          secretAccessKey: "testing",
        },
      };
      const config: ServiceConfig = {
        ...baseConfig,
        clientConfig: testClientConfig,
      };
      const provider = new DbCredentialsProvider(config);
      const token = await provider.createIamAuthToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });
  });
});
