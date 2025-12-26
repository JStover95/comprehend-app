# Comprehend CDK Infrastructure

AWS CDK infrastructure for the Comprehend mobile app backend, providing a secure, scalable foundation with VPC networking, multi-environment configuration, and CloudFormation exports for service integration.

## Features

- **Multi-Environment Support**: Pre-configured dev, staging, and prod environments
- **VPC Networking**: Isolated network infrastructure with public/private subnets across multiple AZs
- **Cost Optimized**: Dev environment without NAT gateways for cost savings
- **CloudFormation Exports**: Easy integration with dependent stacks
- **Type-Safe Configuration**: TypeScript interfaces with validation
- **Comprehensive Testing**: 76+ unit tests with 94% code coverage

## Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with appropriate credentials
- AWS account with permissions for VPC, EC2, CloudFormation
- Basic familiarity with AWS CDK and TypeScript

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Bootstrap CDK (First Time Only)

```bash
npx cdk bootstrap
```

### 3. Deploy Development Environment

```bash
# Synthesize CloudFormation template
npx cdk synth --context environment=dev

# Deploy to AWS
npx cdk deploy --context environment=dev
```

Expected deployment time: **8-10 minutes**

### 4. Verify Deployment

```bash
# View stack outputs
aws cloudformation describe-stacks --stack-name ComprehendDevStack \
  --query 'Stacks[0].Outputs'

# List exported values
aws cloudformation list-exports \
  --query 'Exports[?starts_with(Name, `dev-`)]' \
  --output table
```

## Environments

Three pre-configured environments with different resource allocations:

| Environment | VPC CIDR | AZs | NAT Gateways | Monthly Cost* | Use Case |
 | ------------- | ---------- | ----- | -------------- | --------------- | ---------- |
| **dev** | 10.0.0.0/16 | 2 | None | ~$0 | Development, testing |
| **staging** | 10.1.0.0/16 | 2 | 2 | ~$65 | Pre-production validation |
| **prod** | 10.2.0.0/16 | 3 | 3 | ~$97 | Production workloads |

*Cost estimates for us-east-1 (NAT gateway charges only; data transfer excluded)

### Deploy to Different Environments

```bash
# Staging
npx cdk deploy --context environment=staging

# Production
npx cdk deploy --context environment=prod
```

## Project Structure

```plaintext
cdk/
├── bin/
│   └── cdk.ts                    # CDK app entry point
├── lib/
│   ├── stacks/
│   │   └── comprehend-stack.ts   # Main stack with environment config
│   ├── constructs/
│   │   └── networking/
│   │       └── vpc-construct.ts  # VPC construct with subnets, NAT
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces & validation
│   └── cdk-stack.ts              # (deprecated)
├── test/
│   ├── stacks/
│   ├── constructs/
│   └── types/
├── package.json
└── README.md
```

## Stack Outputs

The stack exports the following CloudFormation outputs for use by dependent stacks:

| Export Name | Description | Example Value |
 | ------------- | ------------- | --------------- |
| `{env}-VpcId` | VPC identifier | `vpc-0123456789abcdef0` |
| `{env}-VpcCidr` | VPC CIDR block | `10.0.0.0/16` |
| `{env}-PublicSubnetIds` | Comma-separated public subnet IDs | `subnet-abc,subnet-def` |
| `{env}-PrivateSubnetIds` | Comma-separated private subnet IDs | `subnet-ghi,subnet-jkl` |
| `{env}-AvailabilityZones` | Comma-separated AZs | `us-east-1a,us-east-1b` |
| `{env}-NatGatewayIps` | NAT gateway EIPs (empty if disabled) | `52.1.2.3,52.1.2.4` |
| `{env}-EnvironmentName` | Environment identifier | `dev` |

## Using Outputs in Dependent Stacks

### Import VPC

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class MyServiceStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string) {
    super(scope, id);

    // Import VPC ID
    const vpcId = cdk.Fn.importValue('dev-VpcId');
    const vpc = ec2.Vpc.fromLookup(this, 'ImportedVpc', { vpcId });

    // Import private subnet IDs
    const subnetIds = cdk.Fn.importValue('dev-PrivateSubnetIds');
    const privateSubnets = cdk.Fn.split(',', subnetIds);

    // Use in resources...
  }
}
```

### Query Outputs Programmatically

```typescript
import { CloudFormation } from 'aws-sdk';

const cf = new CloudFormation();

async function getStackOutputs(environment: string) {
  const { Exports } = await cf.listExports().promise();
  return Exports
    ?.filter(exp => exp.Name?.startsWith(`${environment}-`))
    .reduce((acc, exp) => {
      const key = exp.Name!.replace(`${environment}-`, '');
      acc[key] = exp.Value!;
      return acc;
    }, {} as Record<string, string>);
}

