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
  query(sql: string, params?: any[]): Promise<MockQueryResponse> {
    // Capture the query
    this.capturedQueries.push({ sql, params });

    // If an error is configured, throw it
    if (this.mockError) {
      const error = this.mockError;
      this.mockError = undefined; // Clear error after throwing
      return Promise.reject(error);
    }

    // Find matching response
    for (const [pattern, response] of Array.from(
      this.mockResponses.entries(),
    )) {
      if (sql.includes(pattern)) {
        return Promise.resolve(response);
      }
    }

    // Return default response
    return Promise.resolve(this.defaultResponse);
  }

  /**
   * Mock implementation of Pool.end
   */
  end(): Promise<void> {
    this.endCalled = true;
    return Promise.resolve();
  }

  /**
   * Mock implementation of Pool.connect
   * Returns a mock client that uses the same query/error handling as the pool
   */
  connect(): Promise<any> {
    return Promise.resolve({
      query: (sql: string, params?: any[]): Promise<MockQueryResponse> => {
        return this.query(sql, params);
      },
      release: (): void => {
        // Mock client release - no-op
      },
    });
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
