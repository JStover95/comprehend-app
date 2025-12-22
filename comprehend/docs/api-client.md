# API Client Architecture

## Overview

This document describes the pattern for building a type-safe API client that integrates with AWS API Gateway using Bearer Token authentication. It covers request/response handling, error management, retry logic, and caching strategies.

## Table of Contents

- [Basic Structure](#basic-structure)
- [Bearer Token Authentication](#bearer-token-authentication)
- [Request/Response Types](#requestresponse-types)
- [Error Handling](#error-handling)
- [Retry Logic](#retry-logic)
- [Caching Strategies](#caching-strategies)

## Basic Structure

### Core API Client

```typescript
// utils/api/ApiClient.ts
export interface ApiConfig {
  /** API Gateway endpoint URL */
  baseUrl: string;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

/**
 * API Client for making authenticated requests to AWS API Gateway
 */
export class ApiClient {
  constructor(
    private readonly config: ApiConfig,
    private readonly getIdToken: () => Promise<string>
  ) {}

  /**
   * Make an authenticated request to the API
   */
  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      params,
    } = options;

    // Get current ID token
    const idToken = await this.getIdToken();

    // Build URL with query parameters
    const url = this.buildUrl(endpoint, params);

    // Make request with Bearer token
    const response = await fetch(`${this.config.baseUrl}${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle response
    return this.handleResponse<T>(response);
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    if (!params) return endpoint;

    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    return `${endpoint}?${queryString}`;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    let data: T;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = (await response.text()) as any;
    }

    if (!response.ok) {
      throw new ApiError(
        (data as any)?.message || `Request failed with status ${response.status}`,
        response.status,
        data
      );
    }

    return {
      data,
      status: response.status,
      headers,
    };
  }
}
```

### API Error Class

```typescript
// utils/api/ApiError.ts

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data?: any,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /**
   * Check if error is a specific HTTP status
   */
  isStatus(status: number): boolean {
    return this.status === status;
  }

  /**
   * Check if error is a 4xx client error
   */
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Check if error is a 5xx server error
   */
  isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }
}
```

## Bearer Token Authentication

This implementation uses Bearer Token authentication, where you send the Cognito ID token directly to API Gateway. This is the recommended approach for most mobile applications.

### Benefits of Bearer Token Authentication

- ✅ **Simple** - No additional AWS services required
- ✅ **Fast** - Direct token validation by API Gateway
- ✅ **Secure** - Tokens are short-lived and cryptographically signed
- ✅ **Scalable** - API Gateway handles validation automatically
- ✅ **No credentials** - No need to manage AWS credentials client-side

### Configure API Gateway

Your API Gateway must be configured with a Cognito User Pool Authorizer:

```typescript
// In CDK stack
import { CognitoUserPoolsAuthorizer, AuthorizationType } from 'aws-cdk-lib/aws-apigateway';

const authorizer = new CognitoUserPoolsAuthorizer(this, 'Authorizer', {
  cognitoUserPools: [userPool],
});

// Add to routes
api.root.addMethod('GET', lambdaIntegration, {
  authorizer,
  authorizationType: AuthorizationType.COGNITO,
});
```

### Using the API Client

```typescript
// Create API client with token injection
const client = new ApiClient(
  {
    baseUrl: process.env.EXPO_PUBLIC_API_URL!,
  },
  async () => {
    // Get current ID token from auth context/service
    const session = await getCurrentSession();
    return session.idToken;
  }
);
```

## Request/Response Types

### Defining API Types

```typescript
// types/api.ts

/**
 * Base response structure
 */
export interface ApiBaseResponse {
  success: boolean;
  message?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  nextToken?: string;
  total?: number;
}

/**
 * Data item from API
 */
export interface DataItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request to create data item
 */
export interface CreateDataRequest {
  title: string;
  description: string;
}

/**
 * Request to update data item
 */
export interface UpdateDataRequest {
  title?: string;
  description?: string;
}

/**
 * List data items request
 */
export interface ListDataRequest {
  limit?: number;
  nextToken?: string;
  filter?: string;
}
```

### Type-Safe API Methods

```typescript
// utils/api/DataApi.ts
import { ApiClient } from './ApiClient';
import { DataItem, CreateDataRequest, UpdateDataRequest, ListDataRequest, PaginatedResponse } from '@/types/api';

export class DataApi {
  constructor(private readonly client: ApiClient) {}

  /**
   * List all data items
   */
  async listItems(request: ListDataRequest = {}): Promise<PaginatedResponse<DataItem>> {
    const { data } = await this.client.get<PaginatedResponse<DataItem>>('/items', {
      limit: request.limit?.toString(),
      nextToken: request.nextToken,
      filter: request.filter,
    });
    return data;
  }

  /**
   * Get a single data item
   */
  async getItem(id: string): Promise<DataItem> {
    const { data } = await this.client.get<DataItem>(`/items/${id}`);
    return data;
  }

  /**
   * Create a new data item
   */
  async createItem(request: CreateDataRequest): Promise<DataItem> {
    const { data } = await this.client.post<DataItem>('/items', request);
    return data;
  }

  /**
   * Update an existing data item
   */
  async updateItem(id: string, request: UpdateDataRequest): Promise<DataItem> {
    const { data } = await this.client.put<DataItem>(`/items/${id}`, request);
    return data;
  }

  /**
   * Delete a data item
   */
  async deleteItem(id: string): Promise<void> {
    await this.client.delete(`/items/${id}`);
  }
}
```

## Error Handling

### Error Handling Patterns

```typescript
// utils/api/errorHandling.ts
import { ApiError } from './ApiError';

/**
 * Handle API errors with user-friendly messages
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return error.message || 'Invalid request. Please check your input.';
      case 401:
        return 'You are not authenticated. Please log in.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This resource already exists or conflicts with another.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'A server error occurred. Please try again.';
      case 503:
        return 'The service is temporarily unavailable. Please try again.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}

/**
 * Check if error should trigger logout
 */
export function shouldLogout(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

/**
 * Check if error is retryable
 */
export function isRetryable(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  
  // Retry on 5xx errors and 429 (rate limit)
  return error.isServerError() || error.status === 429;
}
```

### Error Handling in Components

```typescript
// Example component with error handling
import { getErrorMessage, shouldLogout } from '@/utils/api/errorHandling';

export function DataList() {
  const { state, actions } = useDataContext();
  const { actions: authActions } = useAuthContext();

  const handleRetry = async () => {
    try {
      await actions.fetchItems();
    } catch (error) {
      if (shouldLogout(error)) {
        await authActions.signOut();
      }
    }
  };

  if (state.error) {
    return (
      <View>
        <Text style={{ color: 'red' }}>{getErrorMessage(state.error)}</Text>
        <Button title="Retry" onPress={handleRetry} />
      </View>
    );
  }

  // ... render list
}
```

## Retry Logic

### Retry with Exponential Backoff

```typescript
// utils/api/retry.ts
import { isRetryable } from './errorHandling';

export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts?: number;
  /** Initial delay in milliseconds */
  initialDelay?: number;
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  /** Backoff multiplier */
  backoffMultiplier?: number;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
  } = options;

  let attempt = 0;
  let delay = initialDelay;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;

      // Don't retry if max attempts reached
      if (attempt >= maxAttempts) {
        throw error;
      }

      // Don't retry if error is not retryable
      if (!isRetryable(error)) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Increase delay for next attempt
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }
}
```

### API Client with Retry

```typescript
// utils/api/ApiClient.ts (extended)
import { retryWithBackoff, RetryOptions } from './retry';

