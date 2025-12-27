# Implementation Tasks: Managed Database Infrastructure

**Feature Branch**: `002-managed-database`  
**Generated**: December 23, 2025  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Overview

This document contains actionable, dependency-ordered tasks for implementing the managed database infrastructure feature. Tasks are organized by user story priority to enable independent implementation and testing.

## Task Summary

- **Total Tasks**: 55
- **User Story 1 (P1)**: 12 tasks
- **User Story 2 (P2)**: 12 tasks
- **User Story 3 (P2)**: 9 tasks
- **User Story 4 (P3)**: 6 tasks
- **Setup & Foundational**: 14 tasks
- **Polish**: 6 tasks

## Dependencies

```plaintext
Setup (Phase 1)
  └──> Foundational (Phase 2)
        └──> User Story 1 (Phase 3) - Deploy Secure Database Instance
              └──> User Story 2 (Phase 4) - Bootstrap Database Schema
                    └──> User Story 3 (Phase 5) - IAM Authentication
                          └──> User Story 4 (Phase 6) - Multi-Environment
                                └──> Polish (Phase 7)
```

**Note**: User Story 2 and User Story 3 can be partially parallelized after User Story 1 is complete, but User Story 2 must complete before User Story 3 can fully test IAM authentication.

## Implementation Strategy

### MVP Scope

**Minimum Viable Product**: User Story 1 only

- Deploys secure database instance
- Enables basic database functionality
- Can be tested independently
- Blocks all other user stories

### Incremental Delivery

1. **Phase 1-2**: Setup and foundational components
2. **Phase 3**: MVP - Deploy database instance (User Story 1)
3. **Phase 4**: Add schema bootstrap (User Story 2)
4. **Phase 5**: Add IAM authentication (User Story 3)
5. **Phase 6**: Add multi-environment support (User Story 4)
6. **Phase 7**: Polish and cross-cutting concerns

## Parallel Execution Examples

### After Phase 2 (Foundational)

- T007 [P] and T008 [P] can run in parallel (different files, no dependencies)

### After Phase 3 (User Story 1)

- T033 [P] [US2] and T034 [P] [US2] can run in parallel (provider implementations)

### After Phase 4 (User Story 2)

- T042 [P] [US3] and T043 [P] [US3] can run in parallel (IAM provider and connection provider)

## Phase 1: Setup

**Goal**: Initialize project structure and dependencies for database infrastructure

### Phase 1 Tasks

**Mocks:**

N/A

**Tests:**

N/A

**Implementation:**

- [X] T001 Create directory structure for database construct in `cdk/lib/constructs/database/`
- [X] T002 Create directory structure for bootstrap Lambda in `cdk/lib/lambda/db-bootstrap/`
- [X] T003 Create directory structure for unit tests in `cdk/test/unit/constructs/database/` and `cdk/test/unit/lambda/db-bootstrap/`
- [X] T004 Create directory structure for shared test utilities in `cdk/test/utils/`
- [X] T005 Install required npm dependencies: `@aws-sdk/client-rds`, `@aws-sdk/client-secrets-manager`, `@aws-sdk/rds-signer`, `pg`, `@types/pg` in `cdk/package.json`
- [X] T006 Create schema SQL directory structure in `cdk/lib/lambda/db-bootstrap/schema/` for schema.sql file

## Phase 2: Foundational

**Goal**: Create shared types, utilities, and test infrastructure that all user stories depend on

**Independent Test**: Can verify types compile, utilities can be imported, and test mocks work correctly

### Phase 2 Tasks

**Mocks:**

- [X] T007 [P] Create shared MockPool factory class in `cdk/test/utils/mock-pool.ts` following plan-prompt.md pattern
- [X] T008 [P] Create moto reset utility function in `cdk/test/utils/moto.ts` for AWS SDK mocking

**Tests:**

- [X] T009 Write unit tests for configuration validation function in `cdk/test/unit/lambda/db-bootstrap/config.test.ts` verifying CloudFormation event parsing and validation
- [X] T010 Write unit tests for CloudFormation response handler utility in `cdk/test/unit/lambda/db-bootstrap/cfn-response-handler.test.ts` verifying CFN response sending

**Implementation:**

- [X] T011 Create base type definitions in `cdk/lib/lambda/db-bootstrap/types.ts` with ServiceConfig, ClientConfig, and database connection interfaces
- [X] T012 Create configuration validation function in `cdk/lib/lambda/db-bootstrap/config.ts` to parse CloudFormation event properties
- [X] T013 Create custom error classes in `cdk/lib/lambda/db-bootstrap/errors.ts` (BootstrapError, SchemaError, ConnectionError)
- [X] T014 Create CloudFormation response handler utility in `cdk/lib/lambda/db-bootstrap/cfn-response-handler.ts` for sending CFN responses

## Phase 3: User Story 1 - Deploy Secure Database Instance (P1)

**Goal**: Provision a secure, managed database instance with proper network isolation, encryption, and access controls

