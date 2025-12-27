# Research: Managed Database Infrastructure

**Date**: December 23, 2025  
**Feature**: 002-managed-database

## Research Summary

This document consolidates technical decisions and research findings for implementing a managed Aurora PostgreSQL database with automatic schema bootstrap.

## Technology Decisions

### Database Engine: Aurora PostgreSQL 17.x

**Decision**: Use Amazon Aurora PostgreSQL with engine version 17.x (latest available)

**Rationale**:

- PostgreSQL 17.x provides latest features and performance improvements
- Aurora provides managed database service with automatic backups, patching, and high availability
- Serverless V2 enables cost-effective scaling from 0 ACUs (dev) to production capacity
- Native support for IAM database authentication

**Alternatives Considered**:

- RDS PostgreSQL: Lacks serverless scaling, requires instance sizing decisions
- Aurora MySQL: Not suitable for PostgreSQL-specific features (pgroonga extension)
- DynamoDB: NoSQL doesn't match relational schema requirements

### Deployment Model: Aurora Serverless V2

**Decision**: Deploy Aurora Serverless V2 with environment-specific ACU ranges

**Rationale**:

- Automatic scaling eliminates manual capacity planning
- Cost-effective for development (0-2 ACUs) and production (auto-scaling)
- Pay only for actual usage, not reserved capacity
- Seamless scaling without connection interruption

**Configuration**:

- Development: 0.5-2 ACUs (minimal cost)
- Production: Multi-AZ with appropriate min/max ACU ranges based on load

**Alternatives Considered**:

- Aurora Provisioned: Requires manual scaling, higher cost for variable workloads
- Aurora Serverless v1: Legacy, less flexible scaling than v2

### Authentication: IAM Database Authentication

**Decision**: Primary authentication method is IAM database authentication with temporary credentials

**Rationale**:

- Eliminates need to store long-lived passwords
- Automatic credential rotation via IAM
- Fine-grained access control through IAM policies
- Audit trail through CloudTrail
- Reduces attack surface (no password storage)

**Implementation**:

- Services use RDS Signer to generate temporary auth tokens
- Master username/password in Secrets Manager only for bootstrap fallback
- IAM database user created during bootstrap for service authentication

**Alternatives Considered**:

- Password-based authentication: Requires credential rotation, higher security risk
- Kerberos: Complex setup, not natively supported by RDS

### Bootstrap Mechanism: CloudFormation Custom Resource

**Decision**: Deploy bootstrap as CloudFormation custom resource Lambda function

**Rationale**:

- Integrates seamlessly with CDK infrastructure deployment
- Automatic execution on stack creation
- Idempotent operations (safe to re-run)
- Proper error handling and CloudFormation status reporting
- No-op on Update/Delete (schema persists)

**Implementation Pattern**:

- Lambda handler receives CloudFormation events (Create/Update/Delete)
- Agent orchestrates bootstrap operations
- Providers handle database connections and SQL execution
- Response handler sends CloudFormation success/failure

**Alternatives Considered**:

- User Data scripts: Not suitable for serverless, harder to test
- Manual SQL execution: Defeats automation goal
- Separate deployment pipeline: Adds complexity, breaks infrastructure-as-code

### Schema Management: SQL Scripts in Lambda

**Decision**: Embed schema SQL directly in Lambda function (or load from S3 if large)

**Rationale**:

- Simple deployment model (no external dependencies)
- Version controlled with infrastructure code
- Fast execution (no S3 fetch overhead for small schemas)
- Easy to test with MockPool

**Alternatives Considered**:

- Database migration tools (Flyway, Liquibase): Overkill for initial bootstrap, adds dependencies
- S3-hosted SQL: Additional dependency, requires S3 bucket setup
- Terraform/RDS provider: Not using Terraform, CDK-native approach preferred

### PostgreSQL Extensions: pgroonga

**Decision**: Install pgroonga extension during bootstrap for CJK full-text search

**Rationale**:

- Required for proper Chinese/Japanese/Korean text search (per development plan)
- Must be installed as superuser (during bootstrap with master credentials)
- One-time installation, persists across connections

**Implementation**:

- Execute `CREATE EXTENSION IF NOT EXISTS pgroonga;` during bootstrap
- Idempotent (IF NOT EXISTS prevents errors on re-run)

**Alternatives Considered**:

- pg_bigm: Alternative CJK search extension, pgroonga more feature-rich
- Native PostgreSQL full-text search: Inadequate for CJK languages

### Connection Pattern: Separation of Concerns

**Decision**: Use DbCredentialsProvider and DbConnectionProvider pattern

**Rationale**:

