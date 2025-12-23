# Quickstart: Base CDK Stack Foundation

**Feature**: Base CDK Stack Foundation  
**Phase**: 1 - Developer Guide  
**Date**: December 23, 2025

## Overview

This guide helps developers deploy and use the Comprehend base CDK stack, which provides foundational infrastructure including VPC, subnets, NAT gateways, and environment configuration for the mobile app backend.

## Prerequisites

- Node.js 18+ and npm installed
- AWS CLI configured with appropriate credentials
- AWS account with permissions for VPC, EC2, CloudFormation
- Basic familiarity with AWS CDK and TypeScript

## Quick Start

### 1. Install Dependencies

```bash
cd cdk/
npm install
```

### 2. Bootstrap CDK (First Time Only)

Bootstrap CDK in your AWS account and region:

```bash
# Using default AWS profile and region
npx cdk bootstrap

# Or specify account and region
npx cdk bootstrap aws://123456789012/us-east-1
```

### 3. Deploy Development Environment

```bash
# Synthesize CloudFormation template
npx cdk synth --context environment=dev

# Deploy to AWS
npx cdk deploy --context environment=dev
```

Expected output:

```plaintext
✨  Synthesis time: 3.21s

ComprehendDevStack: deploying...
ComprehendDevStack: creating CloudFormation changeset...

 ✅  ComprehendDevStack

✨  Deployment time: 8m 43s

Outputs:
ComprehendDevStack.VpcId = vpc-0123456789abcdef0
ComprehendDevStack.PublicSubnetIds = subnet-abc,subnet-def
ComprehendDevStack.PrivateSubnetIds = subnet-ghi,subnet-jkl
ComprehendDevStack.AvailabilityZones = us-east-1a,us-east-1b
ComprehendDevStack.EnvironmentName = dev
ComprehendDevStack.VpcCidr = 10.0.0.0/16
```

### 4. Verify Deployment

```bash
# List CloudFormation stacks
aws cloudformation describe-stacks --stack-name ComprehendDevStack

# List exported outputs
aws cloudformation list-exports --query 'Exports[?starts_with(Name, `dev-`)].{Name:Name,Value:Value}' --output table
```

## Environment Configuration

### Available Environments

Three pre-configured environments are available:

| Environment | VPC CIDR | AZs | NAT Gateways | Use Case |
|-------------|----------|-----|--------------|----------|
| **dev** | 10.0.0.0/16 | 2 | Disabled | Local development, cost optimization |
| **staging** | 10.1.0.0/16 | 2 | 2 (one per AZ) | Pre-production testing |
| **prod** | 10.2.0.0/16 | 3 | 3 (one per AZ) | Production workloads, maximum HA |

### Deploy Different Environments

```bash
# Deploy staging
npx cdk deploy --context environment=staging

# Deploy production
npx cdk deploy --context environment=prod
```

### Custom Environment Configuration

To override default configurations, modify `cdk/lib/types/index.ts`:

```typescript
export const DEFAULT_ENVIRONMENT_CONFIGS: Record<EnvironmentName, EnvironmentConfig> = {
  dev: {
    name: 'dev',
    vpcCidr: '10.0.0.0/16',  // Change CIDR here
    maxAzs: 2,
    enableNatGateways: false,
    tags: {
      Application: 'Comprehend',
      Environment: 'dev',
      ManagedBy: 'CDK',
      CostCenter: 'Development'
    }
  },
  // ... other environments
};
```

## Using the Stack in Dependent Services

### Import VPC and Subnets

In a dependent CDK stack (e.g., Lambda, RDS, API Gateway):

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class MyServiceStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Import environment name
    const envName = cdk.Fn.importValue('dev-EnvironmentName');

    // Import VPC
    const vpcId = cdk.Fn.importValue('dev-VpcId');
    const vpc = ec2.Vpc.fromLookup(this, 'ImportedVpc', {
      vpcId: vpcId
    });

    // Import private subnets (for Lambda, RDS)
    const privateSubnetIds = cdk.Fn.importValue('dev-PrivateSubnetIds');
    const privateSubnets = cdk.Fn.split(',', privateSubnetIds);

    // Use in Lambda function
    const myFunction = new lambda.Function(this, 'MyFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      }
    });
  }
}
```

### Query Outputs Programmatically

```typescript
// Get all exports for an environment
const AWS = require('aws-sdk');
const cloudformation = new AWS.CloudFormation();

async function getStackOutputs(environment: string) {
  const result = await cloudformation.listExports().promise();
  
  return result.Exports
    .filter(exp => exp.Name.startsWith(`${environment}-`))
    .reduce((acc, exp) => {
      const key = exp.Name.replace(`${environment}-`, '');
      acc[key] = exp.Value;
      return acc;
    }, {});
}