**Independent Test**: Deploy stack and verify Aurora PostgreSQL cluster is created in private subnet with encryption enabled, security groups configured, and Secrets Manager secret created

**Acceptance Criteria**:

- Database instance created in private subnet with no public access
- Encryption at rest and in transit enabled
- Security groups restrict access to VPC only
- IAM authentication enabled on cluster
- Master credentials stored in Secrets Manager

### Phase 3 Tasks

**Mocks:**

N/A

**Tests:**

- [X] T015 [US1] Write unit tests for DatabaseConstruct in `cdk/test/unit/constructs/database/database-construct.test.ts` verifying cluster configuration, encryption, and security groups

**Implementation:**

- [X] T016 [US1] Create DatabaseConstruct class in `cdk/lib/constructs/database/database-construct.ts` with constructor accepting VPC and environment config
- [X] T017 [US1] Implement Aurora PostgreSQL Serverless V2 cluster creation in `cdk/lib/constructs/database/database-construct.ts` with engine version 17.x
- [X] T018 [US1] Configure cluster to use private subnets only (no public access) in `cdk/lib/constructs/database/database-construct.ts`
- [X] T019 [US1] Enable encryption at rest and in transit for Aurora cluster in `cdk/lib/constructs/database/database-construct.ts`
- [X] T020 [US1] Enable IAM database authentication on Aurora cluster in `cdk/lib/constructs/database/database-construct.ts`
- [X] T021 [US1] Create Secrets Manager secret for master credentials using `rds.Credentials.fromGeneratedSecret` in `cdk/lib/constructs/database/database-construct.ts`
- [X] T022 [US1] Configure security groups to allow database access only from within VPC in `cdk/lib/constructs/database/database-construct.ts`
- [X] T023 [US1] Export stack outputs (endpoint, port, secret ARN, IAM user) from DatabaseConstruct in `cdk/lib/constructs/database/database-construct.ts`
- [X] T024 [US1] Add environment-specific ACU scaling configuration (dev: 0-2 ACUs, staging: 0-2 ACUs) in `cdk/lib/constructs/database/database-construct.ts`
- [X] T025 [US1] Apply environment tags to all database resources in `cdk/lib/constructs/database/database-construct.ts`
- [X] T026 [US1] Integrate DatabaseConstruct into ComprehendStack in `cdk/lib/stacks/comprehend-stack.ts` referencing VpcConstruct

## Phase 4: User Story 2 - Bootstrap Database Schema Automatically (P2)

**Goal**: Automatically create database schema (tables, indexes, constraints) when database is first deployed

**Independent Test**: Deploy database and verify all tables, indexes, and constraints are created correctly by querying the database schema

**Acceptance Criteria**:

- All 6 tables created (user, exercise, token, vocab, join_vocab_token, chat_message)
- All indexes created
- All foreign key constraints created
- pgroonga extension installed
- Bootstrap process is idempotent

### Phase 4 Tasks

**Mocks:**

N/A

**Tests:**

- [X] T027 [US2] Write unit tests for SchemaProvider in `cdk/test/unit/lambda/db-bootstrap/schema-provider.test.ts` using MockPool
- [X] T028 [US2] Write unit tests for DbBootstrapAgent in `cdk/test/unit/lambda/db-bootstrap/db-bootstrap-agent.test.ts` with mocked providers
- [X] T029 [US2] Write unit tests for handler in `cdk/test/unit/lambda/db-bootstrap/handler.test.ts` using Jest spies
- [X] T030 [US2] Write unit tests for DbConnectionProvider master credentials connection in `cdk/test/unit/lambda/db-bootstrap/db-connection-provider.test.ts` using MockPool

**Implementation:**

- [X] T031 [US2] Create single schema SQL file in `cdk/lib/lambda/db-bootstrap/schema/schema.sql` containing all table definitions, indexes, constraints, and pgroonga extension
- [X] T032 [US2] Configure Lambda bundling to copy schema.sql file using afterBundling hook in `cdk/lib/constructs/database/database-construct.ts`
- [X] T033 [US2] Create DbConnectionProvider class in `cdk/lib/lambda/db-bootstrap/db-connection-provider.ts` for connection pool management with master credentials
- [X] T034 [US2] Create SchemaProvider class in `cdk/lib/lambda/db-bootstrap/schema-provider.ts` to execute schema.sql file from bundled schema directory
- [X] T035 [US2] Implement idempotent schema execution in `cdk/lib/lambda/db-bootstrap/schema-provider.ts` using IF NOT EXISTS patterns
- [X] T036 [US2] Create DbBootstrapAgent class in `cdk/lib/lambda/db-bootstrap/db-bootstrap-agent.ts` orchestrating schema bootstrap operations
- [X] T037 [US2] Create CloudFormation custom resource handler in `cdk/lib/lambda/db-bootstrap/handler.ts` with Create/Update/Delete operations
- [X] T038 [US2] Create Lambda function for bootstrap custom resource in `cdk/lib/constructs/database/database-construct.ts` with Node.js 22.x runtime and VPC configuration

