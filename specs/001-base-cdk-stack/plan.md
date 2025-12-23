# Implementation Plan: Base CDK Stack Foundation

**Branch**: `001-base-cdk-stack` | **Date**: December 23, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-base-cdk-stack/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This plan implements Phase 0.1 (CDK Stack Structure) from the DEVELOPMENT_PLAN.md, establishing the foundational infrastructure for the Comprehend mobile app backend. The implementation creates a reusable base stack with environment configuration support and VPC networking infrastructure that will serve as the foundation for all subsequent backend services including authentication, database, APIs, and the ReaderAgent.

## Technical Context

**Language/Version**: TypeScript (per existing `cdk/tsconfig.json`), Node.js runtime for CDK synthesis  
**Primary Dependencies**: 
- `aws-cdk-lib` (AWS CDK v2 - monolithic library)
- `constructs` (CDK constructs base library)
- AWS EC2 constructs for VPC, Subnets, NAT Gateways, Internet Gateways

**Storage**: N/A (infrastructure configuration only)  
**Testing**: Jest (per existing `cdk/jest.config.js`), CDK assertions for stack synthesis validation  
**Target Platform**: AWS Cloud Infrastructure (region-agnostic)  
**Project Type**: Infrastructure-as-Code (Backend CDK)  
**Performance Goals**: 
- Stack synthesis in <10 seconds
- Stack deployment in <15 minutes (Success Criteria SC-001)
- Support multi-environment deployments to same AWS account

**Constraints**: 
- Must support minimum 2 availability zones (Success Criteria SC-003)
- Must work in regions with only 2 AZs (Edge Case)
- Must avoid CIDR conflicts with existing VPCs (Edge Case)
- All resources must be taggable for cost tracking (FR-007)
- Must export outputs for dependent stacks (FR-008, FR-009)

**Scale/Scope**: 
- 3 environments (dev, staging, prod) per AWS account
- Foundation for ~50 Lambda functions, RDS Aurora, API Gateway
- Expected to support 10k+ concurrent users in production

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance | Notes |
|-----------|------------|-------|
| I. Testing-First | ✅ Pass | Jest configured, stack synthesis tests required per constitution. CDK assertions for infrastructure validation. |
| II. Accessibility-First | ✅ N/A | Infrastructure work - no user-facing UI components |
| III. Modular Architecture | ✅ Pass | Will follow construct pattern (VPC construct separate from stack). Constructs are self-contained and independently testable. |
| IV. Design Doc Adherence | ✅ Pass | Reviewing `types-and-configuration.md` for type patterns. Infrastructure doesn't use Agent pattern (no Lambda handlers in this phase). |
| V. Type Safety | ✅ Pass | Strict TypeScript enabled in `cdk/tsconfig.json` with `strict: true` |

**Design Docs to Review:**

