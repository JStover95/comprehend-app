# Tasks: Base CDK Stack Foundation

**Input**: Design documents from `/specs/001-base-cdk-stack/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Per Constitution Principle I (Testing-First), tests are MANDATORY and must be written in parallel with features. All test tasks are included in each user story phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This feature uses the CDK infrastructure-as-code structure:

- Source code: `cdk/lib/`
- Tests: `cdk/test/`
- Entry point: `cdk/bin/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure per DEVELOPMENT_PLAN.md Phase 0.1

- [ ] T001 Create directory structure: `cdk/lib/stacks/`, `cdk/lib/constructs/networking/`, `cdk/lib/types/`
- [ ] T002 Create test directory structure: `cdk/test/stacks/`, `cdk/test/constructs/networking/`
- [ ] T003 [P] Verify Jest configuration in `cdk/jest.config.js` includes CDK assertions support
- [ ] T004 [P] Verify TypeScript strict mode enabled in `cdk/tsconfig.json`

**Checkpoint**: Directory structure ready for implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core type definitions and validation that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create `EnvironmentName` union type ('dev' | 'staging' | 'prod') in `cdk/lib/types/index.ts`
- [ ] T006 Create `EnvironmentConfig` interface in `cdk/lib/types/index.ts` with JSDoc documentation
- [ ] T007 Create `VpcConstructProps` interface in `cdk/lib/types/index.ts`
- [ ] T008 Create `ComprehendStackOutputs` interface in `cdk/lib/types/index.ts`
- [ ] T009 [P] Implement `validateEnvironmentConfig()` function in `cdk/lib/types/index.ts`
- [ ] T010 [P] Implement `validateCidr()` helper function in `cdk/lib/types/index.ts`
- [ ] T011 [P] Write unit test for `validateEnvironmentConfig()` in `cdk/test/types/validation.test.ts`
- [ ] T012 [P] Write unit test for `validateCidr()` in `cdk/test/types/validation.test.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Deploy Isolated Network Infrastructure (Priority: P1) 🎯 MVP

**Goal**: Create a VPC with public and private subnets across multiple availability zones with NAT gateways for private subnet internet access

**Independent Test**: Deploy the stack and verify VPC is created with proper subnets (2+ AZs), internet gateway, and NAT gateways. Validate network isolation and internet connectivity.

**Acceptance Criteria**:

- VPC created with isolated network boundaries (FR-001)
- Public and private subnets across multiple AZs (FR-002, FR-003)
- Private subnets can access internet through NAT gateways (FR-004)

### Tests for User Story 1 ✅

> **NOTE: Per Constitution Principle I - Write tests FIRST, ensure they FAIL before implementation**

- [ ] T013 [P] [US1] Create test file `cdk/test/constructs/networking/vpc-construct.test.ts`
- [ ] T014 [P] [US1] Write test: "creates VPC with specified CIDR block" in `cdk/test/constructs/networking/vpc-construct.test.ts`
- [ ] T015 [P] [US1] Write test: "creates public subnets across multiple AZs" in `cdk/test/constructs/networking/vpc-construct.test.ts`
- [ ] T016 [P] [US1] Write test: "creates private subnets across multiple AZs" in `cdk/test/constructs/networking/vpc-construct.test.ts`
- [ ] T017 [P] [US1] Write test: "creates NAT gateways when enabled" in `cdk/test/constructs/networking/vpc-construct.test.ts`
- [ ] T018 [P] [US1] Write test: "does not create NAT gateways when disabled" in `cdk/test/constructs/networking/vpc-construct.test.ts`
- [ ] T019 [P] [US1] Write test: "creates internet gateway for public subnets" in `cdk/test/constructs/networking/vpc-construct.test.ts`
- [ ] T020 [P] [US1] Write test: "subnet count matches maxAzs configuration" in `cdk/test/constructs/networking/vpc-construct.test.ts`

### Implementation for User Story 1

- [ ] T021 [US1] Create `VpcConstruct` class in `cdk/lib/constructs/networking/vpc-construct.ts`
- [ ] T022 [US1] Implement VPC creation with configurable CIDR in `cdk/lib/constructs/networking/vpc-construct.ts`
- [ ] T023 [US1] Implement public subnet creation across AZs in `cdk/lib/constructs/networking/vpc-construct.ts`
- [ ] T024 [US1] Implement private subnet creation across AZs in `cdk/lib/constructs/networking/vpc-construct.ts`
- [ ] T025 [US1] Implement Internet Gateway and attach to VPC in `cdk/lib/constructs/networking/vpc-construct.ts`
- [ ] T026 [US1] Implement NAT Gateway creation (conditional on `enableNatGateways`) in `cdk/lib/constructs/networking/vpc-construct.ts`
- [ ] T027 [US1] Configure route tables for public subnets (route to IGW) in `cdk/lib/constructs/networking/vpc-construct.ts`
- [ ] T028 [US1] Configure route tables for private subnets (route to NAT) in `cdk/lib/constructs/networking/vpc-construct.ts`
- [ ] T029 [US1] Add getters for VPC, subnet IDs, and AZs in `cdk/lib/constructs/networking/vpc-construct.ts`
- [ ] T030 [US1] Run tests and verify all US1 tests pass: `npm test -- vpc-construct.test.ts`

**Checkpoint**: VPC construct is complete and independently testable. All tests passing.

---

## Phase 4: User Story 2 - Manage Multiple Environment Configurations (Priority: P2)

**Goal**: Support deployment to multiple environments (dev, staging, prod) with environment-specific configurations, naming, and tagging

**Independent Test**: Deploy stack to dev and prod with different environment parameters. Verify resources have correct naming conventions, tags, and configuration differences (e.g., dev has no NAT gateways, prod has 3).

**Acceptance Criteria**:

- Environment-specific resource sizing and naming (FR-006)
- All resources tagged with environment identifier (FR-007)
- Multiple environments can coexist in same AWS account (FR-005, SC-002)

### Tests for User Story 2 ✅

- [ ] T031 [P] [US2] Create test file `cdk/test/stacks/comprehend-stack.test.ts`
- [ ] T032 [P] [US2] Write test: "creates stack with dev environment configuration" in `cdk/test/stacks/comprehend-stack.test.ts`
- [ ] T033 [P] [US2] Write test: "creates stack with staging environment configuration" in `cdk/test/stacks/comprehend-stack.test.ts`
- [ ] T034 [P] [US2] Write test: "creates stack with prod environment configuration" in `cdk/test/stacks/comprehend-stack.test.ts`
- [ ] T035 [P] [US2] Write test: "applies environment-specific resource naming" in `cdk/test/stacks/comprehend-stack.test.ts`
- [ ] T036 [P] [US2] Write test: "applies required tags to all resources" in `cdk/test/stacks/comprehend-stack.test.ts`
- [ ] T037 [P] [US2] Write test: "dev environment has no NAT gateways" in `cdk/test/stacks/comprehend-stack.test.ts`
- [ ] T038 [P] [US2] Write test: "prod environment has NAT gateways matching maxAzs" in `cdk/test/stacks/comprehend-stack.test.ts`
- [ ] T039 [P] [US2] Write test: "validates invalid environment names are rejected" in `cdk/test/stacks/comprehend-stack.test.ts`

### Implementation for User Story 2

- [ ] T040 [P] [US2] Create `DEFAULT_ENVIRONMENT_CONFIGS` object for dev in `cdk/lib/types/index.ts`
- [ ] T041 [P] [US2] Create `DEFAULT_ENVIRONMENT_CONFIGS` object for staging in `cdk/lib/types/index.ts`
- [ ] T042 [P] [US2] Create `DEFAULT_ENVIRONMENT_CONFIGS` object for prod in `cdk/lib/types/index.ts`
- [ ] T043 [US2] Create `ComprehendStack` class in `cdk/lib/stacks/comprehend-stack.ts`
- [ ] T044 [US2] Implement environment configuration loading in `cdk/lib/stacks/comprehend-stack.ts` constructor
- [ ] T045 [US2] Implement environment validation (call `validateEnvironmentConfig()`) in `cdk/lib/stacks/comprehend-stack.ts`
- [ ] T046 [US2] Instantiate `VpcConstruct` with environment config in `cdk/lib/stacks/comprehend-stack.ts`
- [ ] T047 [US2] Apply environment-specific naming to all resources in `cdk/lib/stacks/comprehend-stack.ts`
- [ ] T048 [US2] Apply tags to all stack resources using `cdk.Tags.of()` in `cdk/lib/stacks/comprehend-stack.ts`
- [ ] T049 [US2] Update `cdk/bin/cdk.ts` to accept environment context parameter
- [ ] T050 [US2] Update `cdk/bin/cdk.ts` to instantiate `ComprehendStack` (replace `CdkStack`)
- [ ] T051 [US2] Run tests and verify all US2 tests pass: `npm test -- comprehend-stack.test.ts`

**Checkpoint**: Multi-environment support is complete. Can deploy to dev, staging, or prod independently.

---

## Phase 5: User Story 3 - Extend Infrastructure for Additional Services (Priority: P3)

**Goal**: Export VPC and subnet identifiers via CloudFormation outputs so dependent stacks can reference them without manual configuration

**Independent Test**: Create a minimal dependent stack that imports VPC ID and subnet IDs from the base stack exports. Verify the dependent stack deploys successfully and can use the imported values.

**Acceptance Criteria**:

- VPC and subnet IDs exported via CloudFormation (FR-008)
- Environment configuration values exported (FR-009)
- Dependent stacks can import and use exports without manual config (SC-005)

### Tests for User Story 3 ✅

- [ ] T052 [P] [US3] Write test: "exports VPC ID with environment-prefixed name" in `cdk/test/stacks/comprehend-stack.test.ts`
- [ ] T053 [P] [US3] Write test: "exports public subnet IDs comma-separated" in `cdk/test/stacks/comprehend-stack.test.ts`
- [ ] T054 [P] [US3] Write test: "exports private subnet IDs comma-separated" in `cdk/test/stacks/comprehend-stack.test.ts`
- [ ] T055 [P] [US3] Write test: "exports availability zones comma-separated" in `cdk/test/stacks/comprehend-stack.test.ts`
- [ ] T056 [P] [US3] Write test: "exports NAT gateway IPs when enabled" in `cdk/test/stacks/comprehend-stack.test.ts`
- [ ] T057 [P] [US3] Write test: "exports environment name" in `cdk/test/stacks/comprehend-stack.test.ts`
- [ ] T058 [P] [US3] Write test: "exports VPC CIDR block" in `cdk/test/stacks/comprehend-stack.test.ts`
- [ ] T059 [P] [US3] Write test: "export names follow naming convention {env}-{OutputName}" in `cdk/test/stacks/comprehend-stack.test.ts`

### Implementation for User Story 3

- [ ] T060 [P] [US3] Create `CfnOutput` for VPC ID in `cdk/lib/stacks/comprehend-stack.ts`
- [ ] T061 [P] [US3] Create `CfnOutput` for public subnet IDs in `cdk/lib/stacks/comprehend-stack.ts`
- [ ] T062 [P] [US3] Create `CfnOutput` for private subnet IDs in `cdk/lib/stacks/comprehend-stack.ts`
- [ ] T063 [P] [US3] Create `CfnOutput` for availability zones in `cdk/lib/stacks/comprehend-stack.ts`
- [ ] T064 [P] [US3] Create `CfnOutput` for NAT gateway IPs in `cdk/lib/stacks/comprehend-stack.ts`
- [ ] T065 [P] [US3] Create `CfnOutput` for environment name in `cdk/lib/stacks/comprehend-stack.ts`
- [ ] T066 [P] [US3] Create `CfnOutput` for VPC CIDR in `cdk/lib/stacks/comprehend-stack.ts`
- [ ] T067 [US3] Add JSDoc documentation for all outputs in `cdk/lib/stacks/comprehend-stack.ts`
- [ ] T068 [US3] Run tests and verify all US3 tests pass: `npm test -- comprehend-stack.test.ts`
- [ ] T069 [US3] Create example dependent stack in `cdk/test/examples/dependent-stack.example.ts` (documentation)

**Checkpoint**: All stack outputs exported. Dependent stacks can import and use infrastructure.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, documentation, and integration testing

- [ ] T070 [P] Run full test suite and verify >80% coverage: `npm test -- --coverage`
- [ ] T071 [P] Run linting and fix any issues: `npm run lint`
- [ ] T072 [P] Verify TypeScript compilation: `npx tsc --noEmit`
- [ ] T073 Synthesize CloudFormation template for dev: `npx cdk synth --context environment=dev`
- [ ] T074 Verify synthesized template has no security warnings: `npx cdk synth --context environment=dev | grep -i security`
- [ ] T075 [P] Update `cdk/README.md` with deployment instructions from quickstart.md
- [ ] T076 Create integration test script `cdk/test/integration/deploy-and-verify.sh`
- [ ] T077 Write integration test: deploy dev stack and verify VPC created in `cdk/test/integration/deploy-and-verify.sh`
- [ ] T078 Write integration test: verify exports are available via CloudFormation API in `cdk/test/integration/deploy-and-verify.sh`
- [ ] T079 Write integration test: verify resource tags match environment config in `cdk/test/integration/deploy-and-verify.sh`
- [ ] T080 [P] Add edge case test: deploy to region with only 2 AZs in `cdk/test/stacks/comprehend-stack.test.ts`
- [ ] T081 [P] Add edge case test: CIDR validation rejects invalid ranges in `cdk/test/types/validation.test.ts`
- [ ] T082 Deprecate `cdk/lib/cdk-stack.ts` (add deprecation notice)
- [ ] T083 Update `cdk/test/cdk.test.ts` to test new `ComprehendStack` instead of `CdkStack`
- [ ] T084 Run quickstart validation: Follow deployment steps in `specs/001-base-cdk-stack/quickstart.md`
- [ ] T085 Document any deviations from plan in `specs/001-base-cdk-stack/IMPLEMENTATION_NOTES.md`

**Checkpoint**: Feature complete, tested, and ready for deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) completion
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) + User Story 1 (Phase 3)
- **User Story 3 (Phase 5)**: Depends on User Story 2 (Phase 4) - requires stack with environment config
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

```plaintext
Phase 1 (Setup)
     ↓
