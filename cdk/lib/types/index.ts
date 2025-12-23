/**
 * Core type definitions for the Comprehend CDK infrastructure
 *
 * This module defines the fundamental types and interfaces used across
 * the CDK stack, including environment configuration, construct props,
 * and validation utilities.
 */

/**
 * Supported deployment environments for the Comprehend application
 */
export type EnvironmentName = "dev" | "staging" | "prod";

/**
 * Environment-specific configuration for infrastructure resources
 *
 * This interface defines the parameters that vary between deployment environments
 * (dev, staging, production) while maintaining consistent infrastructure patterns.
 */
export interface EnvironmentConfig {
  /**
   * Environment identifier (dev, staging, prod)
   * Used in resource naming and tagging
   */
  readonly name: EnvironmentName;

  /**
   * VPC CIDR block for this environment
   * Must not overlap with other environments in the same AWS account
   *
   * @example '10.0.0.0/16' for dev
   * @example '10.1.0.0/16' for staging
   * @example '10.2.0.0/16' for prod
   */
  readonly vpcCidr: string;

  /**
   * Maximum number of availability zones to use
   * Must be at least 2 for high availability (FR-002)
   *
   * @default 2
   * @minimum 2
   * @maximum 3
   */
  readonly maxAzs: number;

  /**
   * Whether to create NAT gateways for private subnet internet access
   * Set to false for dev environments to reduce costs
   * Must be true for staging and prod (FR-004)
   *
   * @default true for staging/prod, false for dev
   */
  readonly enableNatGateways: boolean;

  /**
   * Number of NAT gateways to create (one per AZ for HA)
   * Ignored if enableNatGateways is false
   *
   * @default equals maxAzs
   */
  readonly natGateways?: number;

  /**
   * Resource tags for cost tracking and management (FR-007)
   * These tags will be applied to all resources in the stack
   */
  readonly tags: Record<string, string>;

  /**
   * AWS account ID for this environment (optional)
   * Used for stack targeting and validation
   */
  readonly accountId?: string;

  /**
   * AWS region for this environment (optional)
   * If not specified, uses CDK_DEFAULT_REGION
   */
  readonly region?: string;
}

/**
 * Properties for VpcConstruct
 *
 * Defines the configuration for creating a VPC with public and private subnets
 * across multiple availability zones.
 */
export interface VpcConstructProps {
  /**
   * Environment configuration containing VPC CIDR, AZ settings, etc.
   */
  readonly environmentConfig: EnvironmentConfig;

  /**
   * Enable VPC Flow Logs for network traffic monitoring
   * @default false (future enhancement)
   */
  readonly enableFlowLogs?: boolean;

  /**
   * Enable VPC endpoints for AWS services (S3, DynamoDB, etc.)
   * @default false (future enhancement)
   */
  readonly enableVpcEndpoints?: boolean;
}

/**
 * Outputs exported by the base stack for dependent stacks
 * These values are available via CloudFormation exports
 */
export interface ComprehendStackOutputs {
  /**
   * VPC ID
   * Export name: `{environment}-VpcId`
   */
  readonly vpcId: string;

  /**
   * Public subnet IDs (comma-separated)
   * Export name: `{environment}-PublicSubnetIds`
   */
  readonly publicSubnetIds: string;

  /**
   * Private subnet IDs (comma-separated)
   * Export name: `{environment}-PrivateSubnetIds`
   */
  readonly privateSubnetIds: string;

  /**
   * Availability zones used (comma-separated)
   * Export name: `{environment}-AvailabilityZones`
   */
  readonly availabilityZones: string;

  /**
   * NAT gateway public IPs (comma-separated)
   * Export name: `{environment}-NatGatewayIps`
   */
  readonly natGatewayIps: string;

  /**
   * Environment name
   * Export name: `{environment}-EnvironmentName`
   */
  readonly environmentName: string;

  /**
   * VPC CIDR block
   * Export name: `{environment}-VpcCidr`
   */
  readonly vpcCidr: string;
}

/**
 * Default environment configurations for dev, staging, and prod
 */
export const DEFAULT_ENVIRONMENT_CONFIGS: Record<
  EnvironmentName,
  EnvironmentConfig
> = {
  dev: {
    name: "dev",
    vpcCidr: "10.0.0.0/16",
    maxAzs: 2,
    enableNatGateways: false, // Cost optimization
    tags: {
      Application: "Comprehend",
      Environment: "dev",
      ManagedBy: "CDK",
      CostCenter: "Development",
    },
  },
  staging: {
    name: "staging",
    vpcCidr: "10.1.0.0/16",
    maxAzs: 2,
    enableNatGateways: true,
    tags: {
      Application: "Comprehend",
      Environment: "staging",
      ManagedBy: "CDK",
      CostCenter: "Staging",
    },
  },
  prod: {
    name: "prod",
    vpcCidr: "10.2.0.0/16",
    maxAzs: 3, // Maximum availability
    enableNatGateways: true,
    tags: {
      Application: "Comprehend",
      Environment: "prod",
      ManagedBy: "CDK",
      CostCenter: "Production",
    },
  },
};

/**
 * Validation error type
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates a CIDR block string
 *
 * @param cidr - CIDR block to validate (e.g., '10.0.0.0/16')
 * @returns true if valid, false otherwise
 */
export function validateCidr(cidr: string): boolean {
  // RFC 1918 private ranges
  const privateRanges = [
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/, // 10.0.0.0/8
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}\/\d{1,2}$/, // 172.16.0.0/12
    /^192\.168\.\d{1,3}\.\d{1,3}\/\d{1,2}$/, // 192.168.0.0/16
  ];

  return privateRanges.some((pattern) => pattern.test(cidr));
}

/**
 * Validates an environment configuration
 *
 * @param config - Environment configuration to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateEnvironmentConfig(
  config: EnvironmentConfig,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate environment name
  if (!["dev", "staging", "prod"].includes(config.name)) {
    errors.push({
      field: "name",
      message: `Invalid environment name: ${config.name}. Must be 'dev', 'staging', or 'prod'`,
    });
  }

  // Validate VPC CIDR
  if (!validateCidr(config.vpcCidr)) {
    errors.push({
      field: "vpcCidr",
      message: `Invalid VPC CIDR: ${config.vpcCidr}. Must be a valid RFC 1918 private IP range`,
    });
  }

  // Validate maxAzs
  if (config.maxAzs < 2 || config.maxAzs > 3) {
    errors.push({
      field: "maxAzs",
      message: `maxAzs must be between 2 and 3 (inclusive), got: ${config.maxAzs}`,
    });
  }

  // Validate natGateways
  if (config.natGateways !== undefined && config.natGateways > config.maxAzs) {
    errors.push({
      field: "natGateways",
      message: `natGateways (${config.natGateways}) cannot exceed maxAzs (${config.maxAzs})`,
    });
  }

  // Validate required tags
  const requiredTags = ["Application", "Environment", "ManagedBy"];
  requiredTags.forEach((tag) => {
    if (!config.tags[tag]) {
      errors.push({
        field: "tags",
        message: `Missing required tag: ${tag}`,
      });
    }
  });

  // Validate Environment tag matches name
  if (config.tags.Environment && config.tags.Environment !== config.name) {
    errors.push({
      field: "tags.Environment",
      message: `Environment tag (${config.tags.Environment}) must match config name (${config.name})`,
    });
  }

  return errors;
}
