# Contracts: Database Infrastructure

**Date**: December 23, 2025  
**Feature**: 002-managed-database

## Overview

This directory contains contract definitions for the database infrastructure feature. Since this is an infrastructure feature (not an API), contracts define the interface between the database construct and dependent stacks/services.

## Contracts

### Stack Outputs Schema

**File**: `stack-outputs.schema.json`

Defines the structure of CloudFormation stack outputs exported by the DatabaseConstruct. These outputs are consumed by dependent stacks and services to connect to the database.

**Usage**: Validate stack outputs in integration tests or when importing outputs in dependent stacks.

### Connection Contract

The database connection contract is defined by:

1. **IAM Authentication**: Services connect using temporary IAM credentials via RDS Signer
2. **Connection Parameters**: Endpoint, port, database name, IAM user
3. **SSL Required**: All connections must use SSL/TLS encryption

See `quickstart.md` for connection examples.

## No API Contracts

This feature does not expose REST or GraphQL APIs. Database access is direct via PostgreSQL protocol. Application-level APIs that use this database will be defined in separate feature specifications.