Phase 2 (Foundational) ← CRITICAL BLOCKER
     ↓
Phase 3 (US1: Network Infrastructure) ← MVP MILESTONE
     ↓
Phase 4 (US2: Multi-Environment) ← builds on US1
     ↓
Phase 5 (US3: Extensibility) ← builds on US2
     ↓
Phase 6 (Polish)
```

**Key Dependencies**:

- US2 depends on US1: Multi-environment configuration requires VPC construct to exist
- US3 depends on US2: Stack outputs require stack with environment configuration
- US1 is the **MVP**: Can deploy and validate network infrastructure independently

### Within Each User Story

1. **Tests FIRST** (Constitution Principle I):
   - Write all tests for the story
   - Verify tests FAIL before implementation

2. **Implementation Order**:
   - Types/interfaces (if new ones needed)
   - Core construct/stack classes
   - Feature implementation
   - Integration with previous components

3. **Validation**:
   - Run story-specific tests
   - Verify all tests pass
   - Run synthesis test

### Parallel Opportunities

**Phase 1 (Setup)**: All tasks can run in parallel (T001-T004)

**Phase 2 (Foundational)**:

- T005-T008: Type definitions in sequence (same file)
- T009-T010: Validation functions in parallel (after types defined)
- T011-T012: Tests in parallel (different files)

**Phase 3 (User Story 1)**:

- T013-T020: All tests in parallel (different test cases, same file)
- T021-T029: Implementation in sequence (same construct file)

**Phase 4 (User Story 2)**:

- T031-T039: All tests in parallel (different test cases)
- T040-T042: Environment configs in parallel (different objects)
- T043-T051: Stack implementation in sequence

**Phase 5 (User Story 3)**:

- T052-T059: All tests in parallel (different test cases)
- T060-T066: All outputs in parallel (independent `CfnOutput` calls)
- T067-T069: Documentation in sequence

**Phase 6 (Polish)**:

- T070-T072: Quality checks in parallel
- T076-T079: Integration tests in sequence (same script)
- T080-T081: Edge case tests in parallel
- T082-T085: Final cleanup in sequence

---

## Parallel Example: User Story 1 Tests

All US1 tests can be launched in parallel (different test cases in same file):

```bash
# These tasks can all run simultaneously:
T014: Write test: "creates VPC with specified CIDR block"
T015: Write test: "creates public subnets across multiple AZs"
T016: Write test: "creates private subnets across multiple AZs"
T017: Write test: "creates NAT gateways when enabled"
T018: Write test: "does not create NAT gateways when disabled"
T019: Write test: "creates internet gateway for public subnets"
T020: Write test: "subnet count matches maxAzs configuration"
```

## Parallel Example: User Story 3 Outputs

All US3 CloudFormation outputs can be created in parallel:

```bash
# These tasks can all run simultaneously:
T060: Create CfnOutput for VPC ID
T061: Create CfnOutput for public subnet IDs
T062: Create CfnOutput for private subnet IDs
T063: Create CfnOutput for availability zones
T064: Create CfnOutput for NAT gateway IPs
T065: Create CfnOutput for environment name
T066: Create CfnOutput for VPC CIDR
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

