# API Contracts: Mobile App Base Structure

**Date**: 2025-12-23  
**Feature**: 003-mobile-app-base-structure  
**Status**: N/A

## Overview

This feature is frontend-only and does not define backend API contracts. The base structure establishes:

1. Theme system (client-side only)
2. Base UI components (client-side only)
3. Navigation structure (client-side only)
4. Environment configuration (build-time configuration)

## Future API Contracts

API contracts will be defined in future phases:

- **Phase 1: Authentication** - User registration, login, session management APIs
- **Phase 3: Exercise Management API** - Exercise CRUD operations
- **Phase 5: ReaderAgent Integration** - AI agent API endpoints

## Configuration Contracts

While not API contracts, the environment configuration follows a contract:

### Environment Variables Contract

All environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the Expo app.

**Required Variables**:

- `EXPO_PUBLIC_API_URL`: API Gateway endpoint URL
- `EXPO_PUBLIC_AWS_REGION`: AWS region
- `EXPO_PUBLIC_ENV`: Environment name

**Optional Variables**:

- `EXPO_PUBLIC_DEBUG`: Enable debug features (default: false)
- `EXPO_PUBLIC_LOG_LEVEL`: Override log level
- `EXPO_PUBLIC_ENABLE_ANALYTICS`: Override analytics setting

**Validation**: All required variables must be present at build time. Missing variables will cause app startup to fail with a clear error message.
