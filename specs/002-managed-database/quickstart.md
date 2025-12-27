# Quick Start: Managed Database Infrastructure

**Date**: December 23, 2025  
**Feature**: 002-managed-database

## Overview

This guide provides a quick start for using the managed database infrastructure in your CDK stack. The database construct creates an Aurora PostgreSQL Serverless V2 cluster with automatic schema bootstrap.

## Prerequisites

1. Base CDK stack (001-base-cdk-stack) deployed with VPC construct
2. AWS account with permissions for RDS, Secrets Manager, Lambda, IAM
3. CDK v2 installed and configured

## Basic Usage

### 1. Import the Database Construct

```typescript
import { DatabaseConstruct } from '../constructs/database/database-construct';
```

### 2. Create Database in Your Stack

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcConstruct } from '../constructs/networking/vpc-construct';
import { DatabaseConstruct } from '../constructs/database/database-construct';
import { EnvironmentConfig } from '../types';

export class MyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    // Assume VPC construct already exists (from base stack)
    const vpcConstruct = /* ... get from base stack ... */;

    // Create database
    const database = new DatabaseConstruct(this, 'Database', {
      vpc: vpcConstruct.vpc,
      privateSubnets: vpcConstruct.privateSubnets,
      environmentConfig: {
        name: 'dev',
        // ... other config
      },
    });

    // Access database connection info
    const dbEndpoint = database.cluster.clusterEndpoint.hostname;
    const dbPort = database.cluster.clusterEndpoint.port;
    const secretArn = database.secret.secretArn;
  }
}
```

## Configuration Options

### Environment-Specific Configurations

The database construct automatically applies environment-specific configurations based on the `environmentConfig.name` value. You can override these defaults by providing explicit props.

#### Development Environment

Development uses cost-optimized settings: minimal ACU scaling, single-AZ deployment, and shorter backup retention.

```typescript
const database = new DatabaseConstruct(this, 'Database', {
  vpc: vpcConstruct.vpc,
  privateSubnets: vpcConstruct.privateSubnets,
  environmentConfig: {
    name: 'dev',
    vpcCidr: '10.0.0.0/16',
    maxAzs: 2,
    enableNatGateways: false,
    tags: {
      Application: 'Comprehend',
      Environment: 'dev',
      ManagedBy: 'CDK',
    },
  },
  // Defaults (can be overridden):
  // minCapacity: 0 (ACUs)
  // maxCapacity: 2 (ACUs)
  // multiAz: false (single-AZ)
  // backupRetentionDays: 1
  // Maintenance window: sun:04:00-sun:05:00
});
```

**Development Configuration:**

- **ACU Scaling**: 0-2 ACUs (scales to zero when idle)
- **Multi-AZ**: Single-AZ deployment (cost optimization)
- **Backup Retention**: 1 day
- **Maintenance Window**: Sunday 04:00-05:00 UTC
- **Deletion Protection**: Disabled

#### Staging Environment

Staging uses the same cost-optimized settings as development for consistency and cost efficiency.

```typescript
const database = new DatabaseConstruct(this, 'Database', {
  vpc: vpcConstruct.vpc,
  privateSubnets: vpcConstruct.privateSubnets,
  environmentConfig: {
    name: 'staging',
    vpcCidr: '10.1.0.0/16',
    maxAzs: 2,
    enableNatGateways: true,
    tags: {
      Application: 'Comprehend',
      Environment: 'staging',
      ManagedBy: 'CDK',
    },
  },
  // Defaults (can be overridden):
  // minCapacity: 0 (ACUs)
  // maxCapacity: 2 (ACUs)
  // multiAz: false (single-AZ)
  // backupRetentionDays: 1
  // Maintenance window: sun:04:00-sun:05:00
});
```

**Staging Configuration:**

- **ACU Scaling**: 0-2 ACUs (scales to zero when idle)
- **Multi-AZ**: Single-AZ deployment (cost optimization)
- **Backup Retention**: 1 day
- **Maintenance Window**: Sunday 04:00-05:00 UTC
- **Deletion Protection**: Disabled

#### Production Environment

Production uses high-availability settings: appropriate ACU scaling, multi-AZ deployment, and longer backup retention.

```typescript
const database = new DatabaseConstruct(this, 'Database', {
  vpc: vpcConstruct.vpc,
  privateSubnets: vpcConstruct.privateSubnets,
  environmentConfig: {
    name: 'prod',
    vpcCidr: '10.2.0.0/16',
    maxAzs: 3,
    enableNatGateways: true,
    tags: {
      Application: 'Comprehend',
      Environment: 'prod',
      ManagedBy: 'CDK',
    },
  },
  // Defaults (can be overridden):
  // minCapacity: 2 (ACUs)
  // maxCapacity: 16 (ACUs)
  // multiAz: true (multi-AZ for HA)
  // backupRetentionDays: 7
  // Maintenance window: sun:03:00-sun:04:00 UTC
});
```

**Production Configuration:**

- **ACU Scaling**: 2-16 ACUs (configurable, defaults shown)
- **Multi-AZ**: Multi-AZ deployment (high availability)
- **Backup Retention**: 7 days minimum (configurable)
- **Maintenance Window**: Sunday 03:00-04:00 UTC
- **Deletion Protection**: Enabled
- **Performance Insights**: Enabled

### Custom Configuration Overrides

You can override any environment-specific defaults by providing explicit props:

```typescript
// Production with custom scaling
const database = new DatabaseConstruct(this, 'Database', {
  vpc: vpcConstruct.vpc,
  privateSubnets: vpcConstruct.privateSubnets,
  environmentConfig: prodConfig,
  // Override defaults
  minCapacity: 4,              // Custom minimum ACUs
  maxCapacity: 32,             // Custom maximum ACUs
  multiAz: true,               // Explicitly enable multi-AZ
  backupRetentionDays: 14,     // Custom backup retention
});
```

## Connecting to the Database

### Using IAM Authentication (Recommended)

```typescript
import { RDS } from '@aws-sdk/client-rds';
import { Signer } from '@aws-sdk/rds-signer';
import { Pool } from 'pg';