**Goal**: Deploy basic VPC infrastructure to dev environment

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T012) ← CRITICAL BLOCKER
3. Complete Phase 3: User Story 1 (T013-T030)
4. **STOP and VALIDATE**:
   - Run: `npm test -- vpc-construct.test.ts`
   - Synthesize: `npx cdk synth --context environment=dev`
   - Deploy: `npx cdk deploy --context environment=dev`
   - Verify: VPC created with subnets across 2 AZs
5. **MVP COMPLETE** ✅

**Value Delivered**: Secure network foundation ready for backend services

### Incremental Delivery

**Iteration 1 - MVP (US1)**:

- Setup + Foundational + US1 = Network infrastructure deployed
- Test independently: Deploy dev VPC, verify isolation and connectivity
- **Deployable**: Basic network ready for manual service deployment

**Iteration 2 - Multi-Environment (US2)**:

- Add US2 = Environment management
- Test independently: Deploy dev + staging with different configs
- **Deployable**: Can manage multiple environments safely

**Iteration 3 - Full Stack (US3)**:

- Add US3 = Stack exports
- Test independently: Create dependent stack that imports values
- **Deployable**: Complete foundation ready for automated service stacks

**Iteration 4 - Production Ready (Polish)**:

- Add Phase 6 = Integration tests, documentation, edge cases
- **Deployable**: Production-ready infrastructure foundation

