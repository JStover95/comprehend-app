# Data Model: Base CDK Stack Foundation

**Feature**: Base CDK Stack Foundation  
**Phase**: 1 - Design & Contracts  
**Date**: December 23, 2025

## Overview

This document defines the data structures and types for the base CDK stack. Unlike application-level features, infrastructure-as-code data models describe configuration interfaces, construct props, and type definitions rather than database entities.

## Core Type Definitions

### 1. Environment Configuration

**Purpose**: Defines environment-specific settings for infrastructure deployment

**Location**: `cdk/lib/types/index.ts`

**Interface Definition**:

```typescript
/**
 * Supported deployment environments for the Comprehend application
 */
export type EnvironmentName = 'dev' | 'staging' | 'prod';

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
```

**Validation Rules**:
- `vpcCidr` must be valid CIDR notation (regex: `^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/\d{1,2}$`)
- `vpcCidr` must be from RFC 1918 private ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
- `maxAzs` must be between 2 and 3 inclusive
- `natGateways` (if specified) must not exceed `maxAzs`
- `tags` must include required keys: `Application`, `Environment`, `ManagedBy`

**Default Configurations**:

```typescript
export const DEFAULT_ENVIRONMENT_CONFIGS: Record<EnvironmentName, EnvironmentConfig> = {
  dev: {
    name: 'dev',
    vpcCidr: '10.0.0.0/16',
    maxAzs: 2,
    enableNatGateways: false,  // Cost optimization
    tags: {
      Application: 'Comprehend',
      Environment: 'dev',
      ManagedBy: 'CDK',
      CostCenter: 'Development'
    }
  },
  staging: {
    name: 'staging',
    vpcCidr: '10.1.0.0/16',
    maxAzs: 2,
    enableNatGateways: true,
    tags: {
      Application: 'Comprehend',
      Environment: 'staging',
      ManagedBy: 'CDK',
      CostCenter: 'Staging'
    }
  },
  prod: {
    name: 'prod',
    vpcCidr: '10.2.0.0/16',
    maxAzs: 3,  // Maximum availability
    enableNatGateways: true,
    tags: {
      Application: 'Comprehend',
      Environment: 'prod',
      ManagedBy: 'CDK',
      CostCenter: 'Production'
    }
  }
};
```

---

### 2. VPC Construct Props

**Purpose**: Configuration properties for the VPC construct

**Location**: `cdk/lib/constructs/networking/vpc-construct.ts`

**Interface Definition**:

```typescript
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
```

**Relationships**:
- Depends on: `EnvironmentConfig`
- Used by: `ComprehendStack`

---

### 3. Stack Outputs

**Purpose**: Exported values for dependent stacks to import

**Location**: `cdk/lib/stacks/comprehend-stack.ts`

**Interface Definition**:

```typescript
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
```

**Usage by Dependent Stacks**:

```typescript
import * as cdk from 'aws-cdk-lib';

// Import VPC from base stack
const vpcId = cdk.Fn.importValue('dev-VpcId');
const vpc = ec2.Vpc.fromLookup(this, 'ImportedVpc', {
  vpcId: vpcId
});

// Import subnet IDs
const privateSubnetIds = cdk.Fn.importValue('dev-PrivateSubnetIds').split(',');
```

---

## Infrastructure Resources (Entity Mappings)

### VPC (Virtual Private Cloud)

**CDK Resource**: `aws-cdk-lib/aws-ec2.Vpc`

**Attributes**:
- `vpcId` (string) - AWS VPC identifier
- `cidrBlock` (string) - IP address range
- `enableDnsHostnames` (boolean) - DNS hostname resolution
- `enableDnsSupport` (boolean) - DNS support

**Created From**: `EnvironmentConfig.vpcCidr`, `EnvironmentConfig.maxAzs`

**Relationships**:
- Contains: Multiple Subnets
- Has: Internet Gateway
- Has: Route Tables

---

### Subnet

**CDK Resource**: `aws-cdk-lib/aws-ec2.Subnet`

**Types**:
1. **Public Subnet**: Internet-facing resources
   - Has route to Internet Gateway
   - Auto-assign public IPs
   - CIDR: `{vpcCidr.0}.0/24`, `{vpcCidr.0}.1/24`

2. **Private Subnet**: Internal resources
   - Has route to NAT Gateway
   - No public IPs
   - CIDR: `{vpcCidr.0}.10/23`, `{vpcCidr.0}.12/23`

**Attributes**:
- `subnetId` (string) - AWS Subnet identifier
- `availabilityZone` (string) - AZ placement
- `cidrBlock` (string) - Subnet IP range
- `mapPublicIpOnLaunch` (boolean) - Auto-assign public IP

