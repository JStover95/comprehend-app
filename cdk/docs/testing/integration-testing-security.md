# Integration Testing Security Best Practices

This guide covers security best practices for integration testing with AWS resources.

## Overview

Security is critical in integration testing because:

- Tests run against real AWS resources
- Tests require AWS credentials with permissions
- Test failures can expose sensitive data
- Misconfigured tests can affect production resources

## Core Security Principles

### 1. Always Use Dedicated Test IAM Roles

**Never use production credentials, admin credentials, or personal IAM users directly.**

**Why:**

- **Blast Radius**: Limits damage if credentials are compromised
- **Auditability**: Clear CloudTrail logs showing test activity
- **Principle of Least Privilege**: Role has only permissions needed for testing
- **Isolation**: Separates test permissions from other environments
- **Revocability**: Easy to revoke/rotate test credentials without affecting production

**Implementation:**

```bash
# ✅ Correct - Use dedicated test role
export TEST_ASSUME_ROLE_ARN="arn:aws:iam::123456789012:role/integration-test-role"

# ❌ Incorrect - Using admin or production credentials directly
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
```

### 2. Use STS AssumeRole for Temporary Credentials

Always assume a role to get temporary credentials:

```typescript
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

async function getTestCredentials() {
  const stsClient = new STSClient({ region: process.env.TEST_AWS_REGION });

  const response = await stsClient.send(new AssumeRoleCommand({
    RoleArn: process.env.TEST_ASSUME_ROLE_ARN!,
    RoleSessionName: `integration-test-${Date.now()}`,
    DurationSeconds: 3600, // 1 hour
  }));

  return {
    accessKeyId: response.Credentials!.AccessKeyId!,
    secretAccessKey: response.Credentials!.SecretAccessKey!,
    sessionToken: response.Credentials!.SessionToken,
    expiration: response.Credentials!.Expiration
  };
}
```

**Benefits:**

- Credentials automatically expire (1 hour default, 12 hours max)
- Clear audit trail in CloudTrail with session name
- Can include additional conditions (MFA, source IP, etc.)
- Prevents long-lived credential exposure

### 3. Separate Test Environments from Production

**Physical Separation:**

```bash
# ✅ Correct - Dedicated test account or isolated environment
TEST_STACK_NAME="MyApp-test"
TEST_API_GATEWAY_URL="https://test-api.execute-api.us-east-1.amazonaws.com/test"

# ❌ Incorrect - Using production resources
TEST_API_GATEWAY_URL="https://prod-api.execute-api.us-east-1.amazonaws.com/prod"
```

**Account Separation (Recommended):**

- Use separate AWS accounts for test and production
- Use AWS Organizations to manage multiple accounts
- Apply SCPs (Service Control Policies) to prevent cross-account access

**Environment Tagging:**

```typescript
// Tag all test resources for visibility
{
  Environment: "test",
  Purpose: "integration-testing",
  ManagedBy: "integration-tests",
  DeleteAfter: "7-days"
}
```

## IAM Role Configuration

### Test Role Permissions

Create an IAM role with minimum required permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowApiGatewayInvoke",
      "Effect": "Allow",
      "Action": "execute-api:Invoke",
      "Resource": "arn:aws:execute-api:us-east-1:123456789012:abc123xyz/*"
    },
    {
      "Sid": "AllowLambdaInvokeForTests",
      "Effect": "Allow",
      "Action": "lambda:InvokeFunction",
      "Resource": "arn:aws:lambda:us-east-1:123456789012:function:test-*"
    },
    {
      "Sid": "AllowS3TestBucketAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::test-bucket-name",
        "arn:aws:s3:::test-bucket-name/*"
      ]
    }
  ]
}
```

**Key Points:**

- Scope permissions to specific test resources (use wildcards like `test-*` or specific ARNs)
- Only include actions actually needed by tests
- Use resource-level restrictions (not `Resource: "*"`)
- Regularly review and prune unnecessary permissions

### Trust Policy

Allow the role to be assumed by authorized principals:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:role/CI-CD-Role"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "unique-external-id-for-tests"
        }
      }
    }
  ]
}
```

