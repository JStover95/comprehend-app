# API Integration

## Overview

This document describes the pattern for integrating with the AWS backend API, including request signing, error handling, retry logic, and integration with contexts.

## Table of Contents

- [API Client Architecture](#api-client-architecture)
- [AWS IAM Signing](#aws-iam-signing)
- [Request/Response Types](#requestresponse-types)
- [Error Handling](#error-handling)
- [Retry Logic](#retry-logic)
- [Caching Strategies](#caching-strategies)
- [Integration with Contexts](#integration-with-contexts)
- [Testing API Clients](#testing-api-clients)
- [Complete Examples](#complete-examples)

## API Client Architecture

### Basic Structure

```typescript
// utils/api/ApiClient.ts
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { Sha256 } from '@aws-crypto/sha256-js';
import { HttpRequest } from '@aws-sdk/protocol-http';

export interface ApiConfig {
  /** API Gateway endpoint URL */
  baseUrl: string;
  /** AWS region */
  region: string;
  /** AWS credentials */
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
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
  private readonly config: ApiConfig;
  private readonly signer: SignatureV4;

  constructor(config: ApiConfig) {
    this.config = config;
    this.signer = new SignatureV4({
      service: 'execute-api',
      region: config.region,
      credentials: config.credentials,
      sha256: Sha256,
    });
  }

  /**
   * Make a signed request to the API
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

    // Build URL with query parameters
    const url = this.buildUrl(endpoint, params);

    // Create HTTP request
    const request = new HttpRequest({
      method,
      protocol: 'https:',
      hostname: new URL(this.config.baseUrl).hostname,
      path: url,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    // Sign the request
    const signedRequest = await this.signer.sign(request);

    // Make the request
    const response = await fetch(`${this.config.baseUrl}${url}`, {
      method: signedRequest.method,
      headers: signedRequest.headers as Record<string, string>,
      body: signedRequest.body as string | undefined,
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

## AWS IAM Signing

@@ Revise for raw sdk flow

### Getting Credentials

```typescript
// utils/auth/credentials.ts
import { CognitoIdentityClient, GetIdCommand, GetCredentialsForIdentityCommand } from '@aws-sdk/client-cognito-identity';

export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
}

/**
 * Get temporary AWS credentials from Cognito Identity Pool
 */
export async function getAwsCredentials(
  identityPoolId: string,
  region: string,
  idToken: string
): Promise<AwsCredentials> {
  const client = new CognitoIdentityClient({ region });

  // Get identity ID
  const getIdResponse = await client.send(
    new GetIdCommand({
      IdentityPoolId: identityPoolId,
      Logins: {
        [`cognito-idp.${region}.amazonaws.com/${userPoolId}`]: idToken,
      },
    })
  );

  if (!getIdResponse.IdentityId) {
    throw new Error('Failed to get identity ID');
  }

  // Get credentials
  const getCredsResponse = await client.send(
    new GetCredentialsForIdentityCommand({
      IdentityId: getIdResponse.IdentityId,
      Logins: {
        [`cognito-idp.${region}.amazonaws.com/${userPoolId}`]: idToken,
      },
    })
  );

  const creds = getCredsResponse.Credentials;
  if (!creds?.AccessKeyId || !creds?.SecretKey || !creds?.SessionToken) {
    throw new Error('Failed to get credentials');
  }

  return {
    accessKeyId: creds.AccessKeyId,
    secretAccessKey: creds.SecretKey,
    sessionToken: creds.SessionToken,
    expiration: creds.Expiration || new Date(Date.now() + 3600000),
  };
}
```

### Credential Management

```typescript
// utils/auth/CredentialManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const CREDENTIALS_KEY = '@aws_credentials';

export class CredentialManager {
  private credentials: AwsCredentials | null = null;

  /**
   * Get current credentials, refreshing if expired
   */
  async getCredentials(idToken: string): Promise<AwsCredentials> {
    if (this.credentials && !this.isExpired(this.credentials)) {
      return this.credentials;
    }

    // Get new credentials
    this.credentials = await getAwsCredentials(
      process.env.EXPO_PUBLIC_IDENTITY_POOL_ID!,
      process.env.EXPO_PUBLIC_AWS_REGION!,
      idToken
    );

    // Cache credentials
    await this.cacheCredentials(this.credentials);

    return this.credentials;
  }

  /**
   * Clear cached credentials
   */
  async clearCredentials(): Promise<void> {
    this.credentials = null;
    await AsyncStorage.removeItem(CREDENTIALS_KEY);
  }

  /**
   * Check if credentials are expired
   */
  private isExpired(credentials: AwsCredentials): boolean {
    // Refresh 5 minutes before expiration
    return credentials.expiration.getTime() - Date.now() < 5 * 60 * 1000;
  }

  /**
   * Cache credentials in storage
   */
  private async cacheCredentials(credentials: AwsCredentials): Promise<void> {
    await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
  }
}
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
// components/DataList.tsx
import { getErrorMessage, shouldLogout } from '@/utils/api/errorHandling';

export function DataList() {
  const { state, actions } = useDataContext();
  const { actions: authActions } = useAuthContext();

  const handleRetry = async () => {
    try {
      await actions.fetchItems();
    } catch (error) {
      if (shouldLogout(error)) {
        await authActions.logout();
      }
    }
  };

  if (state.error) {
    return (
      <ErrorMessage
        message={getErrorMessage(state.error)}
        onRetry={handleRetry}
      />
    );
  }

  // ... render list
}
```

## Retry Logic

### Retry with Exponential Backoff

```typescript
// utils/api/retry.ts

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
}
```

### API Client with Cache

```typescript
export class DataApi {
  private cache = new ApiCache();

  constructor(private readonly client: ApiClient) {}

  async listItems(request: ListDataRequest = {}, useCache = true): Promise<PaginatedResponse<DataItem>> {
    const cacheKey = `items:${JSON.stringify(request)}`;
    
    if (useCache) {
      const cached = this.cache.get<PaginatedResponse<DataItem>>(cacheKey);
      if (cached) return cached;
    }

    const { data } = await this.client.get<PaginatedResponse<DataItem>>('/items', request);
    
    this.cache.set(cacheKey, data, 60000); // Cache for 1 minute
    
    return data;
  }

  async createItem(request: CreateDataRequest): Promise<DataItem> {
    const { data } = await this.client.post<DataItem>('/items', request);
    
    // Invalidate list cache
    this.cache.clear();
    
    return data;
  }
}
```

## Integration with Contexts

### Data Context with API

```typescript
// contexts/DataContext/Provider.tsx
import { DataApi } from '@/utils/api/DataApi';
import { ApiClient } from '@/utils/api/ApiClient';

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { state: authState } = useAuthContext();
  const [state, setState] = useState<DataState>({
    loading: false,
    items: [],
    error: null,
  });

  // Create API client with credentials
  const api = useMemo(() => {
    if (!authState.credentials) return null;

    const client = new ApiClient({
      baseUrl: process.env.EXPO_PUBLIC_API_URL!,
      region: process.env.EXPO_PUBLIC_AWS_REGION!,
      credentials: authState.credentials,
    });

    return new DataApi(client);
  }, [authState.credentials]);

  const fetchItems = useCallback(async () => {
    if (!api) {
      setState(prev => ({ ...prev, error: 'Not authenticated' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await api.listItems();
      setState({
        loading: false,
        items: response.items,
        error: null,
      });
    } catch (error) {
      setState({
        loading: false,
        items: [],
        error: getErrorMessage(error),
      });
    }
  }, [api]);

  // ... other actions

  return (
    <DataContext.Provider value={{ state, actions }}>
      {children}
    </DataContext.Provider>
  );
}
```

## Testing API Clients

@@ All testing should be moved to testing docs

### Mock API Client

```typescript
// utils/api/__tests__/ApiClient.mock.ts

export function createMockApiClient(): jest.Mocked<ApiClient> {
  return {
    request: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    requestWithRetry: jest.fn(),
  } as any;
}
```

### Testing API Methods

```typescript
// utils/api/__tests__/DataApi.test.ts
import { DataApi } from '../DataApi';
import { createMockApiClient } from './ApiClient.mock';

describe('DataApi', () => {
  let mockClient: jest.Mocked<ApiClient>;
  let api: DataApi;

  beforeEach(() => {
    mockClient = createMockApiClient();
    api = new DataApi(mockClient);
  });

  describe('listItems', () => {
    it('Should fetch items successfully', async () => {
      const mockResponse = {
        data: {
          items: [{ id: '1', title: 'Item 1' }],
          total: 1,
        },
        status: 200,
        headers: {},
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await api.listItems();

      expect(mockClient.get).toHaveBeenCalledWith('/items', {});
      expect(result).toEqual(mockResponse.data);
    });

    it('Should handle errors', async () => {
      mockClient.get.mockRejectedValue(new ApiError('Network error', 500));

      await expect(api.listItems()).rejects.toThrow('Network error');
    });
  });
});
```

## Complete Examples

See the complete examples in the implementation above, including:

- Full API client with IAM signing
- Error handling utilities
- Retry logic with exponential backoff
- Caching strategies
- Integration with contexts
- Testing patterns

## Best Practices

### Do's

- ✅ Use TypeScript for all API types
- ✅ Implement proper error handling
- ✅ Use retry logic for transient failures
- ✅ Cache responses when appropriate
- ✅ Sign requests with IAM credentials
- ✅ Handle authentication errors
- ✅ Create mock clients for testing

### Don'ts

- ❌ Don't hardcode API endpoints
- ❌ Don't ignore error responses
- ❌ Don't retry non-retryable errors
- ❌ Don't cache sensitive data
- ❌ Don't expose credentials
- ❌ Don't skip request signing

## Next Steps

- Read [Context Pattern](./context-pattern.md) for state management
- Read [Types and Configuration](./types-and-configuration.md) for type definitions
- Read [Testing Strategy](./testing/) for testing API integrations
