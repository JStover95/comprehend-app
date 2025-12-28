# 002-managed-database Plan Prompt

Implement 0.2 Database Infrastructure from the [development plan](../../DEVELOPMENT_PLAN.md).

## Database Construct

- Should use latest available Aurora for Postgres engine (17_X)
- Should be deployed with Aurora Serverless V2
- Development environment should scale minimally (0-2 ACUs)
- The number of readers should be configured depending on the development environment (e.g., 1 reader in dev)
- Should be deployed with CDK in VPC defined in [vpc-construct](../../cdk/lib/constructs/networking/vpc-construct.ts)
- Master credentials should be managed by the cluster using `rds.Credentials.fromGeneratedSecret`

## Database Bootstrap

- Should be deployed as a CloudFormation custom resource
- Should initialize schema, IAM user, indices, and plugins (e.g., `pgroona`) on create
- Should no-op on Update and Delete
- Should test IAM connection
- Should use good separation of concerns as defined in the [CDK design docs](../../cdk/design-docs/design-docs.md)

## Testing

- Does not require integration tests
- Unit tests should be written in `cdk/test/unit`
- Unit tests should follow mocking strategies outlined in [CDK design docs](../../cdk/design-docs/design-docs.md)
  - AWS SDK clients are mocked externally with moto
    - Moto should be reset after each test
    - Client providers should use custom client config pattern for overriding client endpoints
    - Mock data should be shared between tests for consistency and returned from function calls to avoid side effects
  - Mock factories for I/O operations (e.g., connection pool)
- Mocks that can be shared with other test suites should be written in `cdk/test/utils`

## Code Examples

### Mock Pool

```ts
// mock-pool.ts
import { Pool } from "pg";

/**
 * Captured SQL query with parameters
 */
export interface CapturedQuery {
  sql: string;
  params?: any[];
}

/**
 * Mock query response structure
 */
export interface MockQueryResponse {
  rows: any[];
  rowCount?: number;
  command?: string;
}

/**
 * Mock PostgreSQL Pool for testing
 * Captures queries and allows mocking responses without a real database connection
 *
 * @example
 * ```typescript
 * const mockPool = new MockPool()
 *   .withQueryResponse("INSERT", { rows: [], rowCount: 1 })
 *   .withQueryResponse("SELECT", { rows: [{ id: 1 }], rowCount: 1 });
 *
 * // Use in tests
 * const result = await mockPool.query("SELECT * FROM table");
 * const queries = mockPool.getCapturedQueries();
 * ```
 */
export class MockPool {
  private capturedQueries: CapturedQuery[] = [];
  private mockResponses: Map<string, MockQueryResponse> = new Map();
  private defaultResponse: MockQueryResponse = { rows: [] };
  private mockError?: Error;
  private endCalled = false;

  /**
   * Sets a mock response for a specific query pattern
   * @param sqlPattern - SQL pattern to match (can be partial)
   * @param response - The response to return
   * @returns This instance for chaining
   */
  withQueryResponse(sqlPattern: string, response: MockQueryResponse): this {
    this.mockResponses.set(sqlPattern, response);
    return this;
  }

  /**
   * Sets the default response for queries that don't match any pattern
   * @param response - The default response
   * @returns This instance for chaining
   */
  withDefaultResponse(response: MockQueryResponse): this {
    this.defaultResponse = response;
    return this;
  }

  /**
   * Sets an error to throw on the next query
   * @param error - The error to throw
   * @returns This instance for chaining
   */
  withError(error: Error): this {
    this.mockError = error;
    return this;
  }

  /**
   * Gets all captured queries
   * @returns Array of captured queries
   */
  getCapturedQueries(): CapturedQuery[] {
    return this.capturedQueries;
  }

  /**
   * Gets the last captured query
   * @returns The last captured query, or undefined if no queries were captured
   */
  getLastQuery(): CapturedQuery | undefined {
    return this.capturedQueries[this.capturedQueries.length - 1];
  }

  /**
   * Clears all captured queries
   */
  clearCapturedQueries(): void {
    this.capturedQueries = [];
  }

  /**
   * Checks if end() was called
   */
  wasEndCalled(): boolean {
    return this.endCalled;
  }

  /**
   * Mock implementation of Pool.query
   */
  async query(sql: string, params?: any[]): Promise<MockQueryResponse> {
    // Capture the query
    this.capturedQueries.push({ sql, params });

    // If an error is configured, throw it
    if (this.mockError) {
      const error = this.mockError;
      this.mockError = undefined; // Clear error after throwing
      throw error;
    }

    // Find matching response
    for (const [pattern, response] of Array.from(
      this.mockResponses.entries()
    )) {
      if (sql.includes(pattern)) {
        return response;
      }
    }

    // Return default response
    return this.defaultResponse;
  }

  /**
   * Mock implementation of Pool.end
   */
  async end(): Promise<void> {
    this.endCalled = true;
  }

  /**
   * Mock implementation of Pool.connect
   * Returns a mock client that uses the same query/error handling as the pool
   */
  async connect(): Promise<any> {
    const pool = this;
    return {
      query: async (
        sql: string,
        params?: any[]
      ): Promise<MockQueryResponse> => {
        return pool.query(sql, params);
      },
      release: (): void => {
        // Mock client release - no-op
      },
    };
  }
}

/**
 * Type assertion helper to cast MockPool to Pool
 * Use this when you need to pass a MockPool where Pool is expected
 *
 * @example
 * ```typescript
 * const mockPool = new MockPool();
 * const pool: Pool = asMockPool(mockPool);
 * ```
 */
export function asMockPool(mockPool: MockPool): Pool {
  return mockPool as any as Pool;
}
```

### Moto Utils

```ts
// moto.ts
import http from "http";

export function resetMoto(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/moto-api/reset",
        method: "POST",
      },
      (res) => {
        res.on("end", () => resolve());
        res.resume();
      },
    );
    req.on("error", reject);
    req.end();
  });
}
```