- Clear separation between authentication and connection management
- Testable in isolation (mock credentials, mock connections)
- Consistent pattern across all Lambda functions (per design docs)
- Better connection management with Pool instead of Client

**Implementation**:

```typescript
// Credentials provider generates IAM auth tokens
const credentialsProvider = new DbCredentialsProvider(config);
const authToken = await credentialsProvider.createIamAuthToken();

// Connection provider creates pools from config + tokens
const connectionProvider = new DbConnectionProvider(config);
const pool = connectionProvider.createIamPool(authToken);
```

**Reference**: Pattern documented in `cdk/docs/design-docs.md` and used in existing `lambda/db-bootstrap/` reference

### Testing Strategy: Unit Tests with Mocks

**Decision**: Unit tests only (no integration tests per plan-prompt), using MockPool factory and moto

**Rationale**:

- Fast feedback during development
- No dependency on deployed infrastructure
- MockPool factory pattern enables comprehensive query testing
- Moto mocks AWS SDK calls (Secrets Manager, RDS Signer)
- Follows established testing patterns from design docs

**Mock Strategy**:

- **I/O Operations**: MockPool factory for database queries
- **AWS SDK**: Moto for Secrets Manager, RDS Signer (with custom client config)
- **Handlers**: Jest spies for handler orchestration testing

**Alternatives Considered**:

- Integration tests: Not required per plan-prompt, adds deployment dependency
- LocalStack: Overkill for unit tests, moto sufficient for SDK mocking

## Architecture Patterns

### Agent Pattern Structure

Following `cdk/docs/agent-pattern.md`:

1. **Handler**: CloudFormation event entrypoint, error handling, response sending
2. **Agent**: Orchestrates bootstrap operations (handleCreate/Update/Delete)
3. **Providers**:
   - DbCredentialsProvider: IAM auth token generation
   - DbConnectionProvider: Connection pool creation
   - SchemaProvider: SQL execution for schema/bootstrap

### Configuration Pattern

Following `cdk/docs/types-and-configuration.md`:

- ServiceConfig interface with clientConfig for AWS SDK clients
- Environment validation from CloudFormation event properties
- Support for external mocking with moto via clientConfig.endpoint override

### Error Handling

- Custom error classes (BootstrapError, SchemaError, ConnectionError)
- Proper error propagation to CloudFormation response handler
- Detailed logging for debugging

## Bootstrap Operations

### Create Operation

1. Connect to database using master credentials from Secrets Manager
2. Create IAM database user (if not exists)
3. Execute schema SQL (tables, indexes, constraints)
4. Install pgroonga extension
5. Test IAM connection
6. Return success

### Update Operation

- No-op (schema changes handled separately, not via CloudFormation updates)
- Log info entry of no-op

### Delete Operation

- No-op (database deletion handled by CDK construct, not custom resource)
- Log info entry of no-op

## Security Considerations

1. **Network Isolation**: Database in private subnet, no public access
2. **Encryption**: At rest (Aurora default) and in transit (SSL required)
3. **Credentials**: Master credentials in Secrets Manager, IAM auth for services
4. **IAM Policies**: Least privilege for Lambda execution role
5. **Security Groups**: Restrict database access to VPC resources only

## Performance Considerations

1. **Connection Pooling**: Use pg Pool, not Client, for connection reuse
2. **Idempotent Operations**: All SQL uses IF NOT EXISTS to prevent errors on re-run
3. **Bootstrap Timeout**: Lambda timeout sufficient for schema creation (< 2 minutes expected)
4. **Aurora Scaling**: Serverless V2 handles capacity automatically

## Dependencies

- VPC construct from 001-base-cdk-stack (private subnets required)
- Secrets Manager (for master credentials)
- IAM (for database authentication, Lambda execution role)
- RDS Data API: Not used (direct PostgreSQL connections via pg library)

## Open Questions Resolved

1. ✅ **Engine Version**: Aurora PostgreSQL 17.x (latest)
2. ✅ **Scaling Model**: Serverless V2 with environment-specific ACU ranges
3. ✅ **Authentication**: IAM primary, master credentials fallback
4. ✅ **Bootstrap Mechanism**: CloudFormation custom resource Lambda
5. ✅ **Schema Location**: Embedded in Lambda (or S3 if schema grows large)
6. ✅ **Extension Installation**: pgroonga during bootstrap
7. ✅ **Testing Approach**: Unit tests with mocks (no integration tests)

## References

- AWS Aurora Serverless V2: <https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html>
- RDS IAM Database Authentication: <https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.html>
- CloudFormation Custom Resources: <https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-custom-resources.html>
- pgroonga Extension: <https://pgroonga.github.io/>
- CDK Design Docs: `cdk/docs/agent-pattern.md`, `cdk/docs/types-and-configuration.md`
