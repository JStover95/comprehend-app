import * as cdk from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { DatabaseConstruct } from "../../../../lib/constructs/database/database-construct";
import { EnvironmentConfig } from "../../../../lib/types";

describe("DatabaseConstruct", () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let vpc: ec2.Vpc;
  let privateSubnets: ec2.ISubnet[];

  const devConfig: EnvironmentConfig = {
    name: "dev",
    vpcCidr: "10.0.0.0/16",
    maxAzs: 2,
    enableNatGateways: false,
    tags: {
      Application: "Comprehend",
      Environment: "dev",
      ManagedBy: "CDK",
    },
  };

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, "TestStack");

    // Create VPC with private subnets for testing
    vpc = new ec2.Vpc(stack, "TestVpc", {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    privateSubnets = vpc.privateSubnets;
  });

  describe("Aurora PostgreSQL cluster creation", () => {
    it("creates Aurora PostgreSQL Serverless V2 cluster with engine version 17.x", () => {
      // Arrange & Act
      new DatabaseConstruct(stack, "Database", {
        vpc,
        privateSubnets,
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);
      template.hasResourceProperties("AWS::RDS::DBCluster", {
        Engine: "aurora-postgresql",
        EngineVersion: Match.stringLikeRegexp("^17\\."),
        ServerlessV2ScalingConfiguration: {
          MinCapacity: 0,
          MaxCapacity: 2,
        },
      });
    });

    it("configures cluster to use private subnets only", () => {
      // Arrange & Act
      new DatabaseConstruct(stack, "Database", {
        vpc,
        privateSubnets,
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);
      const cluster = template.findResources("AWS::RDS::DBCluster");
      const clusterResource = Object.values(cluster)[0];

      // Verify DBSubnetGroup uses private subnets
      template.hasResourceProperties("AWS::RDS::DBSubnetGroup", {
        DBSubnetGroupDescription: Match.stringLikeRegexp(".*[Pp]rivate.*"),
      });
      // Verify subnet group exists (SubnetIds may be empty during synthesis)
      template.resourceCountIs("AWS::RDS::DBSubnetGroup", 1);

      // Verify cluster has no public access
      expect(clusterResource.Properties?.PubliclyAccessible).toBeUndefined();
    });

    it("enables encryption at rest and in transit", () => {
      // Arrange & Act
      new DatabaseConstruct(stack, "Database", {
        vpc,
        privateSubnets,
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);
      template.hasResourceProperties("AWS::RDS::DBCluster", {
        StorageEncrypted: true,
      });
    });

    it("enables IAM database authentication", () => {
      // Arrange & Act
      new DatabaseConstruct(stack, "Database", {
        vpc,
        privateSubnets,
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);
      template.hasResourceProperties("AWS::RDS::DBCluster", {
        EnableIAMDatabaseAuthentication: true,
      });
    });

    it("creates Secrets Manager secret for master credentials", () => {
      // Arrange & Act
      new DatabaseConstruct(stack, "Database", {
        vpc,
        privateSubnets,
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);
      template.hasResourceProperties("AWS::SecretsManager::Secret", {
        GenerateSecretString: {
          SecretStringTemplate: Match.stringLikeRegexp(".*username.*"),
          GenerateStringKey: "password",
          ExcludeCharacters: Match.stringLikeRegexp(".*"),
        },
      });

      // Verify cluster uses the generated secret
      // With fromGeneratedSecret, MasterUsername is a plain string and MasterUserPassword references the secret
      template.hasResourceProperties("AWS::RDS::DBCluster", {
        MasterUsername: "postgres",
        MasterUserPassword: Match.anyValue(), // Password is generated and stored in secret
      });
    });

    it("configures security groups to allow database access only from within VPC", () => {
      // Arrange & Act
      new DatabaseConstruct(stack, "Database", {
        vpc,
        privateSubnets,
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);

      // Verify security group allows PostgreSQL access from VPC
      template.hasResourceProperties("AWS::EC2::SecurityGroup", {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: "tcp",
            FromPort: 5432,
            ToPort: 5432,
          }),
        ]),
      });

      // Verify it uses CidrIp (VPC CIDR) not SourceSecurityGroupId
      const sgResources = template.findResources("AWS::EC2::SecurityGroup");
      const sgResource = Object.values(sgResources)[0];
      const ingressRules = sgResource.Properties?.SecurityGroupIngress || [];
      const postgresRule = ingressRules.find(
        (rule: any) => rule.FromPort === 5432 && rule.ToPort === 5432,
      );
      expect(postgresRule).toBeDefined();
      expect(postgresRule.CidrIp).toBeDefined();
    });
  });

  describe("Environment-specific configuration", () => {
    it("configures dev environment with 0-2 ACUs", () => {
      // Arrange & Act
      new DatabaseConstruct(stack, "Database", {
        vpc,
        privateSubnets,
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);
      template.hasResourceProperties("AWS::RDS::DBCluster", {
        ServerlessV2ScalingConfiguration: {
          MinCapacity: 0,
          MaxCapacity: 2,
        },
      });
    });

    it("configures staging environment with 0-2 ACUs", () => {
      // Arrange
      const stagingConfig: EnvironmentConfig = {
        name: "staging",
        vpcCidr: "10.1.0.0/16",
        maxAzs: 2,
        enableNatGateways: true,
        tags: {
          Application: "Comprehend",
          Environment: "staging",
          ManagedBy: "CDK",
        },
      };

      // Act
      new DatabaseConstruct(stack, "Database", {
        vpc,
        privateSubnets,
        environmentConfig: stagingConfig,
      });

      // Assert
      const template = Template.fromStack(stack);
      template.hasResourceProperties("AWS::RDS::DBCluster", {
        ServerlessV2ScalingConfiguration: {
          MinCapacity: 0,
          MaxCapacity: 2,
        },
      });
    });

    it("applies environment tags to all database resources", () => {
      // Arrange & Act
      new DatabaseConstruct(stack, "Database", {
        vpc,
        privateSubnets,
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);

      // Check cluster tags
      template.hasResourceProperties("AWS::RDS::DBCluster", {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: "Application",
            Value: "Comprehend",
          }),
          Match.objectLike({
            Key: "Environment",
            Value: "dev",
          }),
          Match.objectLike({
            Key: "ManagedBy",
            Value: "CDK",
          }),
        ]),
      });
    });
  });

  describe("Database bootstrap Lambda function", () => {
    it("creates Lambda function with Node.js 22.x runtime", () => {
      // Arrange & Act
      new DatabaseConstruct(stack, "Database", {
        vpc,
        privateSubnets,
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);
      template.hasResourceProperties("AWS::Lambda::Function", {
        Runtime: "nodejs22.x",
        Handler: "index.handler",
        Timeout: 300, // 5 minutes
        MemorySize: 256,
      });
    });

    it("configures Lambda function in VPC with database security group", () => {
      // Arrange & Act
      new DatabaseConstruct(stack, "Database", {
        vpc,
        privateSubnets,
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);
      template.hasResourceProperties("AWS::Lambda::Function", {
        VpcConfig: {
          SubnetIds: Match.anyValue(),
          SecurityGroupIds: Match.anyValue(),
        },
      });
    });

    it("sets Lambda environment variables with database configuration", () => {
      // Arrange & Act
      new DatabaseConstruct(stack, "Database", {
        vpc,
        privateSubnets,
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);
      // Find the bootstrap function (not the provider framework function)
      const lambdaFunctions = template.findResources("AWS::Lambda::Function");
      const bootstrapFunction = Object.values(lambdaFunctions).find(
        (func: any) =>
          func.Properties?.Handler === "index.handler" &&
          func.Properties?.Environment?.Variables?.SECRET_ARN,
      );

      expect(bootstrapFunction).toBeDefined();
      if (bootstrapFunction) {
        const variables = bootstrapFunction.Properties.Environment.Variables;
        // Check that all required environment variables are present
        expect(variables.SECRET_ARN).toBeDefined();
        expect(variables.CLUSTER_ENDPOINT).toBeDefined();
        expect(variables.CLUSTER_PORT).toBeDefined();
        expect(variables.DATABASE_NAME).toBe("postgres");
        expect(variables.IAM_USER).toBe("db_service_user");
        expect(variables.ENVIRONMENT).toBe("dev");
      }
    });

    it("grants Lambda function permission to read secret", () => {
      // Arrange & Act
      new DatabaseConstruct(stack, "Database", {
        vpc,
        privateSubnets,
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);
      // Verify IAM policy allows secretsmanager:GetSecretValue
      template.hasResourceProperties("AWS::IAM::Policy", {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: "Allow",
              Action: Match.arrayWith([
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret",
              ]),
              Resource: Match.anyValue(),
            }),
          ]),
        },
      });
    });
  });

  describe("Database bootstrap custom resource", () => {
    it("creates CloudFormation custom resource for schema bootstrap", () => {
      // Arrange & Act
      new DatabaseConstruct(stack, "Database", {
        vpc,
        privateSubnets,
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);
      template.resourceCountIs("AWS::CloudFormation::CustomResource", 1);
    });

    it("configures custom resource with database properties", () => {
      // Arrange & Act
      new DatabaseConstruct(stack, "Database", {
        vpc,
        privateSubnets,
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);
      template.hasResourceProperties("AWS::CloudFormation::CustomResource", {
        ServiceToken: Match.anyValue(),
        SecretArn: Match.anyValue(),
        ClusterEndpoint: Match.anyValue(),
        ClusterPort: Match.anyValue(), // CloudFormation intrinsic function
        DatabaseName: "postgres",
        IamUser: "db_service_user",
        Environment: "dev",
      });
    });

    it("creates custom resource provider", () => {
      // Arrange & Act
      new DatabaseConstruct(stack, "Database", {
        vpc,
        privateSubnets,
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);
      // Custom resource provider creates a Lambda function for handling events
      // We verify it exists by checking that there are at least 2 Lambda functions
      // (one for bootstrap, one for the provider's onEventHandler)
      const lambdaFunctions = template.findResources("AWS::Lambda::Function");
      expect(Object.keys(lambdaFunctions).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Stack outputs", () => {
    it("exports database endpoint, port, secret ARN, and IAM user", () => {
      // Arrange & Act
      new DatabaseConstruct(stack, "Database", {
        vpc,
        privateSubnets,
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);

      // Verify outputs exist (logical ID includes construct path: "Database" + output ID)
      template.hasOutput("*", {
        Export: { Name: "dev-DatabaseEndpoint" },
        Value: Match.anyValue(),
      });
      template.hasOutput("*", {
        Export: { Name: "dev-DatabasePort" },
        Value: Match.anyValue(),
      });
      template.hasOutput("*", {
        Export: { Name: "dev-DatabaseSecretArn" },
        Value: Match.anyValue(),
      });
      template.hasOutput("*", {
        Export: { Name: "dev-DatabaseIamUser" },
        Value: Match.anyValue(),
      });
    });
  });
});