**Best Practices:**

- Limit to specific CI/CD roles or developer roles
- Use `ExternalId` for additional security
- Consider time-based conditions for working hours only
- Use IP restrictions if tests run from known locations

## Credential Management

### Credential Caching

Cache temporary credentials to reduce STS API calls:

```typescript
export class CredentialManager {
  private cachedCredentials: AwsCredentialIdentity | null = null;
  private credentialsExpiration: Date | null = null;

  async getCredentials(): Promise<AwsCredentialIdentity> {
    // Check if cached credentials are still valid
    if (this.cachedCredentials && this.credentialsExpiration) {
      const now = new Date();
      // Use 5-minute buffer before expiration
      const bufferMs = 5 * 60 * 1000;
      const expirationWithBuffer = new Date(
        this.credentialsExpiration.getTime() - bufferMs
      );

      if (now < expirationWithBuffer) {
        return this.cachedCredentials;
      }
    }

    // Fetch new credentials
    const credentials = await this.assumeRole();
    this.cachedCredentials = credentials;
    this.credentialsExpiration = credentials.expiration || 
      new Date(Date.now() + 55 * 60 * 1000); // Default 55 min

    return credentials;
  }

  private async assumeRole(): Promise<AwsCredentialIdentity> {
    // Implementation from previous examples
  }
}
```

**Benefits:**

- Reduces API calls (faster tests)
- Prevents rate limiting from STS
- Maintains security with automatic refresh

**Expiration Buffer:**

- Use 5-minute buffer before actual expiration
- Prevents credentials from expiring mid-request
- Accounts for clock skew

### Credential Storage

**Never store credentials in:**

- ❌ Environment variables
- ❌ Source code
- ❌ Configuration files committed to Git
- ❌ Test fixtures or snapshots
- ❌ Log files or test output

**Store credentials in:**

- ✅ CI/CD secret managers (GitHub Secrets, GitLab Variables, etc.)
- ✅ AWS Secrets Manager (for CI/CD to retrieve)
- ✅ Temporary credential cache (in-memory only)

## Environment Variable Security

### Do Not Store Credentials in Environment Variables

Environment variables should be used for configuration (API endpoints, role ARNs, etc.) only. Credentials such as access keys, secret keys, or API keys should be strictly managed appropriately.

### Use TEST_ Prefix

Always prefix test environment variables with `TEST_`:

```bash
# ✅ Correct - Clear separation
export TEST_API_GATEWAY_URL="https://..."
export TEST_ASSUME_ROLE_ARN="arn:aws:iam::..."
export TEST_AWS_REGION="us-east-1"

# ❌ Incorrect - Could conflict with production config
export API_GATEWAY_URL="https://..."
export ASSUME_ROLE_ARN="arn:aws:iam::..."
export AWS_REGION="us-east-1"
```

**Benefits:**

- Prevents accidentally using production values
- Makes test configuration explicit
- Easier to grep/search for test configuration
- Reduces risk of credential leakage

### Validate Environment Variables

Validate all environment variables at startup:

```typescript
export function validateTestEnvironment(): void {
  const required = [
    'TEST_API_GATEWAY_URL',
    'TEST_ASSUME_ROLE_ARN',
    'TEST_AWS_REGION'
  ];

  const missing = required.filter(name => !process.env[name]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required test environment variables: ${missing.join(', ')}\n` +
      `Please set these variables before running integration tests.`
    );
  }

  // Validate format
  if (!process.env.TEST_ASSUME_ROLE_ARN?.startsWith('arn:aws:iam::')) {
    throw new Error('TEST_ASSUME_ROLE_ARN must be a valid IAM role ARN');
  }
}
```

## CI/CD Security

### GitHub Actions Example

```yaml
name: Integration Tests

