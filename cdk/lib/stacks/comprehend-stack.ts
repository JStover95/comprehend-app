import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { VpcConstruct } from "../constructs/networking/vpc-construct";
import {
  EnvironmentConfig,
  DEFAULT_ENVIRONMENT_CONFIGS,
  validateEnvironmentConfig,
  EnvironmentName,
} from "../types";

/**
 * Properties for ComprehendStack
 */
export interface ComprehendStackProps extends cdk.StackProps {
  /**
   * Environment configuration
   * If not provided, will use default configuration for the environment
   */
  environmentConfig?: EnvironmentConfig;

  /**
   * Environment name (dev, staging, prod)
   * Used to load default configuration if environmentConfig not provided
   */
  environmentName?: EnvironmentName;
}

/**
 * Comprehend Base Stack
 *
 * This stack provides the foundational infrastructure for the Comprehend mobile app backend,
 * including VPC networking, environment configuration, and resource exports for dependent stacks.
 *
 * Features:
 * - Environment-specific configuration (dev, staging, prod)
 * - VPC with public and private subnets across multiple AZs
 * - NAT gateways for private subnet internet access (configurable per environment)
 * - CloudFormation exports for dependent stacks
 * - Comprehensive resource tagging for cost tracking
 *
 * Usage:
 * ```typescript
 * new ComprehendStack(app, 'ComprehendDevStack', {
 *   environmentName: 'dev',
 * });
 * ```
 */
export class ComprehendStack extends cdk.Stack {
  /**
   * Environment configuration for this stack
   */
  public readonly environmentConfig: EnvironmentConfig;

  /**
   * VPC construct
   */
  public readonly vpcConstruct: VpcConstruct;

  constructor(scope: Construct, id: string, props: ComprehendStackProps = {}) {
    super(scope, id, props);

    // Load environment configuration
    this.environmentConfig = this.loadEnvironmentConfig(props);

    // Validate configuration
    const validationErrors = validateEnvironmentConfig(this.environmentConfig);
    if (validationErrors.length > 0) {
      const errorMessages = validationErrors
        .map((e) => `${e.field}: ${e.message}`)
        .join("; ");
      throw new Error(`Invalid environment configuration: ${errorMessages}`);
    }

    // Create VPC construct
    this.vpcConstruct = new VpcConstruct(this, "VpcConstruct", {
      environmentConfig: this.environmentConfig,
    });

    // Apply environment-specific tags to all resources in the stack
    cdk.Tags.of(this).add(
      "Application",
      this.environmentConfig.tags.Application,
    );
    cdk.Tags.of(this).add(
      "Environment",
      this.environmentConfig.tags.Environment,
    );
    cdk.Tags.of(this).add("ManagedBy", this.environmentConfig.tags.ManagedBy);

    // Apply additional custom tags
    Object.entries(this.environmentConfig.tags).forEach(([key, value]) => {
      if (!["Application", "Environment", "ManagedBy"].includes(key)) {
        cdk.Tags.of(this).add(key, value);
      }
    });

    // Export VPC and subnet information for dependent stacks
    this.createStackOutputs();
  }

  /**
   * Load environment configuration from props or defaults
   */
  private loadEnvironmentConfig(
    props: ComprehendStackProps,
  ): EnvironmentConfig {
    // If explicit config provided, use it
    if (props.environmentConfig) {
      return props.environmentConfig;
    }

    // If environment name provided, use default config
    if (props.environmentName) {
      const defaultConfig = DEFAULT_ENVIRONMENT_CONFIGS[props.environmentName];
      if (!defaultConfig) {
        throw new Error(
          `No default configuration found for environment: ${props.environmentName}`,
        );
      }
      return defaultConfig;
    }

    // Try to get environment from CDK context
    const contextEnv = this.node.tryGetContext("environment") as
      | EnvironmentName
      | undefined;
    if (contextEnv && DEFAULT_ENVIRONMENT_CONFIGS[contextEnv]) {
      return DEFAULT_ENVIRONMENT_CONFIGS[contextEnv];
    }

    // Default to dev if nothing specified
    console.warn("No environment specified, defaulting to dev");
    return DEFAULT_ENVIRONMENT_CONFIGS.dev;
  }

  /**
   * Create CloudFormation outputs for dependent stacks
   */
  private createStackOutputs(): void {
    const envName = this.environmentConfig.name;

    // VPC ID
    new cdk.CfnOutput(this, "VpcId", {
      value: this.vpcConstruct.vpc.vpcId,
      description: `VPC ID for ${envName} environment`,
      exportName: `${envName}-VpcId`,
    });

    // VPC CIDR
    new cdk.CfnOutput(this, "VpcCidr", {
      value: this.vpcConstruct.vpc.vpcCidrBlock,
      description: `VPC CIDR block for ${envName} environment`,
      exportName: `${envName}-VpcCidr`,
    });

    // Public Subnet IDs
    new cdk.CfnOutput(this, "PublicSubnetIds", {
      value: this.vpcConstruct.getPublicSubnetIds(),
      description: `Public subnet IDs for ${envName} environment (comma-separated)`,
      exportName: `${envName}-PublicSubnetIds`,
    });

    // Private Subnet IDs
    new cdk.CfnOutput(this, "PrivateSubnetIds", {
      value: this.vpcConstruct.getPrivateSubnetIds(),
      description: `Private subnet IDs for ${envName} environment (comma-separated)`,
      exportName: `${envName}-PrivateSubnetIds`,
    });

    // Availability Zones
    new cdk.CfnOutput(this, "AvailabilityZones", {
      value: this.vpcConstruct.getAvailabilityZonesString(),
      description: `Availability zones used in ${envName} environment (comma-separated)`,
      exportName: `${envName}-AvailabilityZones`,
    });

    // NAT Gateway IPs (may be empty if NAT gateways disabled)
    new cdk.CfnOutput(this, "NatGatewayIps", {
      value: this.vpcConstruct.getNatGatewayIpsString(),
      description: `NAT gateway Elastic IP addresses for ${envName} environment (comma-separated, empty if disabled)`,
      exportName: `${envName}-NatGatewayIps`,
    });

    // Environment Name
    new cdk.CfnOutput(this, "EnvironmentName", {
      value: envName,
      description: "Environment name",
      exportName: `${envName}-EnvironmentName`,
    });
  }
}