export class ApiClient {
  // ... existing code

  /**
   * Make a request with automatic retry
   */
  async requestWithRetry<T>(
    endpoint: string,
    options: RequestOptions = {},
    retryOptions?: RetryOptions
  ): Promise<ApiResponse<T>> {
    return retryWithBackoff(
      () => this.request<T>(endpoint, options),
      retryOptions
    );
  }
}
```

## Caching Strategies

### Simple In-Memory Cache

```typescript
// utils/api/cache.ts

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Get cached data if still valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, ttlMs: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Clear cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear cache entries by pattern
   */
  clearPattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}
```

### API Client with Cache

```typescript
// utils/api/DataApi.ts (with caching)
import { ApiCache } from './cache';

export class DataApi {
  private cache = new ApiCache();

  constructor(private readonly client: ApiClient) {}

  async listItems(request: ListDataRequest = {}, useCache = true): Promise<PaginatedResponse<DataItem>> {
    const cacheKey = `items:${JSON.stringify(request)}`;
    
    if (useCache) {
      const cached = this.cache.get<PaginatedResponse<DataItem>>(cacheKey);
      if (cached) return cached;
    }

    const { data } = await this.client.get<PaginatedResponse<DataItem>>('/items', {
      limit: request.limit?.toString(),
      nextToken: request.nextToken,
      filter: request.filter,
    });
    
    this.cache.set(cacheKey, data, 60000); // Cache for 1 minute
    
    return data;
  }