on:
  push:
    branches: [main, develop]

jobs:
  integration-test:
    runs-on: ubuntu-latest
    environment: test # Use GitHub Environments for protection
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.TEST_ASSUME_ROLE_ARN }}
          aws-region: us-east-1
          role-session-name: github-actions-integration-test
      
      - name: Run integration tests
        env:
          TEST_API_GATEWAY_URL: ${{ secrets.TEST_API_GATEWAY_URL }}
          TEST_API_GATEWAY_ID: ${{ secrets.TEST_API_GATEWAY_ID }}
          TEST_AWS_REGION: us-east-1
        run: npm test -- test/integration
```

**Security Features:**

- OIDC federation (no long-lived credentials)
- Environment protection rules
- Secrets stored in GitHub Secrets
- Clear audit log

### GitLab CI Example

```yaml
integration-tests:
  stage: test
  environment:
    name: test
  id_tokens:
    AWS_ID_TOKEN:
      aud: https://gitlab.com
  before_script:
    - aws sts assume-role-with-web-identity --role-arn $TEST_ASSUME_ROLE_ARN --role-session-name gitlab-ci-integration-test --web-identity-token $AWS_ID_TOKEN
  script:
    - export TEST_API_GATEWAY_URL=$TEST_API_GATEWAY_URL
    - export TEST_AWS_REGION=us-east-1
    - npm test -- test/integration
  only:
    - main
    - develop
```

## Monitoring and Auditing

### CloudTrail Logging

Monitor integration test activity:

```bash
# Query CloudTrail for test role activity
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=Username,AttributeValue=integration-test-role \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --max-results 50
```

**What to Monitor:**

- Unusual API call patterns
- Failed authorization attempts
- API calls outside expected regions
- Access to non-test resources

### Alerting

Set up CloudWatch alarms for suspicious activity:

```typescript
// Example: Alert on test role accessing production resources
{
  "filterPattern": "{ $.userIdentity.arn = \"*integration-test-role*\" && $.resources[0].ARN = \"*production*\" }",
  "alarmName": "TestRoleProductionAccess",
  "alarmDescription": "Integration test role accessed production resources"
}
```

## Common Security Mistakes

### 1. Using Admin Credentials

❌ **Don't:**

```bash
export AWS_ACCESS_KEY_ID="AKIA...admin..."
export AWS_SECRET_ACCESS_KEY="...admin-secret..."
```

✅ **Do:**

```bash
export TEST_ASSUME_ROLE_ARN="arn:aws:iam::123456789012:role/integration-test-role"
```

### 2. Hardcoding Credentials

❌ **Don't:**

```typescript
const credentials = {
  accessKeyId: "AKIAIOSFODNN7EXAMPLE",
  secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
};
```

✅ **Do:**

```typescript
const credentials = await getTestCredentials(); // From STS AssumeRole
```

### 3. Overly Broad Permissions

❌ **Don't:**

```json
{
  "Effect": "Allow",
  "Action": "*",
  "Resource": "*"
}
```

✅ **Do:**

```json
{
  "Effect": "Allow",
  "Action": "execute-api:Invoke",
  "Resource": "arn:aws:execute-api:us-east-1:123456789012:abc123xyz/*"
}
```

### 4. No Credential Expiration

❌ **Don't:**

```typescript
// Using long-lived IAM user credentials
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
};
```

✅ **Do:**

```typescript
// Using temporary credentials from AssumeRole
const credentials = await assumeRole(); // Expires after 1 hour
```

## Related Documentation

- [API Gateway Testing](./integration-testing-api-gateway.md) - API testing with IAM authentication
- [Test Infrastructure](./integration-testing-infrastructure.md) - Test setup and configuration
- [Helper Patterns](./integration-testing-patterns.md) - Reusable test utilities
- [Overview](./integration-testing.md) - Introduction to integration testing
