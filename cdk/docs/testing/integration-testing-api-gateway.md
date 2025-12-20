# API Gateway Integration Testing

This guide covers testing API Gateway endpoints with IAM authentication in integration tests.

## Overview

API Gateway integration tests verify that your deployed REST APIs work correctly with:

- IAM authentication and authorization
- Path parameters and query strings
- Request/response transformations
- Lambda integrations
- Error handling and validation

## Prerequisites

1. **Deployed API Gateway**: API must be deployed with a stage
2. **IAM Authentication**: API configured to use AWS_IAM authorization
3. **Test IAM Role**: Dedicated role with `execute-api:Invoke` permissions
4. **Environment Variables**: API endpoint URL and configuration

## Environment Variables

All integration test configuration uses `TEST_` prefixed environment variables:

```bash
# Required
export TEST_API_GATEWAY_URL="https://abc123.execute-api.us-east-1.amazonaws.com/dev"
export TEST_API_GATEWAY_ID="abc123"
export TEST_ASSUME_ROLE_ARN="arn:aws:iam::123456789012:role/integration-test-role"
export TEST_AWS_REGION="us-east-1"

# Optional
export TEST_STACK_NAME="ApiStack-dev"
```

**Important**: Always use the `TEST_` prefix for integration test environment variables to:

- Clearly separate test configuration from application configuration
- Prevent accidentally using production credentials
- Make test setup explicit and discoverable

## IAM Authentication Strategy

### Why Use a Dedicated Test Role?

Integration tests should **always** use a dedicated IAM role via STS AssumeRole:

- **Security**: Prevents using overly permissioned credentials directly
- **Isolation**: Separates test permissions from other environments
- **Auditability**: Clear CloudTrail logs showing test activity
- **Principle of Least Privilege**: Role has only permissions needed for testing

### Role Assumption Flow

```typescript
// 1. Start with base credentials (from environment, IAM role, etc.)
const stsClient = new STSClient({ region });

// 2. Assume dedicated test role
const assumeRoleResponse = await stsClient.send(new AssumeRoleCommand({
  RoleArn: process.env.TEST_ASSUME_ROLE_ARN,
  RoleSessionName: `integration-test-${Date.now()}`,
  DurationSeconds: 3600
}));

// 3. Use temporary credentials for API requests
const credentials = {
  accessKeyId: assumeRoleResponse.Credentials.AccessKeyId,
  secretAccessKey: assumeRoleResponse.Credentials.SecretAccessKey,
  sessionToken: assumeRoleResponse.Credentials.SessionToken,
  expiration: assumeRoleResponse.Credentials.Expiration
};
```

## Request Signing Pattern

API Gateway with IAM authentication requires AWS Signature Version 4 signing.

### API Gateway Signer Provider

Create a reusable provider for signing requests:

```typescript
import { SignatureV4 } from "@smithy/signature-v4";
import { HttpRequest } from "@smithy/protocol-http";
import { Sha256 } from "@aws-crypto/sha256-js";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

export class ApiGatewaySignerProvider {
  private cachedCredentials: AwsCredentialIdentity | null = null;
  private credentialsExpiration: Date | null = null;

  async signRequest(
    url: URL,
    method: string,
    body?: any
  ): Promise<{ headers: Record<string, string>; body?: string }> {
    // Get credentials (cached or fetch new)
    const credentials = await this.getCredentials();
    
    // Prepare request
    const requestBody = body ? JSON.stringify(body) : "";
    const headers: Record<string, string> = {
      host: url.hostname,
      ...(body ? { "Content-Type": "application/json" } : {})
    };

    // Create HTTP request object
    const httpRequest = new HttpRequest({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port ? parseInt(url.port) : 443,
      path: url.pathname,
      query: this.parseQueryString(url.search),
      method: method,
      headers: headers,
      body: requestBody
    });

    // Sign with AWS Signature V4
    const signer = new SignatureV4({
      credentials,
      region: this.region,
      service: "execute-api",
      sha256: Sha256
    });

    const signedRequest = await signer.sign(httpRequest);
    
    return {
      headers: signedRequest.headers as Record<string, string>,
      body: requestBody || undefined
    };
  }

  private async getCredentials(): Promise<AwsCredentialIdentity> {
    // Check cache
    if (this.cachedCredentials && this.credentialsExpiration) {
      const now = new Date();
      if (now < this.credentialsExpiration) {
        return this.cachedCredentials;
      }
    }

    // Assume role and cache credentials
    const credentials = await this.assumeRole();
    this.cachedCredentials = credentials;
    
    // Set expiration with 5-minute buffer
    const bufferMs = 5 * 60 * 1000;
    this.credentialsExpiration = new Date(
      credentials.expiration!.getTime() - bufferMs
    );

    return credentials;
  }

  private async assumeRole(): Promise<AwsCredentialIdentity> {
    const command = new AssumeRoleCommand({
      RoleArn: process.env.TEST_ASSUME_ROLE_ARN!,
      RoleSessionName: `api-gateway-signer-${Date.now()}`,
      DurationSeconds: 3600
    });

    const response = await this.stsClient.send(command);
    return {
      accessKeyId: response.Credentials!.AccessKeyId!,
      secretAccessKey: response.Credentials!.SecretAccessKey!,
      sessionToken: response.Credentials!.SessionToken,
      expiration: response.Credentials!.Expiration
    };
  }
}
```