### Parallel Team Strategy

With 2-3 developers after Foundational phase completes:

**Scenario A - Sequential (Recommended for CDK)**:

- All developers work together on US1 (VPC construct is core)
- Then together on US2 (stack integration is sequential)
- Then together on US3 (outputs build on stack)
- Infrastructure code benefits from tight coordination

**Scenario B - Parallel (If team has CDK experience)**:

- Developer A: US1 (VPC construct) ← Highest priority
- Developer B: US2 (environment configs) in parallel
- Both integrate when US1 construct is stable
- Developer C: Tests and documentation
- **Risk**: Merge conflicts in stack file

**Recommended**: Sequential approach for infrastructure to avoid conflicts

---

## Success Criteria Validation

### Per User Story

**User Story 1 (P1)** ✅:

- [ ] VPC created with configurable CIDR (FR-001)
- [ ] Subnets across ≥2 AZs (FR-002, SC-003)
- [ ] Public and private subnet types (FR-003)
- [ ] NAT gateways enable private subnet internet access (FR-004)
- [ ] Stack synthesis completes in <10 seconds
- [ ] Deployment completes in <15 minutes (SC-001)

**User Story 2 (P2)** ✅:

- [ ] Environment identifier accepted as input (FR-005)
- [ ] Environment-specific naming applied (FR-006)
- [ ] All resources tagged correctly (FR-007, SC-004)
- [ ] 3 environments can coexist in same account (SC-002)
- [ ] Multi-region deployment supported (FR-011)
- [ ] Security boundaries between environments (FR-012)