  async createItem(request: CreateDataRequest): Promise<DataItem> {
    const { data } = await this.client.post<DataItem>('/items', request);
    
    // Invalidate list cache when creating new items
    this.cache.clearPattern(/^items:/);
    
    return data;
  }

  async updateItem(id: string, request: UpdateDataRequest): Promise<DataItem> {
    const { data } = await this.client.put<DataItem>(`/items/${id}`, request);
    
    // Invalidate related caches
    this.cache.delete(`item:${id}`);
    this.cache.clearPattern(/^items:/);
    
    return data;
  }

  async deleteItem(id: string): Promise<void> {
    await this.client.delete(`/items/${id}`);
    
    // Invalidate caches
    this.cache.delete(`item:${id}`);
    this.cache.clearPattern(/^items:/);
  }
}
```

## Best Practices

### Do's

- ✅ **Use TypeScript** for all API types
- ✅ **Implement proper error handling** with user-friendly messages
- ✅ **Use retry logic** for transient failures (5xx, 429)
- ✅ **Cache responses** when appropriate (GET requests)
- ✅ **Handle 401 errors** by signing out user
- ✅ **Create API client factories** that inject auth tokens
- ✅ **Use contexts** to share API clients across components
- ✅ **Validate responses** match expected types

### Don'ts

- ❌ **Don't hardcode API endpoints** (use environment variables)
- ❌ **Don't ignore error responses**
- ❌ **Don't retry non-retryable errors** (4xx except 429)
- ❌ **Don't cache sensitive data** indefinitely
- ❌ **Don't expose credentials** in client code
- ❌ **Don't make API calls** before user is authenticated
- ❌ **Don't forget to handle** token expiration in API calls

### Performance

**Do's:**

- ✅ **Cache API responses** with appropriate TTL
- ✅ **Debounce search/filter** requests
- ✅ **Implement pagination** for large lists
- ✅ **Use optimistic updates** for better UX
- ✅ **Prefetch data** when possible
- ✅ **Cancel pending requests** on navigation

**Don'ts:**

- ❌ **Don't make unnecessary API calls**
- ❌ **Don't fetch entire datasets** (use pagination)
- ❌ **Don't block UI** while loading
- ❌ **Don't cache forever** (set reasonable TTLs)
- ❌ **Don't retry indefinitely** (set max attempts)

## Next Steps

- Read [Authentication](./authentication.md) for Cognito authentication setup
- Read [Integration Examples](./integration-examples.md) for complete working examples
- Read [Testing Strategy](./testing/) for testing API clients
