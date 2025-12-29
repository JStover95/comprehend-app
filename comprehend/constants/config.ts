/**
 * Environment configuration for the Comprehend mobile application.
 *
 * This file provides type-safe access to environment variables and configuration
 * following patterns from comprehend/design-docs/types-and-configuration.md
 *
 * Configuration is determined at build time (not runtime) using EXPO_PUBLIC_*
 * environment variables.
 */

/**
 * Environment type
 */
export type Environment = "development" | "staging" | "production";

/**
 * Environment configuration interface
 *
 * Following data-model.md EnvironmentConfig entity definition
 */
export interface EnvironmentConfig {
  /** API Gateway endpoint URL */
  apiUrl: string;
  /** AWS region */
  region: string;
  /** Current environment */
  environment: Environment;
  /** Enable debug features */
  debugMode: boolean;
}

/**
 * Get environment configuration
 *
 * Loads configuration from environment variables at build time.
 * All values are sourced from EXPO_PUBLIC_* environment variables.
 *
 * @returns EnvironmentConfig object with all configuration values
 */
export function getConfig(): EnvironmentConfig {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || "";
  const region = process.env.EXPO_PUBLIC_AWS_REGION || "";
  const env = (process.env.EXPO_PUBLIC_ENV || "development") as Environment;
  const debugMode = process.env.EXPO_PUBLIC_DEBUG === "true";

  return {
    apiUrl,
    region,
    environment: env,
    debugMode,
  };
}

/**
 * Validate environment configuration
 *
 * Checks that all required environment variables are present.
 * Throws an error with a clear message if any required variables are missing.
 *
 * @throws {Error} If any required environment variables are missing
 */
export function validateEnv(): void {
  const missing: string[] = [];

  // Check required variables
  if (!process.env.EXPO_PUBLIC_API_URL) {
    missing.push("EXPO_PUBLIC_API_URL");
  }
  if (!process.env.EXPO_PUBLIC_AWS_REGION) {
    missing.push("EXPO_PUBLIC_AWS_REGION");
  }

  if (missing.length > 0) {
    const message =
      missing.length === 1
        ? `Missing required environment variable: ${missing[0]}`
        : `Missing required environment variables: ${missing.join(", ")}`;
    throw new Error(message);
  }
}