- Backend (`cdk/`): 
  - `types-and-configuration.md` - Type definition patterns for environment config and construct props
  - `testing/summary.md` - Overview of testing strategy
  - `testing/unit-testing.md` - Unit testing patterns for infrastructure
  - `testing/decision-guide.md` - Mocking strategy decisions (note: CDK constructs don't require AWS SDK mocking)
- Frontend (`comprehend/`): N/A (infrastructure work only)

## Project Structure

### Documentation (this feature)

```text
specs/001-base-cdk-stack/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── environment-config.schema.json  # Environment configuration schema
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

This feature implements infrastructure-as-code in the existing `cdk/` directory:

```text
cdk/
├── bin/
│   └── cdk.ts           # [MODIFIED] Entry point - will instantiate ComprehendStack with env config
├── lib/
│   ├── cdk-stack.ts     # [DEPRECATED] Will be replaced by stacks/comprehend-stack.ts
│   ├── stacks/          # [NEW] Stack definitions
│   │   └── comprehend-stack.ts  # Main stack with environment configuration
│   ├── constructs/      # [NEW] Reusable CDK constructs
│   │   └── networking/
│   │       └── vpc-construct.ts  # VPC with public/private subnets, NAT gateways, IGW
│   └── types/           # [NEW] Shared TypeScript types
│       └── index.ts     # Environment config types, construct props interfaces
└── test/
    ├── cdk.test.ts      # [MODIFIED] Update to test new stack structure
    ├── stacks/          # [NEW] Stack-level tests
    │   └── comprehend-stack.test.ts  # Stack synthesis and configuration tests
    └── constructs/      # [NEW] Construct-level tests
        └── networking/
            └── vpc-construct.test.ts  # VPC configuration validation tests
```

**Structure Decision**: Infrastructure-as-Code structure following AWS CDK best practices. The `stacks/` directory contains stack definitions, `constructs/` contains reusable L3 constructs, and `types/` contains shared TypeScript interfaces. This aligns with the modular architecture principle (Constitution III) by separating concerns: bin/ for app instantiation, stacks/ for resource orchestration, constructs/ for encapsulated infrastructure components, and types/ for type safety.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations. All principles satisfied:
- Testing-First: Jest configured with CDK assertions
- Accessibility-First: N/A for infrastructure
- Modular Architecture: Construct pattern provides clear separation
- Design Doc Adherence: Following types-and-configuration.md patterns
- Type Safety: Strict TypeScript enabled

---

## Implementation Phases Summary

### Phase 0: Research ✅ Complete

**Deliverable**: `research.md`

Key decisions documented:
- AWS CDK v2 with TypeScript
- Custom VPC construct with configurable CIDR
- Environment configuration via TypeScript interfaces
- Jest + CDK assertions testing strategy
- Resource naming and tagging conventions
- Multi-AZ design with NAT gateway strategy
- CIDR block allocation (10.0.0.0/16, 10.1.0.0/16, 10.2.0.0/16)

### Phase 1: Design & Contracts ✅ Complete

**Deliverables**: 
- `data-model.md` - Type definitions and infrastructure entities
- `contracts/environment-config.schema.json` - Configuration schema
- `contracts/stack-outputs.schema.json` - Stack outputs contract
- `quickstart.md` - Developer guide and deployment instructions
- `.cursor/rules/specify-rules.mdc` - Updated agent context

Key designs:
- `EnvironmentConfig` interface with validation rules
- `VpcConstructProps` for VPC construct configuration
- `ComprehendStackOutputs` for cross-stack references
- Default environment configurations (dev, staging, prod)
- CloudFormation export naming conventions

### Constitution Re-Check: Post-Design ✅ Pass

All five principles verified against design artifacts:

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Testing-First | ✅ Pass | Test structure defined in Project Structure. Jest + CDK assertions documented in research.md. |
| II. Accessibility-First | ✅ N/A | Infrastructure-only feature (no UI components). |
| III. Modular Architecture | ✅ Pass | Clear separation: types/ (interfaces), constructs/ (reusable components), stacks/ (orchestration). |
| IV. Design Doc Adherence | ✅ Pass | Follows `types-and-configuration.md` patterns. All type interfaces use JSDoc and readonly properties. |
| V. Type Safety | ✅ Pass | Strict TypeScript types defined. Union types for EnvironmentName. No `any` types. Validation functions for runtime checks. |

---

## Development Roadmap

This plan covers **Phase 0.1 (CDK Stack Structure)** from DEVELOPMENT_PLAN.md:

**Units Addressed**:
- ✅ 0.1.1: Create base stack with environment configuration
- ✅ 0.1.2: Set up VPC construct with public/private subnets  
- ✅ 0.1.3: Set up shared types and interfaces

**Next Phase**: Phase 0.2 - Database Infrastructure (RDS Aurora, Secrets Manager, bootstrap Lambda)

**Implementation Steps** (for `/speckit.tasks`):
1. Create `cdk/lib/types/index.ts` with EnvironmentConfig interfaces
2. Create `cdk/lib/constructs/networking/vpc-construct.ts` with VPC implementation
3. Create `cdk/lib/stacks/comprehend-stack.ts` replacing existing cdk-stack.ts
4. Update `cdk/bin/cdk.ts` to instantiate ComprehendStack with environment context
5. Create unit tests for VPC construct
6. Create unit tests for ComprehendStack
7. Update integration tests

---

## Key Decisions & Rationale

### 1. Environment Configuration Approach

**Decision**: TypeScript interfaces with default configurations (not external config files)

**Rationale**:
- Type safety at compile time (Constitution V)
- Version controlled with infrastructure code
- Easy IDE autocomplete and validation
- Supports environment variable overrides for CI/CD

**Trade-offs**:
- ✅ Pros: Type safe, maintainable, documented
- ❌ Cons: Requires code change + deployment for config updates (acceptable for infrastructure)

### 2. VPC CIDR Allocation Strategy

**Decision**: Non-overlapping /16 blocks per environment (10.0.0.0/16, 10.1.0.0/16, 10.2.0.0/16)

**Rationale**:
- Allows all environments in same AWS account (SC-002)
- Enables VPC peering if needed (future consideration)
- Sufficient IP space for expected scale (65k IPs per environment)
- Industry standard private IP ranges (RFC 1918)

**Alternatives Rejected**:
- Single VPC for all environments: Security isolation concern
- Smaller CIDR blocks (/20): Insufficient for 50+ Lambda functions + RDS
- Overlapping blocks: Prevents multi-environment deployment

### 3. NAT Gateway Strategy

**Decision**: Disabled for dev, enabled for staging/prod (one per AZ)

**Rationale**:
- Cost optimization for dev (~$65/month savings)
- High availability for production (no single point of failure)
- Meets FR-004 requirement for private subnet internet access

**Cost Analysis**:
- Dev: $0/month (NAT disabled, use VPN or Cloud9 for testing)
- Staging: $65/month (2 NAT gateways)
- Prod: $97/month (3 NAT gateways)

### 4. Testing Strategy

**Decision**: CDK assertions for unit tests, no LocalStack for infrastructure tests

**Rationale**:
- CDK constructs don't make AWS API calls during synthesis
- Assertions validate synthesized CloudFormation templates
- Fast feedback (tests run in milliseconds)
- Integration tests on actual AWS for end-to-end validation

**Test Coverage Goals**:
- Unit tests: >80% (Constitution I)
- Stack synthesis tests: 100% of outputs verified
- Construct tests: All properties and relationships validated

---

## Risk Assessment & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| CIDR conflicts with existing VPCs | Medium | High | Document allocated ranges. Validate before deployment. Provide override mechanism. |
| Region has only 2 AZs | Medium | Low | Default to 2 AZs. Make maxAzs configurable. Document region compatibility. |
| NAT gateway quota exceeded | Low | Medium | Start with 2 AZs. Request quota increase proactively for prod. |
| Stack export naming conflicts | Low | High | Include environment in export names. Document naming conventions. |
| VPC CIDR change requires replacement | Low | Critical | Clearly document in quickstart.md. Warn about destructive operations. |

---

## Success Criteria Verification

Mapping feature requirements to implementation plan:

| Requirement | Implementation | Verification |
|-------------|----------------|--------------|
| **FR-001**: VPC with configurable CIDR | `EnvironmentConfig.vpcCidr` property | Unit test validates CIDR passed to VPC construct |
| **FR-002**: Subnets across ≥2 AZs | `EnvironmentConfig.maxAzs` (min: 2) | CDK assertion verifies subnet count and AZ distribution |
| **FR-003**: Public and private subnets | VPC construct creates both types | CDK assertion verifies subnet types and route tables |
| **FR-004**: NAT gateways for private subnets | `EnvironmentConfig.enableNatGateways` | CDK assertion verifies NAT gateway creation and routing |
| **FR-005**: Environment identifier input | `EnvironmentName` type ('dev'/'staging'/'prod') | Type compilation enforces valid values |
| **FR-006**: Environment-specific naming | Resource names include `${config.name}` | Unit test verifies naming pattern |
| **FR-007**: Resource tagging | `EnvironmentConfig.tags` applied via `cdk.Tags.of()` | CDK assertion verifies all resources have required tags |
| **FR-008**: Export VPC/subnet IDs | `CfnOutput` with export names | Integration test imports and uses exports |
| **FR-009**: Export environment config | Environment name in outputs | Integration test verifies config inheritance |
| **FR-010**: Validate configuration | `validateEnvironmentConfig()` function | Unit test for validation logic |
| **FR-011**: Multi-region support | No hardcoded regions in code | Deploy test to different region |
| **FR-012**: Security boundaries | Separate VPCs per environment | Integration test verifies isolation |

**Success Criteria**:
- ✅ **SC-001**: Deployment <15 minutes - Verified via quickstart deployment timing
- ✅ **SC-002**: 3 environments per account - Validated by non-overlapping CIDR design
- ✅ **SC-003**: ≥2 AZs - Enforced by `maxAzs` minimum value
- ✅ **SC-004**: 100% tagging - Verified by required tags validation
- ✅ **SC-005**: 80% setup time reduction - Measured by dependent stack creation time
- ✅ **SC-006**: No code changes for config - Achieved via environment context parameter

---

## Planning Complete

**Status**: ✅ Ready for Implementation (`/speckit.tasks`)

**Artifacts Generated**:
- ✅ `plan.md` (this file)
- ✅ `research.md` (technology decisions)
- ✅ `data-model.md` (type definitions)
- ✅ `contracts/environment-config.schema.json` (configuration contract)
- ✅ `contracts/stack-outputs.schema.json` (outputs contract)
- ✅ `quickstart.md` (developer guide)
- ✅ `.cursor/rules/specify-rules.mdc` (agent context updated)

**Next Steps**:
1. Run `/speckit.tasks` to generate task breakdown
2. Implement units 0.1.1, 0.1.2, 0.1.3 per DEVELOPMENT_PLAN.md
3. Write tests in parallel with implementation (Constitution I)
4. Deploy to dev environment for validation
5. Proceed to Phase 0.2 (Database Infrastructure)