### Key Implementation Details

**Credential Caching**: Cache temporary credentials until they expire (with a 5-minute buffer) to avoid unnecessary STS calls.

**Content-Type Handling**: Only include `Content-Type: application/json` header when there's an actual request body. GET requests should not include this header.

**Region Extraction**: Extract region from API Gateway URL (`https://{api-id}.execute-api.{region}.amazonaws.com/...`) or use environment variable.

**Query String Parsing**: Parse query parameters into an object for proper signature calculation.

## Making API Requests

### Generic Request Helper

Create a reusable helper for making authenticated API requests:

```typescript
export async function makeApiRequest(
  apiGatewayUrl: string,
  method: string,
  path: string,
  body?: any,
  pathParameters?: Record<string, string>,
  queryParameters?: Record<string, string>
): Promise<{ statusCode: number; body: any; headers?: Record<string, string> }> {
  // Replace path parameters
  let finalPath = path;
  if (pathParameters) {
    for (const [key, value] of Object.entries(pathParameters)) {
      finalPath = finalPath.replace(`{${key}}`, encodeURIComponent(value));
    }
  }

  // Ensure path starts with /
  if (!finalPath.startsWith("/")) {
    finalPath = "/" + finalPath;
  }

  // Add query parameters
  if (queryParameters && Object.keys(queryParameters).length > 0) {
    const queryString = new URLSearchParams(queryParameters).toString();
    finalPath += `?${queryString}`;
  }

  // Construct URL
  const baseUrl = apiGatewayUrl.endsWith("/") 
    ? apiGatewayUrl.slice(0, -1) 
    : apiGatewayUrl;
  const url = new URL(baseUrl + finalPath);

  // Sign request
  const signerProvider = new ApiGatewaySignerProvider();
  const signedRequest = await signerProvider.signRequest(url, method, body);

  // Execute HTTPS request
  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: signedRequest.headers
    };

    const req = https.request(options, (res) => {
      let responseBody = "";

      res.on("data", (chunk) => {
        responseBody += chunk;
      });

      res.on("end", () => {
        try {
          const parsedBody = responseBody ? JSON.parse(responseBody) : {};
          resolve({
            statusCode: res.statusCode || 500,
            body: parsedBody,
            headers: res.headers as Record<string, string>
          });
        } catch (error) {
          // Non-JSON response
          resolve({
            statusCode: res.statusCode || 500,
            body: responseBody,
            headers: res.headers as Record<string, string>
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (signedRequest.body) {
      req.write(signedRequest.body);
    }

    req.end();
  });
}
```

## Test Examples

### Basic API Test

```typescript
describe("API Integration Tests", () => {
  it("should create a resource via POST", async () => {
    const response = await makeApiRequest(
      process.env.TEST_API_GATEWAY_URL!,
      "POST",
      "/resources",
      { name: "Test Resource", description: "Test" }
    );

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("Test Resource");
  });
});
```

### Testing with Path Parameters

```typescript
it("should get a resource by ID", async () => {
  const response = await makeApiRequest(
    process.env.TEST_API_GATEWAY_URL!,
    "GET",
    "/resources/{id}",
    undefined, // no body
    { id: "test-resource-123" } // path parameters
  );

  expect(response.statusCode).toBe(200);
  expect(response.body.id).toBe("test-resource-123");
});
```

