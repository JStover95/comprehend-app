# Implementation Plan: Managed Database Infrastructure

**Branch**: `002-managed-database` | **Date**: December 23, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-managed-database/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Deploy a secure, managed Aurora PostgreSQL database with automatic schema bootstrap. The database will use Aurora Serverless V2 for cost-effective scaling, IAM authentication for services, and a CloudFormation custom resource to automatically initialize the schema, indexes, and IAM database user. Master credentials will be managed via Secrets Manager and only used when IAM authentication is not possible (e.g., during bootstrap).

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: AWS CDK v2, aws-cdk-lib (RDS, Lambda, Secrets Manager, IAM), pg (PostgreSQL client), @aws-sdk/rds-signer (IAM auth tokens)  
**Storage**: Amazon Aurora PostgreSQL 17.x (Serverless V2), Secrets Manager (master credentials)  
**Testing**: Jest, aws-cdk-lib/assertions, moto (AWS SDK mocking), MockPool factory pattern  
**Target Platform**: AWS Lambda (Node.js 20.x runtime) for bootstrap, Aurora Serverless V2 for database  
**Project Type**: Infrastructure (CDK construct + Lambda custom resource)  
**Performance Goals**: Database supports 100+ concurrent connections, Aurora Serverless V2 scales 0-2 ACUs (dev) to production capacity automatically  
**Constraints**: Database must be in private subnet, no public access, IAM authentication required for services, bootstrap must be idempotent, environment-specific scaling (dev: 0-2 ACUs, prod: multi-AZ)  
**Scale/Scope**: Single database construct, CloudFormation custom resource Lambda, schema initialization for 6 tables + indexes + constraints, IAM database user creation, pgroonga extension installation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance | Notes |
|-----------|------------|-------|
| I. Testing-First | ✅ Compliant | Unit tests with MockPool factory, moto for AWS SDK mocking, no integration tests required per plan-prompt |
| II. Accessibility-First | ✅ N/A | Infrastructure feature, no user-facing UI |
| III. Modular Architecture | ✅ Compliant | Agent pattern (Handler → Agent → Provider), separation of concerns (DbCredentialsProvider, DbConnectionProvider) |
| IV. Design Doc Adherence | ✅ Compliant | Following agent-pattern.md, types-and-configuration.md, testing patterns from cdk/docs/ |
| V. Type Safety | ✅ Compliant | Strict TypeScript enabled, explicit types for all interfaces |

**Design Docs to Review:**

- Backend (`cdk/`): 
  - `agent-pattern.md` - CloudFormation custom resource handler pattern
  - `types-and-configuration.md` - Configuration structure with clientConfig
  - `testing/` - Mocking strategies (factory pattern, moto, MockPool)
  - `design-docs.md` - Database connection pattern (DbCredentialsProvider, DbConnectionProvider)
- Frontend (`comprehend/`): N/A (infrastructure feature)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
cdk/
├── lib/
│   ├── constructs/
│   │   └── database/
│   │       └── database-construct.ts          # Aurora PostgreSQL construct
│   └── lambda/
│       └── db-bootstrap/
│           ├── handler.ts                      # CloudFormation custom resource handler
│           ├── db-bootstrap-agent.ts           # Bootstrap orchestration agent
│           ├── db-credentials-provider.ts      # IAM auth token generation
│           ├── db-connection-provider.ts         # Connection pool management
│           ├── schema-provider.ts               # Schema SQL execution
│           ├── types.ts                         # Type definitions
│           ├── config.ts                        # Configuration validation
│           ├── errors.ts                        # Custom error classes
│           └── cfn-response-handler.ts         # CloudFormation response utility
│
└── test/
    ├── unit/
    │   ├── constructs/
    │   │   └── database/
    │   │       └── database-construct.test.ts  # Construct unit tests
    │   └── lambda/
    │       └── db-bootstrap/
    │           ├── handler.test.ts             # Handler tests (spies)
    │           ├── db-bootstrap-agent.test.ts   # Agent tests
    │           ├── db-credentials-provider.test.ts
    │           ├── db-connection-provider.test.ts
    │           └── schema-provider.test.ts
    └── utils/
        ├── mock-pool.ts                         # Shared MockPool factory
        └── moto.ts                              # Moto reset utility
```

**Structure Decision**: Infrastructure feature using CDK construct pattern. Database construct in `lib/constructs/database/`, bootstrap Lambda following agent pattern in `lib/lambda/db-bootstrap/`. Unit tests in `test/unit/` mirroring source structure. Shared test utilities in `test/utils/` for MockPool and moto helpers.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
