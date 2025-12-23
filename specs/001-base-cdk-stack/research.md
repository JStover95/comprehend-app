# Research: Base CDK Stack Foundation

**Feature**: Base CDK Stack Foundation  
**Phase**: 0 - Research & Technology Selection  
**Date**: December 23, 2025

## Overview

This document captures the research and technology decisions for implementing the base CDK stack foundation (DEVELOPMENT_PLAN.md Phase 0.1). Since this is foundational infrastructure work, technology choices are largely constrained by existing project setup and AWS CDK best practices.

## Technology Decisions

### 1. AWS CDK Version

**Decision**: AWS CDK v2 (`aws-cdk-lib`)

**Rationale**:

- CDK v2 provides a monolithic package that includes all AWS service constructs
- Simpler dependency management compared to CDK v1's per-service packages
- Active development and long-term support from AWS
- Already configured in `cdk/package.json`

**Alternatives Considered**:

- **CDK v1**: Deprecated, no longer receiving updates
- **Terraform CDK**: Adds unnecessary abstraction layer, TypeScript CDK is native AWS solution
- **CloudFormation YAML/JSON**: Lacks type safety and composability benefits of CDK

**References**:

- [AWS CDK v2 Migration Guide](https://docs.aws.amazon.com/cdk/v2/guide/migrating-v2.html)
- [CDK Best Practices](https://docs.aws.amazon.com/cdk/v2/guide/best-practices.html)

---

### 2. VPC Configuration Pattern

**Decision**: Custom VPC construct with configurable CIDR and multi-AZ subnet distribution

**Rationale**:

- Encapsulates VPC complexity in reusable construct
- Allows environment-specific CIDR configuration (dev, staging, prod can coexist)
- Supports regions with varying AZ counts (handles 2-3+ AZs)
- Enables future extension without modifying stack code

**Alternatives Considered**:

- **`ec2.Vpc` default construct**: Limited customization, doesn't meet requirement for configurable CIDR
- **VPC Peering**: Unnecessary complexity for single-app infrastructure
- **Multiple VPCs per environment**: Increases costs and management overhead

**Implementation Approach**:

```typescript
// VPC Construct will accept props:
interface VpcConstructProps {
  environmentName: string;      // dev, staging, prod
  cidrBlock: string;             // e.g., "10.0.0.0/16"
  maxAzs?: number;               // default: 2 (meets SC-003)
  natGateways?: number;          // default: matches maxAzs for HA
}
```

**References**:

- [AWS VPC Design Guide](https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html)
- [CDK VPC Construct Documentation](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.Vpc.html)
- [Multi-AZ Best Practices](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/use-highly-available-multi-az-architectures.html)

---

### 3. Environment Configuration Management

**Decision**: TypeScript interface with environment-specific configuration objects

**Rationale**:

- Type-safe configuration at compile time (Constitution V)
- Easy to extend with new environments
- Configuration lives in code, versioned with infrastructure
- Supports environment variable overrides for CI/CD

**Alternatives Considered**:

- **AWS Systems Manager Parameter Store**: Adds runtime dependency and complexity for static configuration
- **External config files (JSON/YAML)**: Loses type safety and IDE autocomplete
- **CDK Context variables**: Intended for account/region lookups, not application config

**Implementation Approach**:

```typescript
interface EnvironmentConfig {
  name: string;                  // 'dev' | 'staging' | 'prod'
  vpcCidr: string;               // VPC CIDR block
  maxAzs: number;                // Number of availability zones
  enableNatGateways: boolean;    // Cost optimization for dev
  tags: Record<string, string>;  // Cost tracking tags
}

const ENVIRONMENT_CONFIGS: Record<string, EnvironmentConfig> = {
  dev: { /* ... */ },
  staging: { /* ... */ },
  prod: { /* ... */ }
};
```

**References**:

- [CDK Environment Variables](https://docs.aws.amazon.com/cdk/v2/guide/environments.html)
- `cdk/docs/types-and-configuration.md` - Project type definition patterns

---

### 4. Testing Strategy for Infrastructure

**Decision**: Jest with CDK assertions for stack synthesis validation

**Rationale**:

- Jest already configured in `cdk/jest.config.js`
- CDK provides `@aws-cdk/assertions` module for infrastructure testing
- Tests validate synthesized CloudFormation without AWS deployment
- Fast feedback loop (no AWS API calls in unit tests)

**Test Levels**:

1. **Unit Tests** (constructs):
   - VPC construct creates correct subnets
   - NAT gateways distributed across AZs
   - Tags applied to all resources
   - CIDR blocks properly allocated

2. **Stack Tests**:
   - Stack synthesizes without errors
   - Outputs are properly exported
   - Environment configuration correctly applied
   - Resource counts match expectations

3. **Integration Tests** (future):
   - Actual deployment to test AWS account
   - Validate cross-stack references work
   - End-to-end infrastructure validation

**Alternatives Considered**:

- **LocalStack**: Not necessary for CDK constructs (no runtime AWS SDK calls)
- **Mocha/Chai**: Jest already configured and provides better TypeScript support
- **Manual testing only**: Violates Constitution I (Testing-First)

**References**:

- [CDK Testing Guide](https://docs.aws.amazon.com/cdk/v2/guide/testing.html)
- [CDK Assertions Module](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.assertions-readme.html)
- `cdk/docs/testing/summary.md` - Project testing patterns

---

### 5. Resource Naming and Tagging Strategy

**Decision**: Consistent naming convention with environment prefix and comprehensive tagging

**Rationale**:

- Prevents resource naming conflicts across environments (FR-006)
- Enables accurate cost allocation by environment (SC-004)
- Facilitates resource discovery and management
- Supports multi-environment deployments to same AWS account (SC-002)

**Naming Convention**:

```plaintext
{app-name}-{environment}-{resource-type}
comprehend-dev-vpc
comprehend-prod-nat-gateway-az1
```

**Required Tags**:

- `Application`: "Comprehend"
- `Environment`: "dev" | "staging" | "prod"
- `ManagedBy`: "CDK"
- `CostCenter`: environment-specific
- `Owner`: "Backend Team"

**Implementation**:

```typescript
// Apply tags to all resources in stack
cdk.Tags.of(stack).add('Application', 'Comprehend');
cdk.Tags.of(stack).add('Environment', config.name);
cdk.Tags.of(stack).add('ManagedBy', 'CDK');
```

**References**:

- [AWS Tagging Best Practices](https://docs.aws.amazon.com/general/latest/gr/aws_tagging.html)
- [CDK Tagging](https://docs.aws.amazon.com/cdk/v2/guide/tagging.html)

---

### 6. Stack Output Exports

**Decision**: CDK `CfnOutput` with explicit export names for cross-stack references

**Rationale**:

- Dependent stacks can import VPC and subnet IDs (FR-008, FR-009)
- Export names include environment for multi-env support
- Type-safe imports through CDK constructs
- Avoids hardcoding resource IDs

**Outputs to Export**:

- VPC ID
- Public subnet IDs (comma-separated)
- Private subnet IDs (comma-separated)
- NAT gateway IPs
- Availability zones used
- Environment name

**Implementation**:

```typescript
new cdk.CfnOutput(this, 'VpcId', {
  value: vpc.vpcId,
  exportName: `${config.name}-VpcId`,
  description: 'VPC ID for dependent stacks'
});
```

**References**:

- [CloudFormation Outputs](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/outputs-section-structure.html)
- [CDK Cross-Stack References](https://docs.aws.amazon.com/cdk/v2/guide/stack_how_to_create_multiple_stacks.html)

---

## Architecture Decisions

### Multi-AZ Design

**Decision**: Deploy across 2 availability zones by default, support 3+ where available

**Reasoning**:

- Meets minimum HA requirement (SC-003)
- Handles regions with only 2 AZs (Edge Case)
- Balances cost vs. availability (dev uses 2, prod can use 3)
- NAT gateways in each AZ for resilient outbound connectivity

**Cost Implications**:

- 2 NAT gateways (one per AZ): ~$65/month for dev
- 3 NAT gateways for prod: ~$97/month
- Alternative: Single NAT gateway saves money but creates single point of failure

---

### CIDR Block Allocation

**Decision**: Environment-specific CIDR blocks from RFC 1918 private ranges

**Proposed Allocation**:

- **Dev**: 10.0.0.0/16 (65,536 IPs)
- **Staging**: 10.1.0.0/16 (65,536 IPs)
- **Prod**: 10.2.0.0/16 (65,536 IPs)

**Subnet Division** (per environment):

- Public subnets: 10.x.0.0/24, 10.x.1.0/24 (512 IPs total)
- Private subnets: 10.x.10.0/23, 10.x.12.0/23 (2,048 IPs total)
- Reserved: Remaining space for future expansion

**Reasoning**:

- Non-overlapping blocks allow VPC peering if needed
- /16 provides ample IP space for expected 50+ Lambda functions, RDS clusters
- Public subnets smaller (internet-facing resources limited)
- Private subnets larger (most backend services here)

---

## Best Practices Findings

### From AWS Well-Architected Framework

1. **Reliability Pillar**:
   - ✅ Multi-AZ deployment
   - ✅ NAT gateway redundancy
   - ✅ Private subnet isolation

2. **Security Pillar**:
   - ✅ Private subnets for backend services
   - ✅ Public subnets only for internet-facing resources
   - ✅ Security group boundaries (future work)

3. **Cost Optimization Pillar**:
   - ⚠️ NAT gateways are costly (~$32/month each)
   - ✅ Dev environment can use 1-2 NAT gateways
   - ✅ Prod uses 2-3 for HA

4. **Operational Excellence Pillar**:
   - ✅ Infrastructure as code
   - ✅ Automated testing
   - ✅ Tagged for cost tracking

---

## Open Questions & Future Considerations

### Future Enhancements (Out of Scope)

1. **VPC Flow Logs**: Not included in base stack, add in security phase
2. **VPC Endpoints**: S3/DynamoDB endpoints for cost savings, add when services deployed
3. **Network ACLs**: Additional subnet-level security, configure per service needs
4. **Transit Gateway**: Multi-VPC connectivity, not needed for single-app architecture

### Performance Considerations

- NAT gateway bandwidth: 45 Gbps (sufficient for expected 10k users)
- VPC has soft limit of 200 subnets (far exceeds our 4-6 subnet need)
- Lambda functions in VPC: Hyperplane ENIs eliminate cold start penalty (CDK v2 default)

---

## Summary

All technology decisions align with:

- ✅ Project constitution (Testing-First, Type Safety, Modular Architecture)
- ✅ Existing CDK setup and patterns
- ✅ AWS best practices and Well-Architected Framework
- ✅ Feature requirements (FR-001 through FR-012)
- ✅ Success criteria (SC-001 through SC-006)

No unresolved questions or blocked decisions. Ready to proceed to Phase 1 (Design & Contracts).