### Testing with Query Parameters

```typescript
it("should list resources with filters", async () => {
  const response = await makeApiRequest(
    process.env.TEST_API_GATEWAY_URL!,
    "GET",
    "/resources",
    undefined, // no body
    undefined, // no path parameters
    { status: "active", limit: "10" } // query parameters
  );

  expect(response.statusCode).toBe(200);
  expect(Array.isArray(response.body.items)).toBe(true);
});
```

### Testing Error Responses

```typescript
it("should return 400 for invalid input", async () => {
  const response = await makeApiRequest(
    process.env.TEST_API_GATEWAY_URL!,
    "POST",
    "/resources",
    { name: 123 } // invalid type
  );

  expect(response.statusCode).toBe(400);
  expect(response.body).toHaveProperty("error");
  expect(response.body.message).toContain("name");
});
```

### Testing Different HTTP Methods

```typescript
describe("Resource CRUD Operations", () => {
  let resourceId: string;

  it("should CREATE (POST)", async () => {
    const response = await makeApiRequest(
      process.env.TEST_API_GATEWAY_URL!,
      "POST",
      "/resources",
      { name: "Test" }
    );
    
    expect(response.statusCode).toBe(201);
    resourceId = response.body.id;
  });

  it("should READ (GET)", async () => {
    const response = await makeApiRequest(
      process.env.TEST_API_GATEWAY_URL!,
      "GET",
      "/resources/{id}",
      undefined,
      { id: resourceId }
    );
    
    expect(response.statusCode).toBe(200);
  });

  it("should UPDATE (PUT)", async () => {
    const response = await makeApiRequest(
      process.env.TEST_API_GATEWAY_URL!,
      "PUT",
      "/resources/{id}",
      { name: "Updated" },
      { id: resourceId }
    );
    
    expect(response.statusCode).toBe(200);
  });

  it("should DELETE", async () => {
    const response = await makeApiRequest(
      process.env.TEST_API_GATEWAY_URL!,
      "DELETE",
      "/resources/{id}",
      undefined,
      { id: resourceId }
    );
    
    expect(response.statusCode).toBe(200);
  });
});
```

## Troubleshooting

### 403 Forbidden Errors

```plaintext
Error: 403 Forbidden
```

**Common causes:**

- Test IAM role lacks `execute-api:Invoke` permission
- API Gateway resource policy denies access
- Request signature is incorrect
- Role assumption failed

**Solutions:**

- Verify role has permission: `execute-api:Invoke` on `arn:aws:execute-api:{region}:{account}:{api-id}/*`
- Check role trust policy allows your base credentials to assume it
- Verify `TEST_ASSUME_ROLE_ARN` is correct
- Check CloudTrail logs for denial reasons

### Invalid Signature Errors

```plaintext
Error: The request signature we calculated does not match the signature you provided
```

**Common causes:**

- Content-Type header included on GET requests
- Query parameters not properly encoded
- Request body doesn't match Content-Type
- Clock skew between client and AWS

**Solutions:**

- Don't include Content-Type on requests without body
- Use `encodeURIComponent` for path parameters
- Ensure request body is valid JSON
- Sync system clock with NTP

### Expired Credentials

```plaintext
Error: The security token included in the request is expired
```

**Solutions:**

- Credential caching should handle this automatically
- Verify expiration buffer is set (5 minutes recommended)
- Check for long-running tests that exceed credential lifetime

## Best Practices

1. **Always Use Dedicated Test Role**: Never use production or admin credentials
2. **Cache Credentials**: Avoid unnecessary STS calls with proper caching
3. **Handle Timeouts**: Set appropriate timeouts for API requests (30s recommended)
4. **Validate Responses**: Always check both status codes and response structure
5. **Clean Up Resources**: Track and delete test data after tests complete
6. **Use Descriptive Test Names**: Clearly indicate what API operation is being tested
7. **Test Error Cases**: Verify validation, not found, and authorization errors
8. **Avoid Hardcoded URLs**: Always use environment variables for endpoints

## Related Documentation

- [Test Infrastructure](./integration-testing-infrastructure.md) - Test setup and resource management
- [Security Best Practices](./integration-testing-security.md) - IAM roles and credentials
- [Helper Patterns](./integration-testing-patterns.md) - Reusable test utilities
- [Overview](./integration-testing.md) - Introduction to integration testing
