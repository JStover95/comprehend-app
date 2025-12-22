# Types and Configuration

## Overview

This document outlines TypeScript patterns and configuration management conventions used throughout the application.

## Table of Contents

- [TypeScript Patterns](#typescript-patterns)
- [Type Definitions](#type-definitions)
- [Environment Configuration](#environment-configuration)
- [Constants Organization](#constants-organization)
- [Configuration Management](#configuration-management)
- [Type Guards and Validators](#type-guards-and-validators)

## TypeScript Patterns

### Interface vs Type

**Use `interface` when:**

- Defining object shapes
- Defining React component props
- Need to extend or merge declarations
- Defining API contracts

```typescript
// Good: Use interface for object shapes
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UserCardProps {
  user: User;
  onPress?: () => void;
}
```

**Use `type` when:**

- Creating union or intersection types
- Defining type aliases
- Mapping or conditional types
- Primitive type aliases

```typescript
// Good: Use type for unions and aliases
export type Status = 'idle' | 'loading' | 'success' | 'error';
export type ID = string | number;
export type Optional<T> = T | null | undefined;
```

### JSDoc Comments

Document all public interfaces and types:

```typescript
/**
 * Represents a user in the system
 */
export interface User {
  /** Unique user identifier */
  id: string;
  /** User's full name */
  name: string;
  /** User's email address */
  email: string;
  /** Optional profile avatar URL */
  avatar?: string;
  /** User role in the system */
  role: UserRole;
  /** Timestamp when user was created */
  createdAt: Date;
}

/**
 * Available user roles
 */
export type UserRole = 'admin' | 'user' | 'guest';
```

### Readonly Types

Use `readonly` for immutable data:

```typescript
// Configuration objects
export interface AppConfig {
  readonly apiUrl: string;
  readonly region: string;
  readonly timeout: number;
}

// Read-only arrays
export interface DataState {
  readonly items: readonly DataItem[];
  readonly loading: boolean;
}

// Readonly utility type
export type ReadonlyDeep<T> = {
  readonly [P in keyof T]: T[P] extends object ? ReadonlyDeep<T[P]> : T[P];
};
```

### Generic Types

Use generics for reusable, type-safe code:

```typescript
/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

/**
 * Generic list response with pagination
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  nextToken?: string;
}

/**
 * Generic state for async operations
 */
export interface AsyncState<T, E = string> {
  loading: boolean;
  data: T | null;
  error: E | null;
}

// Usage
const userResponse: ApiResponse<User> = await fetchUser();
const itemsList: PaginatedResponse<DataItem> = await fetchItems();
const userState: AsyncState<User> = { loading: false, data: null, error: null };
```

## Type Definitions

### Domain Models

```typescript
// types/user.ts

/**
 * User entity from the database
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/**
 * User roles
 */
export enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
}

/**
 * User profile update request
 */
export interface UpdateUserProfileRequest {
  name?: string;
  avatar?: string;
}

/**
 * User with computed properties
 */
export interface UserWithMetadata extends User {
  initials: string;
  displayName: string;
  isAdmin: boolean;
}
```

### API Types

```typescript
// types/api.ts

/**
 * Base API request
 */
export interface ApiRequest {
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

/**
 * Base API response
 */
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  message: string;
  code: string;
  details?: Record<string, any>;
}

/**
 * List request with pagination
 */
export interface ListRequest {
  limit?: number;
  offset?: number;
  nextToken?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

### Component Types

```typescript
// types/components.ts

/**
 * Common props for all components
 */
export interface BaseComponentProps {
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Props for components that can be disabled
 */
export interface DisableableProps {
  disabled?: boolean;
}

/**
 * Props for components with loading state
 */
export interface LoadingProps {
  loading?: boolean;
}

/**
 * Props for components with press handlers
 */
export interface PressableProps {
  onPress?: () => void;
  onLongPress?: () => void;
}

/**
 * Combined common component props
 */
export interface CommonComponentProps
  extends BaseComponentProps,
    DisableableProps,
    LoadingProps {}
```

## Environment Configuration

### Environment Variables

```typescript
// config/env.ts

/**
 * Environment variable configuration
 */
export const env = {
  /** API Gateway endpoint */
  apiUrl: process.env.EXPO_PUBLIC_API_URL!,
  
  /** AWS region */
  region: process.env.EXPO_PUBLIC_AWS_REGION!,
  
  /** Cognito User Pool ID */
  userPoolId: process.env.EXPO_PUBLIC_USER_POOL_ID!,
  
  /** Cognito Identity Pool ID */
  identityPoolId: process.env.EXPO_PUBLIC_IDENTITY_POOL_ID!,
  
  /** App environment */
  environment: (process.env.EXPO_PUBLIC_ENV || 'development') as Environment,
  
  /** Enable debug logging */
  debugMode: process.env.EXPO_PUBLIC_DEBUG === 'true',
} as const;

export type Environment = 'development' | 'staging' | 'production';

/**
 * Validate environment configuration
 */
export function validateEnv(): void {
  const requiredVars = [
    'EXPO_PUBLIC_API_URL',
    'EXPO_PUBLIC_AWS_REGION',
    'EXPO_PUBLIC_USER_POOL_ID',
    'EXPO_PUBLIC_IDENTITY_POOL_ID',
  ];

  const missing = requiredVars.filter(v => !process.env[v]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
```

### .env Files

```.env.example
# API Configuration
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_AWS_REGION=us-east-1

# Cognito Configuration
EXPO_PUBLIC_USER_POOL_ID=us-east-1_xxxxxxxxx
EXPO_PUBLIC_IDENTITY_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Environment
EXPO_PUBLIC_ENV=development

# Debug
EXPO_PUBLIC_DEBUG=true
```

### Environment-Specific Configuration

**Important**: Always pull configuration from environment variables rather than hardcoding values. This ensures security, flexibility, and proper separation of configuration from code.

```typescript
// config/environments.ts
import { env } from './env';

export interface EnvironmentConfig {
  apiUrl: string;
  region: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableAnalytics: boolean;
}

/**
 * Get configuration based on current environment
 * All values are sourced from environment variables
 */
export function getConfig(): EnvironmentConfig {
  const environment = env.environment;
  
  return {
    apiUrl: env.apiUrl,
    region: env.region,
    logLevel: getLogLevel(environment),
    enableAnalytics: getAnalyticsEnabled(environment),
  };
}

/**
 * Determine log level based on environment
 * Can be overridden by EXPO_PUBLIC_LOG_LEVEL env var
 */
function getLogLevel(environment: Environment): 'debug' | 'info' | 'warn' | 'error' {
  const override = process.env.EXPO_PUBLIC_LOG_LEVEL;
  if (override && ['debug', 'info', 'warn', 'error'].includes(override)) {
    return override as 'debug' | 'info' | 'warn' | 'error';
  }
  
  switch (environment) {
    case 'development':
      return 'debug';
    case 'staging':
      return 'info';
    case 'production':
      return 'error';
    default:
      return 'debug';
  }
}

/**
 * Determine if analytics should be enabled
 * Can be overridden by EXPO_PUBLIC_ENABLE_ANALYTICS env var
 */
function getAnalyticsEnabled(environment: Environment): boolean {
  const override = process.env.EXPO_PUBLIC_ENABLE_ANALYTICS;
  if (override !== undefined) {
    return override === 'true';
  }
  
  return environment === 'production' || environment === 'staging';
}
```

**Additional Environment Variables** (add to `.env` files):

```.env
# Optional: Override log level
EXPO_PUBLIC_LOG_LEVEL=debug

# Optional: Override analytics
EXPO_PUBLIC_ENABLE_ANALYTICS=false
```

## Constants Organization

### Theme Constants

```typescript
// constants/theme.ts

/**
 * Color palette
 */
export const Colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  
  background: {
    primary: '#FFFFFF',
    secondary: '#F2F2F7',
    tertiary: '#E5E5EA',
  },
  
  text: {
    primary: '#000000',
    secondary: '#3C3C43',
    tertiary: '#8E8E93',
    inverse: '#FFFFFF',
  },
  
  border: {
    light: '#E5E5EA',
    medium: '#C7C7CC',
    dark: '#8E8E93',
  },
} as const;

/**
 * Spacing scale
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * Typography
 */
export const Typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    loose: 1.8,
  },
} as const;

/**
 * Border radius
 */
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

/**
 * Shadows
 */
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;
```

### API Constants

```typescript
// constants/api.ts

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  
  // Users
  USERS: '/users',
  USER_BY_ID: (id: string) => `/users/${id}`,
  USER_PROFILE: '/users/me',
  
  // Data
  ITEMS: '/items',
  ITEM_BY_ID: (id: string) => `/items/${id}`,
} as const;

/**
 * API configuration
 */
export const API_CONFIG = {
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  CACHE_TTL: 60000,
} as const;
```

### App Constants

```typescript
// constants/app.ts

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  USER_DATA: '@user_data',
  CREDENTIALS: '@aws_credentials',
  THEME: '@theme',
  SETTINGS: '@settings',
} as const;

/**
 * Navigation routes
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  DETAIL: (id: string) => `/detail/${id}`,
} as const;

/**
 * Validation rules
 */
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
} as const;
```

## Configuration Management

### App Configuration

```typescript
// config/app.ts
import { env } from './env';
import { getConfig } from './environments';

/**
 * Complete application configuration
 */
export const appConfig = {
  ...env,
  ...getConfig(env.environment),
  
  /** App version */
  version: '1.0.0',
  
  /** Build number */
  buildNumber: '1',
  
  /** Feature flags */
  features: {
    enableAnalytics: env.environment === 'production',
    enableCrashReporting: env.environment !== 'development',
    enableDebugPanel: env.debugMode,
  },
} as const;

export type AppConfig = typeof appConfig;
```

### Runtime Configuration

```typescript
// config/runtime.ts

/**
 * Runtime configuration that can change
 */
export class RuntimeConfig {
  private static instance: RuntimeConfig;
  private config: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): RuntimeConfig {
    if (!RuntimeConfig.instance) {
      RuntimeConfig.instance = new RuntimeConfig();
    }
    return RuntimeConfig.instance;
  }

  set<T>(key: string, value: T): void {
    this.config.set(key, value);
  }

  get<T>(key: string): T | undefined {
    return this.config.get(key);
  }

  has(key: string): boolean {
    return this.config.has(key);
  }

  delete(key: string): void {
    this.config.delete(key);
  }
}

// Usage
const runtime = RuntimeConfig.getInstance();
runtime.set('apiUrl', 'https://new-api.example.com');
const apiUrl = runtime.get<string>('apiUrl');
```

## Type Guards and Validators

### Type Guards

```typescript
// types/guards.ts

/**
 * Check if value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Check if value is a valid User
 */
export function isUser(value: any): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.email === 'string' &&
    typeof value.name === 'string'
  );
}