**Distribution**:
- Minimum 2 AZs (FR-002, SC-003)
- 2 subnets per AZ (1 public, 1 private)
- Total: 4-6 subnets depending on `maxAzs`

---

### NAT Gateway

**CDK Resource**: `aws-cdk-lib/aws-ec2.NatGateway`

**Purpose**: Enables private subnet resources to access internet (FR-004)

**Attributes**:
- `natGatewayId` (string) - AWS NAT Gateway identifier
- `allocationId` (string) - Elastic IP allocation
- `subnetId` (string) - Public subnet placement

**Placement**:
- One per availability zone (high availability)
- Placed in public subnets
- Count matches `EnvironmentConfig.maxAzs` (if enabled)

---

### Internet Gateway

**CDK Resource**: `aws-cdk-lib/aws-ec2.InternetGateway`

**Purpose**: Enables public subnet resources to access internet

**Attributes**:
- `internetGatewayId` (string) - AWS IGW identifier
- `vpcId` (string) - Associated VPC

**Relationships**:
- Attached to: VPC
- Used by: Public subnet route tables

---

## State Transitions

### Stack Lifecycle

```
[Created] → [Deployed] → [Updated] → [Deleted]
```

**Created**: Initial deployment
- VPC created with CIDR block
- Subnets created across AZs
- Internet Gateway attached
- NAT Gateways created (if enabled)
- Routes configured
- Outputs exported

**Deployed**: Stack exists in CloudFormation
- Resources provisioned in AWS
- Exports available for dependent stacks
- Can be referenced by other stacks

**Updated**: Configuration changes
- CIDR change requires replacement (destructive)
- Adding/removing AZs requires careful planning
- Tag updates are non-destructive
- NAT Gateway changes may cause brief outage

**Deleted**: Stack removal
- Removes all created resources
- Dependent stacks must be deleted first (export constraint)
- VPC cannot be deleted if resources exist within it

---

## Validation Rules

### CIDR Block Validation

```typescript
function validateCidr(cidr: string): boolean {
  // RFC 1918 private ranges
  const privateRanges = [
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/,      // 10.0.0.0/8
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}\/\d{1,2}$/,  // 172.16.0.0/12
    /^192\.168\.\d{1,3}\.\d{1,3}\/\d{1,2}$/          // 192.168.0.0/16
  ];
  
  return privateRanges.some(pattern => pattern.test(cidr));
}
```

### Environment Configuration Validation

```typescript
function validateEnvironmentConfig(config: EnvironmentConfig): string[] {
  const errors: string[] = [];
  
  if (!['dev', 'staging', 'prod'].includes(config.name)) {
    errors.push(`Invalid environment name: ${config.name}`);
  }
  
  if (!validateCidr(config.vpcCidr)) {
    errors.push(`Invalid VPC CIDR: ${config.vpcCidr}`);
  }
  
  if (config.maxAzs < 2 || config.maxAzs > 3) {
    errors.push(`maxAzs must be 2 or 3, got: ${config.maxAzs}`);
  }
  
  if (config.natGateways && config.natGateways > config.maxAzs) {
    errors.push(`natGateways (${config.natGateways}) cannot exceed maxAzs (${config.maxAzs})`);
  }
  
  const requiredTags = ['Application', 'Environment', 'ManagedBy'];
  requiredTags.forEach(tag => {
    if (!config.tags[tag]) {
      errors.push(`Missing required tag: ${tag}`);
    }
  });
  
  return errors;
}
```

---

## Summary

### Key Entities
1. **EnvironmentConfig** - Environment-specific configuration
2. **VpcConstructProps** - VPC construct properties
3. **ComprehendStackOutputs** - Exported stack outputs

### Infrastructure Resources
1. **VPC** - Isolated network
2. **Subnet** (Public/Private) - Network segments
3. **NAT Gateway** - Outbound internet access
4. **Internet Gateway** - Bidirectional internet access

### Type Safety
- All interfaces use `readonly` properties (immutable)
- Strict TypeScript types (`EnvironmentName` union type)
- Comprehensive JSDoc documentation
- Validation functions for runtime checks

### Extensibility
- Easy to add new environments
- Configuration-driven infrastructure
- Clear separation of concerns
- Ready for future enhancements (VPC endpoints, flow logs)

This data model satisfies:
- ✅ FR-005: Environment identifier input
- ✅ FR-006: Environment-specific naming
- ✅ FR-007: Resource tagging
- ✅ FR-008, FR-009: Stack exports
- ✅ FR-010: Configuration validation
- ✅ Constitution V: Type Safety with strict TypeScript

