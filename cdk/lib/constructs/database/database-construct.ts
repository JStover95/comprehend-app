import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as customResources from "aws-cdk-lib/custom-resources";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";
import { Construct } from "constructs";
import { EnvironmentConfig } from "../../types";

/**
 * Properties for DatabaseConstruct
 */
export interface DatabaseConstructProps {
  /**
   * VPC where the database will be deployed
   */
  readonly vpc: ec2.IVpc;

  /**
   * Private subnets for database deployment
   */
  readonly privateSubnets: ec2.ISubnet[];

  /**
   * Environment configuration
   */
  readonly environmentConfig: EnvironmentConfig;

  /**
   * Minimum ACU capacity for Aurora Serverless V2
   * @default 0.5 for dev/staging, 2 for prod
   */
  readonly minCapacity?: number;

  /**
   * Maximum ACU capacity for Aurora Serverless V2
   * @default 2 for dev/staging, configurable for prod
   */
  readonly maxCapacity?: number;

  /**
   * Enable multi-AZ deployment
   * @default false for dev/staging, true for prod
   */
  readonly multiAz?: boolean;

  /**
   * Backup retention period in days
   * @default 1 for dev/staging, 7 for prod
   */
  readonly backupRetentionDays?: number;
}

/**
 * Database Construct for Comprehend Application
 *
 * Creates a secure Aurora PostgreSQL Serverless V2 cluster with:
 * - Private subnet deployment (no public access)
 * - Encryption at rest and in transit
 * - IAM database authentication
 * - Automatic schema bootstrap via CloudFormation custom resource
 * - Environment-specific scaling configuration
 *
 * Features:
 * - Aurora PostgreSQL 17.x engine
 * - Serverless V2 auto-scaling
 * - Secrets Manager for master credentials
 * - Security groups restricting access to VPC
 * - Environment-specific tags
 */
export class DatabaseConstruct extends Construct {
  /**
   * The Aurora PostgreSQL cluster
   */
  public readonly cluster: rds.DatabaseCluster;

  /**
   * Secrets Manager secret containing master credentials
   */
  public readonly secret: secretsmanager.ISecret;

  /**
   * Security group for the database cluster
   */
  public readonly securityGroup: ec2.SecurityGroup;

  /**
   * IAM database user name for service authentication
   */
  public readonly iamUser: string = "db_service_user";

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    const { vpc, privateSubnets, environmentConfig } = props;

    // Determine environment-specific configuration
    const isProd = environmentConfig.name === "prod";

    // ACU scaling configuration
    const minCapacity = props.minCapacity ?? (isProd ? 2 : 0);
    const maxCapacity = props.maxCapacity ?? (isProd ? 16 : 2);

    // Multi-AZ configuration
    const multiAz = props.multiAz ?? isProd;

    // Backup retention
    const backupRetentionDays = props.backupRetentionDays ?? (isProd ? 7 : 1);

    // Create security group for database
    this.securityGroup = new ec2.SecurityGroup(this, "DatabaseSecurityGroup", {
      vpc,
      description: "Security group for Aurora PostgreSQL database",
      allowAllOutbound: false,
    });

