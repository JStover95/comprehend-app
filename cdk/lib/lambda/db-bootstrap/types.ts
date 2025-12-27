/**
 * Base configuration for AWS client initialization
 * Used to override default AWS SDK configuration in tests
 * @param endpoint - Optional custom endpoint URL (e.g., for LocalStack)
 * @param credentials - Optional explicit credentials for testing
 */
export interface ClientConfig {
  endpoint?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

/**
 * Database connection configuration
 * @param host - Database host address
 * @param port - Database port number
 * @param database - Database name
 * @param user - Database username
 * @param password - Database password
 * @param ssl - SSL/TLS configuration
 */
export interface DatabaseConnectionConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: {
    rejectUnauthorized: boolean;
  };
}

/**
 * Service configuration for database bootstrap Lambda
 * @param secretArn - ARN of Secrets Manager secret containing master credentials
 * @param clusterEndpoint - RDS Aurora cluster endpoint hostname
 * @param clusterPort - Database port number
 * @param databaseName - Name of the database to bootstrap
 * @param iamUser - IAM database username for service authentication
 * @param region - AWS region where resources are located
 * @param environment - Deployment environment (dev, staging, prod)
 * @param clientConfig - AWS client configuration overrides for testing
 */
export interface ServiceConfig {
  secretArn: string;
  clusterEndpoint: string;
  clusterPort: number;
  databaseName: string;
  iamUser: string;
  region: string;
  environment: string;
  clientConfig: ClientConfig;
}