/**
 * Check if error is an ApiError
 */
export function isApiError(error: any): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Check if value is a valid email
 */
export function isValidEmail(value: string): boolean {
  return VALIDATION.EMAIL_REGEX.test(value);
}

/**
 * Check if array is non-empty
 */
export function isNonEmptyArray<T>(array: T[]): array is [T, ...T[]] {
  return array.length > 0;
}
```

## Best Practices

### Do's

- ✅ Use TypeScript for all code
- ✅ Document types with JSDoc comments
- ✅ Use `interface` for object shapes
- ✅ Use `type` for unions and aliases
- ✅ Make configuration readonly
- ✅ Validate environment variables on startup
- ✅ Use type guards for runtime checks
- ✅ Organize constants by domain
- ✅ Use const assertions for literal types

### Don'ts

- ❌ Don't use `any` type
- ❌ Don't skip type annotations for exported functions
- ❌ Don't hardcode values, use constants
- ❌ Don't expose sensitive configuration
- ❌ Don't mutate readonly configuration
- ❌ Don't skip JSDoc for public interfaces

## Next Steps

- Read [API Integration](./api-integration.md) for API type definitions
- Read [Context Pattern](./context-pattern.md) for context type patterns
- Read [Component Architecture](./component-architecture.md) for component types
- Read [Testing Strategy](./testing/) for testing with TypeScript