    // Allow inbound PostgreSQL traffic from within VPC
    this.securityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      "Allow PostgreSQL access from within VPC",
    );

    // Create cluster-managed secret for master credentials
    const credentials = rds.Credentials.fromGeneratedSecret("postgres", {
      excludeCharacters: '"@/\\',
      secretName: `${environmentConfig.name}-database-credentials`,
    });

    // Create DB subnet group for private subnets
    const subnetGroup = new rds.SubnetGroup(this, "DatabaseSubnetGroup", {
      description: `Private subnet group for ${environmentConfig.name} database`,
      vpc,
      vpcSubnets: {
        subnets: privateSubnets,
      },
    });

    // Create Aurora PostgreSQL Serverless V2 cluster
    this.cluster = new rds.DatabaseCluster(this, "DatabaseCluster", {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_17_4,
      }),
      credentials,
      vpc,
      subnetGroup,
      securityGroups: [this.securityGroup],
      serverlessV2MinCapacity: minCapacity,
      serverlessV2MaxCapacity: maxCapacity,
      defaultDatabaseName: "postgres",
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT, // Retain data on deletion
      deletionProtection: isProd, // Enable deletion protection for prod
      storageEncrypted: true, // Encryption at rest
      iamAuthentication: true, // Enable IAM database authentication
      backup: {
        retention: cdk.Duration.days(backupRetentionDays),
      },
      preferredMaintenanceWindow: isProd
        ? "sun:03:00-sun:04:00"
        : "sun:04:00-sun:05:00",
      // Multi-AZ configuration
      writer: rds.ClusterInstance.serverlessV2("writer", {
        enablePerformanceInsights: isProd,
      }),
      readers: multiAz
        ? [
            rds.ClusterInstance.serverlessV2("reader", {
              enablePerformanceInsights: isProd,
            }),
          ]
        : undefined,
    });

    if (!this.cluster.secret) {
      throw new Error("Failed to create database cluster secret");
    }

    this.secret = this.cluster.secret;

    // Apply environment tags to cluster
    cdk.Tags.of(this.cluster).add(
      "Application",
      environmentConfig.tags.Application,
    );
    cdk.Tags.of(this.cluster).add(
      "Environment",
      environmentConfig.tags.Environment,
    );
    cdk.Tags.of(this.cluster).add(
      "ManagedBy",
      environmentConfig.tags.ManagedBy,
    );

    // Apply additional custom tags
    Object.entries(environmentConfig.tags).forEach(([key, value]) => {
      if (!["Application", "Environment", "ManagedBy"].includes(key)) {
        cdk.Tags.of(this.cluster).add(key, value);
      }
    });

    // Apply tags to secret
    cdk.Tags.of(this.secret).add(
      "Application",
      environmentConfig.tags.Application,
    );
    cdk.Tags.of(this.secret).add(
      "Environment",
      environmentConfig.tags.Environment,
    );
    cdk.Tags.of(this.secret).add("ManagedBy", environmentConfig.tags.ManagedBy);

    // Apply tags to security group
    cdk.Tags.of(this.securityGroup).add(
      "Application",
      environmentConfig.tags.Application,
    );
    cdk.Tags.of(this.securityGroup).add(
      "Environment",
      environmentConfig.tags.Environment,
    );
    cdk.Tags.of(this.securityGroup).add(
      "ManagedBy",
      environmentConfig.tags.ManagedBy,
    );

    // Create Lambda function for database bootstrap custom resource
    const bootstrapFunction = new lambdaNodejs.NodejsFunction(
      this,
      "BootstrapFunction",
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: "handler",
        entry: path.join(__dirname, "../../lambda/db-bootstrap/handler.ts"),
        timeout: cdk.Duration.minutes(5),
        memorySize: 256,
        bundling: {
          // minify: false,
          // sourceMap: true,
          // target: "node22",
          // format: lambdaNodejs.OutputFormat.CJS,
          commandHooks: {
            beforeBundling: () => [],
            beforeInstall: () => [],
            afterBundling: (inputDir: string, outputDir: string) => {
              // Copy schema.sql file to Lambda package
              // The inputDir is the project root, outputDir is the Lambda package directory
              const schemaSource = path.join(
                inputDir,
                "lib",
                "lambda",
                "db-bootstrap",
                "schema",
                "schema.sql",
              );
              const schemaDestDir = path.join(outputDir, "schema");
              const schemaDest = path.join(schemaDestDir, "schema.sql");
              return [
                `mkdir -p "${schemaDestDir}"`,
                `cp "${schemaSource}" "${schemaDest}"`,
              ];
            },
          },
        },
        vpc,
        vpcSubnets: {
          subnets: privateSubnets,
        },
        securityGroups: [this.securityGroup],
        environment: {
          SECRET_ARN: this.secret.secretArn,
          CLUSTER_ENDPOINT: this.cluster.clusterEndpoint.hostname,
          CLUSTER_PORT: this.cluster.clusterEndpoint.port.toString(),
          DATABASE_NAME: "postgres",
          IAM_USER: this.iamUser,
          ENVIRONMENT: environmentConfig.name,
        },
      },
    );

    // Grant Lambda permissions to read secret
    this.secret.grantRead(bootstrapFunction);

    // Grant Lambda permissions for IAM database authentication
    // The Lambda needs permission to generate IAM auth tokens for RDS
    bootstrapFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["rds-db:connect"],
        resources: [
          `arn:aws:rds-db:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:dbuser:${this.cluster.clusterIdentifier}/${this.iamUser}`,
        ],
      }),
    );

    // Grant Lambda permissions to connect to database (VPC access)
    // The Lambda is already in the VPC with access to the security group

    // Create CloudFormation custom resource
    const bootstrapProvider = new customResources.Provider(
      this,
      "BootstrapProvider",
      {
        onEventHandler: bootstrapFunction,
      },
    );

    new cdk.CustomResource(this, "BootstrapResource", {
      serviceToken: bootstrapProvider.serviceToken,
      properties: {
        SecretArn: this.secret.secretArn,
        ClusterEndpoint: this.cluster.clusterEndpoint.hostname,
        ClusterPort: this.cluster.clusterEndpoint.port.toString(),
        DatabaseName: "postgres",
        IamUser: this.iamUser,
        Environment: environmentConfig.name,
      },
    });

    // Export stack outputs
    new cdk.CfnOutput(this, "DatabaseEndpoint", {
      value: this.cluster.clusterEndpoint.hostname,
      description: "Aurora PostgreSQL cluster endpoint",
      exportName: `${environmentConfig.name}-DatabaseEndpoint`,
    });

    new cdk.CfnOutput(this, "DatabasePort", {
      value: this.cluster.clusterEndpoint.port.toString(),
      description: "Aurora PostgreSQL cluster port",
      exportName: `${environmentConfig.name}-DatabasePort`,
    });

    new cdk.CfnOutput(this, "DatabaseSecretArn", {
      value: this.secret.secretArn,
      description:
        "ARN of Secrets Manager secret containing master credentials",
      exportName: `${environmentConfig.name}-DatabaseSecretArn`,
    });

    new cdk.CfnOutput(this, "DatabaseIamUser", {
      value: this.iamUser,
      description: "IAM database username for service authentication",
      exportName: `${environmentConfig.name}-DatabaseIamUser`,
    });
  }
}