// Generate IAM auth token
const signer = new Signer({
  region: 'us-east-1',
  hostname: dbEndpoint,
  port: dbPort,
  username: 'db_service_user', // IAM database user created during bootstrap
});

const token = await signer.getAuthToken();

// Connect using token
const pool = new Pool({
  host: dbEndpoint,
  port: dbPort,
  database: 'postgres',
  user: 'db_service_user',
  password: token,
  ssl: true,
});

// Use pool for queries
const result = await pool.query('SELECT * FROM exercise LIMIT 10');
await pool.end();
```

### Using Master Credentials (Bootstrap Only)

```typescript
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { Pool } from 'pg';

// Retrieve master credentials from Secrets Manager
const secretsManager = new SecretsManager({ region: 'us-east-1' });
const secret = await secretsManager.getSecretValue({
  SecretId: secretArn,
});

const credentials = JSON.parse(secret.SecretString!);

// Connect using master credentials
const pool = new Pool({
  host: dbEndpoint,
  port: dbPort,
  database: 'postgres',
  user: credentials.username,
  password: credentials.password,
  ssl: true,
});

// Use pool for queries
await pool.end();
```

**Note**: Master credentials should only be used when IAM authentication is not possible (e.g., during bootstrap). Services should always use IAM authentication.

## Stack Outputs

The database construct exports the following outputs:

- `DatabaseEndpoint`: Database cluster endpoint hostname
- `DatabasePort`: Database port (default: 5432)
- `DatabaseSecretArn`: ARN of Secrets Manager secret containing master credentials
- `DatabaseIamUser`: IAM database username for service authentication

Access outputs in dependent stacks:

```typescript
// In another stack
const dbEndpoint = cdk.Fn.importValue('DatabaseEndpoint');
const dbSecretArn = cdk.Fn.importValue('DatabaseSecretArn');
```

## Lambda Function Integration

### Granting Lambda Access to Database

```typescript
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

const myLambda = new lambda.Function(this, 'MyFunction', {
  // ... function config
});

// Grant IAM database authentication permission
database.grantIamAccess(myLambda);

// Grant Secrets Manager read access (if needed for fallback)
database.secret.grantRead(myLambda);
```

### Lambda Environment Variables

```typescript
myLambda.addEnvironment('DB_ENDPOINT', dbEndpoint);
myLambda.addEnvironment('DB_PORT', dbPort.toString());
myLambda.addEnvironment('DB_IAM_USER', 'db_service_user');
// Do NOT add password to environment variables
```

## Testing

### Unit Tests

```typescript
import { Template } from 'aws-cdk-lib/assertions';
import { DatabaseConstruct } from '../constructs/database/database-construct';

describe('DatabaseConstruct', () => {
  it('creates Aurora Serverless V2 cluster', () => {
    const stack = new cdk.Stack();
    const vpc = /* ... create VPC ... */;
    
    new DatabaseConstruct(stack, 'Database', {
      vpc: vpc.vpc,
      privateSubnets: vpc.privateSubnets,
      environmentConfig: { /* ... */ },
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::RDS::DBCluster', {
      Engine: 'aurora-postgresql',
      ServerlessV2ScalingConfiguration: {
        MinCapacity: 0.5,
        MaxCapacity: 2,
      },
    });
  });
});
```

## Troubleshooting

### Bootstrap Fails

1. Check CloudWatch Logs for the bootstrap Lambda function
2. Verify VPC connectivity (Lambda in VPC, security groups configured)
3. Verify Secrets Manager secret exists and is accessible
4. Check IAM permissions for Lambda execution role

### Cannot Connect to Database

1. Verify security group allows connections from your source
2. Verify database is in private subnet (no public access)
3. For IAM auth: Verify IAM database user exists and Lambda has correct IAM permissions
4. Check network connectivity (VPC, subnets, route tables)

### Schema Already Exists Error

The bootstrap process is idempotent. If you see "already exists" errors, the bootstrap may have partially completed. Check CloudWatch logs to see which operations succeeded.

## Next Steps

1. Review [data-model.md](./data-model.md) for schema details
2. Review [research.md](./research.md) for technical decisions
3. Implement application code using IAM authentication pattern
4. Set up monitoring and alerts for database metrics
