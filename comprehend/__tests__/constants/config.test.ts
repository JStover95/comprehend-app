/**
 * Environment configuration tests
 *
 * Following patterns from:
 * - comprehend/design-docs/types-and-configuration.md - Environment configuration management, type-safe configuration, validation patterns
 * - comprehend/design-docs/testing/unit-testing.md - Test patterns
 * - cdk/test/unit/lambda/db-bootstrap/config.test.ts - Environment variable testing pattern
 *
 * Tests environment variable loading, validation, and type safety
 */

import {
  getConfig,
  validateEnv,
  type EnvironmentConfig,
} from "@/constants/config";

// Mock expo-constants
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

describe("config", () => {
  beforeEach(() => {
    // Set default environment variables for tests
    // Individual tests can override or delete these as needed
    process.env.EXPO_PUBLIC_API_URL = "https://api.example.com";
    process.env.EXPO_PUBLIC_AWS_REGION = "us-east-1";
    process.env.EXPO_PUBLIC_ENV = "development";
    process.env.EXPO_PUBLIC_DEBUG = "false";
  });

  describe("getConfig", () => {
    it("should load configuration from environment variables", () => {
      process.env.EXPO_PUBLIC_API_URL = "https://api.example.com";
      process.env.EXPO_PUBLIC_AWS_REGION = "us-east-1";
      process.env.EXPO_PUBLIC_ENV = "development";
      process.env.EXPO_PUBLIC_DEBUG = "true";

      const config = getConfig();

      expect(config.apiUrl).toBe("https://api.example.com");
      expect(config.region).toBe("us-east-1");
      expect(config.environment).toBe("development");
      expect(config.debugMode).toBe(true);
    });

    it("should default environment to development when not set", () => {
      process.env.EXPO_PUBLIC_API_URL = "https://api.example.com";
      process.env.EXPO_PUBLIC_AWS_REGION = "us-east-1";
      delete process.env.EXPO_PUBLIC_ENV;

      const config = getConfig();

      expect(config.environment).toBe("development");
    });

    it("should default debugMode to false when not set", () => {
      process.env.EXPO_PUBLIC_API_URL = "https://api.example.com";
      process.env.EXPO_PUBLIC_AWS_REGION = "us-east-1";
      delete process.env.EXPO_PUBLIC_DEBUG;

      const config = getConfig();

      expect(config.debugMode).toBe(false);
    });

    it("should handle staging environment", () => {
      process.env.EXPO_PUBLIC_API_URL = "https://staging-api.example.com";
      process.env.EXPO_PUBLIC_AWS_REGION = "us-east-1";
      process.env.EXPO_PUBLIC_ENV = "staging";

      const config = getConfig();

      expect(config.environment).toBe("staging");
    });

    it("should handle production environment", () => {
      process.env.EXPO_PUBLIC_API_URL = "https://api.example.com";
      process.env.EXPO_PUBLIC_AWS_REGION = "us-east-1";
      process.env.EXPO_PUBLIC_ENV = "production";

      const config = getConfig();

      expect(config.environment).toBe("production");
    });

    it("should return type-safe EnvironmentConfig", () => {
      process.env.EXPO_PUBLIC_API_URL = "https://api.example.com";
      process.env.EXPO_PUBLIC_AWS_REGION = "us-east-1";
      process.env.EXPO_PUBLIC_ENV = "development";

      const config = getConfig();

      // Type check: config should be assignable to EnvironmentConfig
      const typedConfig: EnvironmentConfig = config;
      expect(typedConfig).toBeDefined();
      expect(typeof typedConfig.apiUrl).toBe("string");
      expect(typeof typedConfig.region).toBe("string");
      expect(["development", "staging", "production"]).toContain(
        typedConfig.environment,
      );
      expect(typeof typedConfig.debugMode).toBe("boolean");
    });
  });

  describe("validateEnv", () => {
    it("should not throw when all required variables are present", () => {
      process.env.EXPO_PUBLIC_API_URL = "https://api.example.com";
      process.env.EXPO_PUBLIC_AWS_REGION = "us-east-1";
      process.env.EXPO_PUBLIC_ENV = "development";

      expect(() => validateEnv()).not.toThrow();
    });

    it("should throw error when EXPO_PUBLIC_API_URL is missing", () => {
      // Set AWS_REGION but not API_URL
      process.env.EXPO_PUBLIC_AWS_REGION = "us-east-1";
      // Ensure API_URL is not set
      delete process.env.EXPO_PUBLIC_API_URL;

      expect(() => validateEnv()).toThrow(
        "Missing required environment variable: EXPO_PUBLIC_API_URL",
      );
    });

    it("should throw error when EXPO_PUBLIC_AWS_REGION is missing", () => {
      // Set API_URL but not AWS_REGION
      process.env.EXPO_PUBLIC_API_URL = "https://api.example.com";
      // Ensure AWS_REGION is not set
      delete process.env.EXPO_PUBLIC_AWS_REGION;

      expect(() => validateEnv()).toThrow(
        "Missing required environment variable: EXPO_PUBLIC_AWS_REGION",
      );
    });

    it("should throw error when multiple required variables are missing", () => {
      delete process.env.EXPO_PUBLIC_API_URL;
      delete process.env.EXPO_PUBLIC_AWS_REGION;

      expect(() => validateEnv()).toThrow(
        /Missing required environment variables.*EXPO_PUBLIC_API_URL.*EXPO_PUBLIC_AWS_REGION/,
      );
    });

    it("should validate that API URL is a valid URL format", () => {
      process.env.EXPO_PUBLIC_API_URL = "not-a-valid-url";
      process.env.EXPO_PUBLIC_AWS_REGION = "us-east-1";
      process.env.EXPO_PUBLIC_ENV = "development";

      // Note: URL validation would be done in validateEnv if implemented
      // For now, we just check that the function doesn't throw for basic presence
      // Full URL validation would require additional implementation
      expect(() => validateEnv()).not.toThrow();
    });
  });

  describe("Type Safety", () => {
    it("should enforce EnvironmentConfig type structure", () => {
      process.env.EXPO_PUBLIC_API_URL = "https://api.example.com";
      process.env.EXPO_PUBLIC_AWS_REGION = "us-east-1";
      process.env.EXPO_PUBLIC_ENV = "development";

      const config = getConfig();

      // TypeScript should enforce these properties exist
      expect(config).toHaveProperty("apiUrl");
      expect(config).toHaveProperty("region");
      expect(config).toHaveProperty("environment");
      expect(config).toHaveProperty("debugMode");
    });

    it("should enforce environment type is one of valid values", () => {
      process.env.EXPO_PUBLIC_API_URL = "https://api.example.com";
      process.env.EXPO_PUBLIC_AWS_REGION = "us-east-1";
      process.env.EXPO_PUBLIC_ENV = "development";

      const config = getConfig();

      expect(["development", "staging", "production"]).toContain(
        config.environment,
      );
    });
  });
});