## Phase 5: User Story 3 - Authenticate to Database Using IAM (P2)

**Goal**: Enable IAM database authentication for services using temporary credentials

**Independent Test**: Verify services can connect using IAM auth tokens, master credentials only used during bootstrap, and IAM policies restrict access

**Acceptance Criteria**:

- IAM database user created during bootstrap
- Services can generate temporary IAM auth tokens
- Master credentials only used when IAM not possible
- IAM policies restrict database access

### Phase 5 Tasks

**Mocks:**

N/A

**Tests:**

- [ ] T039 [US3] Write unit tests for DbCredentialsProvider in `cdk/test/unit/lambda/db-bootstrap/db-credentials-provider.test.ts` with mocked RDS Signer
- [ ] T040 [US3] Write unit tests for DbConnectionProvider IAM pool creation in `cdk/test/unit/lambda/db-bootstrap/db-connection-provider.test.ts`
- [ ] T041 [US3] Write additional unit tests for DbBootstrapAgent IAM user creation and connection test in `cdk/test/unit/lambda/db-bootstrap/db-bootstrap-agent.test.ts` covering IAM authentication flow

**Implementation:**

- [ ] T042 [US3] Create DbCredentialsProvider class in `cdk/lib/lambda/db-bootstrap/db-credentials-provider.ts` for IAM auth token generation using RDS Signer
- [ ] T043 [US3] Update DbConnectionProvider to support IAM pool creation in `cdk/lib/lambda/db-bootstrap/db-connection-provider.ts` accepting auth tokens
- [ ] T044 [US3] Add IAM database user creation to bootstrap process in `cdk/lib/lambda/db-bootstrap/db-bootstrap-agent.ts` (CREATE USER IF NOT EXISTS)
- [ ] T045 [US3] Add IAM connection test to bootstrap process in `cdk/lib/lambda/db-bootstrap/db-bootstrap-agent.ts` after schema creation
- [ ] T046 [US3] Update bootstrap Lambda execution role with IAM database authentication permissions in `cdk/lib/constructs/database/database-construct.ts`
- [ ] T047 [US3] Update DatabaseConstruct to export IAM user name in stack outputs in `cdk/lib/constructs/database/database-construct.ts`

## Phase 6: User Story 4 - Deploy Database Across Multiple Environments (P3)

**Goal**: Support environment-specific database configurations (sizing, multi-AZ, backup retention)

**Independent Test**: Deploy database to dev and prod environments and verify different configurations (ACU ranges, multi-AZ, backup retention)

**Acceptance Criteria**:

- Development uses 0-2 ACUs, single-AZ
- Staging uses 0-2 ACUs, single-AZ (same as dev for cost efficiency)
- Production uses appropriate ACU range, multi-AZ
- Backup retention varies by environment
- All resources tagged with environment identifier

### Phase 6 Tasks

**Mocks:**

N/A

**Tests:**

- [ ] T048 [US4] Update unit tests to verify environment-specific configurations in `cdk/test/unit/constructs/database/database-construct.test.ts` including dev, staging, and prod configurations

**Implementation:**

- [ ] T049 [US4] Add environment-specific ACU configuration logic in `cdk/lib/constructs/database/database-construct.ts` (dev: 0-2, staging: 0-2, prod: configurable)
- [ ] T050 [US4] Add multi-AZ configuration based on environment in `cdk/lib/constructs/database/database-construct.ts` (dev: single-AZ, staging: single-AZ, prod: multi-AZ)
- [ ] T051 [US4] Add environment-specific backup retention configuration in `cdk/lib/constructs/database/database-construct.ts` (dev: 1 day, staging: 1 day, prod: 7 days minimum)
- [ ] T052 [US4] Add environment-specific maintenance window configuration in `cdk/lib/constructs/database/database-construct.ts`
- [ ] T053 [US4] Update quickstart.md with environment-specific configuration examples in `specs/002-managed-database/quickstart.md` including dev, staging, and prod

## Phase 7: Polish & Cross-Cutting Concerns

**Goal**: Finalize implementation, documentation, and cross-cutting concerns

### Phase 7 Tasks

**Mocks:**

N/A

**Tests:**

- [ ] T054 Run full test suite and verify >80% code coverage for new code

**Implementation:**

- [ ] T055 Verify all stack outputs are properly exported and documented in `cdk/lib/constructs/database/database-construct.ts`
- [ ] T056 Update README.md in `cdk/README.md` with database infrastructure documentation
- [ ] T057 Verify all error handling provides clear messages in bootstrap Lambda functions
- [ ] T058 Ensure all resources have proper CloudFormation tags for cost tracking
- [ ] T059 Update contracts/stack-outputs.schema.json if any outputs changed during implementation

## Task Validation

✅ All tasks follow checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`  
✅ All user story tasks have [US1], [US2], [US3], or [US4] labels  
✅ All parallelizable tasks marked with [P]  
✅ All tasks include specific file paths  
✅ Tasks organized by user story priority  
✅ Dependencies clearly documented  
✅ Independent test criteria defined for each user story