**User Story 3 (P3)** ✅:

- [ ] VPC and subnet IDs exported (FR-008)
- [ ] Environment config values exported (FR-009)
- [ ] Dependent stacks can import without manual config (SC-005)
- [ ] 80% reduction in service setup time (SC-006)
- [ ] Configuration changes don't require code modifications

### Final Validation

Run these commands to verify all success criteria:

```bash
# Unit tests >80% coverage
npm test -- --coverage

# Synthesize in <10 seconds
time npx cdk synth --context environment=dev

# Deploy in <15 minutes
time npx cdk deploy --context environment=dev

# Verify 3 environments
npx cdk deploy --context environment=staging
npx cdk deploy --context environment=prod

# Verify exports
aws cloudformation list-exports | grep -E '(dev|staging|prod)-'

# Verify tags
aws ec2 describe-vpcs --filters "Name=tag:Application,Values=Comprehend" \
  --query 'Vpcs[*].{VpcId:VpcId,Env:Tags[?Key==`Environment`].Value|[0]}'
```

---

## Notes

- **[P] tasks**: Different files or independent test cases, no dependencies
- **[Story] label**: Maps task to specific user story for traceability
- **Testing-First**: Write tests before implementation (Constitution I)
- **Type Safety**: All code uses strict TypeScript (Constitution V)
- **Modular Architecture**: VPC construct separate from stack (Constitution III)
- **No mocking needed**: CDK constructs synthesize CloudFormation, no AWS API calls during tests
- **Commit frequency**: After each task or logical group
- **Stop at checkpoints**: Validate each story independently before proceeding
- **Avoid**: Same file conflicts, tight coupling between stories

## Task Count Summary

- **Total Tasks**: 85
- **Phase 1 (Setup)**: 4 tasks
- **Phase 2 (Foundational)**: 8 tasks (BLOCKS all stories)
- **Phase 3 (US1 - Network)**: 18 tasks (8 tests + 10 implementation)
- **Phase 4 (US2 - Multi-Env)**: 21 tasks (9 tests + 12 implementation)
- **Phase 5 (US3 - Extensibility)**: 18 tasks (8 tests + 10 implementation)
- **Phase 6 (Polish)**: 16 tasks

**Parallel Opportunities**:

- 15 tasks marked [P] can run in parallel within their phase
- All test writing tasks within a story can be parallelized
- CloudFormation output creation tasks can be parallelized

**MVP Scope**: 30 tasks (Setup + Foundational + US1) delivers deployable VPC infrastructure

**Estimated Effort**:

- MVP (US1): 2-3 days for experienced CDK developer
- Full feature (US1+US2+US3): 4-5 days
- Production ready (with Polish): 5-6 days