// Usage
const outputs = await getStackOutputs('dev');
console.log(outputs.VpcId);  // vpc-0123456789abcdef0
```

## Common Operations

### Update Stack Configuration

1. Modify configuration in `cdk/lib/types/index.ts`
2. Synthesize to preview changes:

   ```bash
   npx cdk diff --context environment=dev
   ```

3. Deploy changes:

   ```bash
   npx cdk deploy --context environment=dev
   ```

### View Deployed Resources

```bash
# List VPCs
aws ec2 describe-vpcs --filters "Name=tag:Environment,Values=dev" --query 'Vpcs[*].{VpcId:VpcId,CIDR:CidrBlock,Name:Tags[?Key==`Name`].Value|[0]}' --output table

# List subnets
aws ec2 describe-subnets --filters "Name=tag:Environment,Values=dev" --query 'Subnets[*].{SubnetId:SubnetId,AZ:AvailabilityZone,CIDR:CidrBlock,Type:Tags[?Key==`aws-cdk:subnet-type`].Value|[0]}' --output table

# List NAT gateways
aws ec2 describe-nat-gateways --filter "Name=tag:Environment,Values=dev" --query 'NatGateways[*].{NatGatewayId:NatGatewayId,State:State,PublicIp:NatGatewayAddresses[0].PublicIp,SubnetId:SubnetId}' --output table
```

### Cost Estimation

```bash
# View current month costs by environment
aws ce get-cost-and-usage \
  --time-period Start=2025-12-01,End=2025-12-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=TAG,Key=Environment \
  --filter file://filter.json

# filter.json
{
  "Tags": {
    "Key": "Application",
    "Values": ["Comprehend"]
  }
}
```

**Expected Monthly Costs** (us-east-1):

- **Dev** (2 AZs, no NAT): ~$0/month (only data transfer charges)
- **Staging** (2 AZs, 2 NAT): ~$65/month ($32.40/NAT gateway)
- **Prod** (3 AZs, 3 NAT): ~$97/month ($32.40/NAT gateway × 3)

### Destroy Stack

**⚠️ Warning**: This will delete all infrastructure. Ensure no dependent stacks exist.

```bash
# Check for dependent stacks first
aws cloudformation list-imports --export-name dev-VpcId

# If no imports, proceed with deletion
npx cdk destroy --context environment=dev
```

## Testing

### Unit Tests

Run CDK stack tests:

```bash
cd cdk/
npm test

# Run specific test file
npm test -- stacks/comprehend-stack.test.ts

# Run with coverage
npm test -- --coverage
```

### Integration Tests

Deploy to a test AWS account:

```bash
# Set test account/region
export AWS_PROFILE=test-account
export AWS_REGION=us-east-2

# Deploy
npx cdk deploy --context environment=dev

# Run integration tests (future implementation)
npm run test:integration
```

## Troubleshooting

### Issue: "VPC CIDR conflicts with existing VPC"

**Symptom**: Deployment fails with CIDR overlap error

**Solution**: Change VPC CIDR in environment configuration to non-overlapping range

```typescript
// In cdk/lib/types/index.ts
dev: {
  vpcCidr: '10.10.0.0/16',  // Use different block
  // ...
}
```

### Issue: "Insufficient NAT Gateway quota"

**Symptom**: Deployment fails creating NAT gateways

**Solution**: Request quota increase or reduce NAT gateway count

```bash
# Check current quota
aws service-quotas get-service-quota \
  --service-code vpc \
  --quota-code L-FE5A380F

# Request increase via AWS Console or CLI
aws service-quotas request-service-quota-increase \
  --service-code vpc \
  --quota-code L-FE5A380F \
  --desired-value 10
```

### Issue: "Stack export already exists"

**Symptom**: Cannot deploy because export name conflicts

**Solution**: Delete conflicting stack or change environment name

```bash
# Find conflicting exports
aws cloudformation list-exports --query 'Exports[?starts_with(Name, `dev-`)]'

# Delete old stack if safe
aws cloudformation delete-stack --stack-name OldComprehendDevStack
```

### Issue: "Region only has 2 AZs but config specifies 3"

**Symptom**: Deployment fails with insufficient AZ error

**Solution**: Reduce maxAzs in configuration

```typescript
// For regions with only 2 AZs
prod: {
  maxAzs: 2,  // Reduce from 3 to 2
  // ...
}
```

## Next Steps

After deploying the base stack:

1. **Phase 0.2**: Deploy database infrastructure (RDS Aurora)
2. **Phase 1**: Set up authentication (Cognito)
3. **Phase 3**: Deploy API Gateway and Lambda functions
4. **Phase 5**: Configure Bedrock ReaderAgent

Refer to `DEVELOPMENT_PLAN.md` for the complete roadmap.

## Additional Resources

- [AWS CDK Developer Guide](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- [AWS VPC User Guide](https://docs.aws.amazon.com/vpc/latest/userguide/)
- [Project Design Docs](../../cdk/docs/design-docs.md)
- [Environment Configuration Schema](./contracts/environment-config.schema.json)
- [Stack Outputs Schema](./contracts/stack-outputs.schema.json)

## Support

For issues or questions:

1. Check [Troubleshooting](#troubleshooting) section
2. Review [DEVELOPMENT_PLAN.md](../../DEVELOPMENT_PLAN.md)
3. Consult [cdk/docs/](../../cdk/docs/) design documentation