// Usage
const outputs = await getStackOutputs('dev');
console.log('VPC ID:', outputs.VpcId);
```

## Configuration

### Customize Environment Settings

Edit `lib/types/index.ts` to modify environment configurations:

```typescript
export const DEFAULT_ENVIRONMENT_CONFIGS: Record<EnvironmentName, EnvironmentConfig> = {
  dev: {
    name: 'dev',
    vpcCidr: '10.0.0.0/16',
    maxAzs: 2,
    enableNatGateways: false,
    tags: {
      Application: 'Comprehend',
      Environment: 'dev',
      ManagedBy: 'CDK',
      CostCenter: 'Development'
    }
  },
  // ...
};
```

### Preview Configuration Changes

```bash
# Show what will change
npx cdk diff --context environment=dev

# Deploy changes
npx cdk deploy --context environment=dev
```

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- stacks/comprehend-stack.test.ts

# Watch mode
npm run test:watch
```

### Type Checking

```bash
# Check types without building
npm run build

# Or use tsc directly
npx tsc --noEmit
```

### Linting and Formatting

```bash
# Run linter
npm run lint

# Format code
npm run format
```

## Common Operations

### View Deployed Resources

```bash
# List VPCs
aws ec2 describe-vpcs \
  --filters "Name=tag:Environment,Values=dev" \
  --query 'Vpcs[*].{VpcId:VpcId,CIDR:CidrBlock,Name:Tags[?Key==`Name`].Value|[0]}' \
  --output table

# List subnets
aws ec2 describe-subnets \
  --filters "Name=tag:Environment,Values=dev" \
  --query 'Subnets[*].{SubnetId:SubnetId,AZ:AvailabilityZone,CIDR:CidrBlock,Type:Tags[?Key==`aws-cdk:subnet-type`].Value|[0]}' \
  --output table

# List NAT gateways (staging/prod only)
aws ec2 describe-nat-gateways \
  --filter "Name=tag:Environment,Values=prod" \
  --query 'NatGateways[*].{NatGatewayId:NatGatewayId,State:State,PublicIp:NatGatewayAddresses[0].PublicIp}' \
  --output table
```

### Update Stack

```bash
# 1. Make changes to configuration or code
# 2. Preview changes
npx cdk diff --context environment=dev

# 3. Deploy
npx cdk deploy --context environment=dev
```

### Destroy Stack

**⚠️ Warning**: Deletes all infrastructure. Check for dependent stacks first!

```bash
# Check for dependencies
aws cloudformation list-imports --export-name dev-VpcId

# If no imports, destroy
npx cdk destroy --context environment=dev
```

## Troubleshooting

### VPC CIDR Conflicts

**Error**: `CIDR block 10.0.0.0/16 conflicts with existing VPC`

**Solution**: Change VPC CIDR in `lib/types/index.ts`:

```typescript
dev: {
  vpcCidr: '10.10.0.0/16',  // Use different range
  // ...
}
```

### Insufficient Availability Zones

**Error**: `Cannot create 3 subnets when only 2 AZs available`

**Solution**: Reduce `maxAzs` for the region:

```typescript
prod: {
  maxAzs: 2,  // Reduce from 3 to 2
  // ...
}
```

### Stack Export Already Exists

**Error**: `Export dev-VpcId already exists`

**Solution**: Delete conflicting stack or use different environment name:

```bash
# Find conflicting exports
aws cloudformation list-exports \
  --query 'Exports[?starts_with(Name, `dev-`)]'

# Delete old stack
npx cdk destroy OldStackName --context environment=dev
```

### NAT Gateway Quota Exceeded

**Error**: `The maximum number of NAT gateways has been reached`

**Solution**: Request quota increase:

```bash
# Check current quota
aws service-quotas get-service-quota \
  --service-code vpc \
  --quota-code L-FE5A380F

# Request increase
aws service-quotas request-service-quota-increase \
  --service-code vpc \
  --quota-code L-FE5A380F \
  --desired-value 10
```

## Architecture

### Network Design

- **Public Subnets**: For internet-facing resources (ALB, NAT gateways)
  - CIDR mask: /24
  - Auto-assign public IPs
  - Route to Internet Gateway

- **Private Subnets**: For backend services (Lambda, RDS, ECS)
  - CIDR mask: /23 (larger for more IPs)
  - No public IPs
  - Route to NAT Gateway (staging/prod) or isolated (dev)

### High Availability

- Resources deployed across multiple AZs (2-3 depending on environment)
- NAT gateways in each AZ for redundancy (staging/prod)
- Route tables configured for automatic failover

### Security

- Network isolation via VPC
- Private subnets for backend services
- Default security group rules restricted
- All resources tagged for tracking and cost allocation

## Additional Resources

- [Full Quickstart Guide](../specs/001-base-cdk-stack/quickstart.md)
- [Design Documentation](./docs/design-docs.md)
- [Development Plan](../DEVELOPMENT_PLAN.md)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- [AWS VPC User Guide](https://docs.aws.amazon.com/vpc/latest/userguide/)

## Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review test files for usage examples
3. Consult design documentation in `docs/`
4. Check CloudFormation events: `aws cloudformation describe-stack-events --stack-name ComprehendDevStack`

## License

See [LICENSE](../LICENSE) file in the repository root.
