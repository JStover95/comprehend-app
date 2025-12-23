import * as cdk from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
import { VpcConstruct } from "../../../lib/constructs/networking/vpc-construct";
import { EnvironmentConfig } from "../../../lib/types";

describe("VpcConstruct", () => {
  let app: cdk.App;
  let stack: cdk.Stack;

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

  const prodConfig: EnvironmentConfig = {
    name: "prod",
    vpcCidr: "10.2.0.0/16",
    maxAzs: 2, // Use 2 AZs for consistent test results
    enableNatGateways: true,
    natGateways: 2, // Match maxAzs for NAT gateway count
    tags: {
      Application: "Comprehend",
      Environment: "prod",
      ManagedBy: "CDK",
    },
  };

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, "TestStack");
  });

  describe("VPC creation", () => {
    it("creates VPC with specified CIDR block", () => {
      // Arrange & Act
      new VpcConstruct(stack, "TestVpc", {
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);
      template.hasResourceProperties("AWS::EC2::VPC", {
        CidrBlock: "10.0.0.0/16",
      });
    });

    it("enables DNS hostnames and support", () => {
      // Arrange & Act
      new VpcConstruct(stack, "TestVpc", {
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);
      template.hasResourceProperties("AWS::EC2::VPC", {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });
  });

  describe("Public subnets", () => {
    it("creates public subnets across multiple AZs", () => {
      // Arrange & Act
      new VpcConstruct(stack, "TestVpc", {
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);

      // Should have 2 public subnets (one per AZ)
      template.resourceCountIs("AWS::EC2::Subnet", 4); // 2 public + 2 private

      // Check for public subnet properties
      template.hasResourceProperties("AWS::EC2::Subnet", {
        MapPublicIpOnLaunch: true,
      });
    });

    it("assigns correct CIDR blocks to public subnets", () => {
      // Arrange & Act
      new VpcConstruct(stack, "TestVpc", {
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);

      // Public subnets should use .0/24 and .1/24
      template.hasResourceProperties("AWS::EC2::Subnet", {
        CidrBlock: "10.0.0.0/24",
        MapPublicIpOnLaunch: true,
      });

      template.hasResourceProperties("AWS::EC2::Subnet", {
        CidrBlock: "10.0.1.0/24",
        MapPublicIpOnLaunch: true,
      });
    });
  });

  describe("Private subnets", () => {
    it("creates private subnets across multiple AZs", () => {
      // Arrange & Act
      new VpcConstruct(stack, "TestVpc", {
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);

      // Check for private subnet properties (no public IP mapping)
      template.hasResourceProperties("AWS::EC2::Subnet", {
        MapPublicIpOnLaunch: false,
      });
    });

    it("assigns correct CIDR blocks to private subnets", () => {
      // Arrange & Act
      new VpcConstruct(stack, "TestVpc", {
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);

      // CDK allocates private subnets sequentially after public subnets
      // With public using /24 (0.0 and 1.0), private gets 2.0/23 and 4.0/23
      template.hasResourceProperties("AWS::EC2::Subnet", {
        CidrBlock: "10.0.2.0/23",
        MapPublicIpOnLaunch: false,
      });

      template.hasResourceProperties("AWS::EC2::Subnet", {
        CidrBlock: "10.0.4.0/23",
        MapPublicIpOnLaunch: false,
      });
    });
  });

  describe("NAT Gateways", () => {
    it("creates NAT gateways when enabled", () => {
      // Arrange & Act
      new VpcConstruct(stack, "TestVpc", {
        environmentConfig: prodConfig,
      });

      // Assert
      const template = Template.fromStack(stack);

      // Should have 2 NAT gateways (one per AZ for prod)
      template.resourceCountIs("AWS::EC2::NatGateway", 2);
    });

    it("does not create NAT gateways when disabled", () => {
      // Arrange & Act
      new VpcConstruct(stack, "TestVpc", {
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);

      // Should have 0 NAT gateways for dev
      template.resourceCountIs("AWS::EC2::NatGateway", 0);
    });

    it("creates Elastic IPs for NAT gateways", () => {
      // Arrange & Act
      new VpcConstruct(stack, "TestVpc", {
        environmentConfig: prodConfig,
      });

      // Assert
      const template = Template.fromStack(stack);

      // Should have 2 EIPs (one per NAT gateway)
      template.resourceCountIs("AWS::EC2::EIP", 2);

      template.hasResourceProperties("AWS::EC2::EIP", {
        Domain: "vpc",
      });
    });
  });

  describe("Internet Gateway", () => {
    it("creates internet gateway for public subnets", () => {
      // Arrange & Act
      new VpcConstruct(stack, "TestVpc", {
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);

      // Should have 1 Internet Gateway
      template.resourceCountIs("AWS::EC2::InternetGateway", 1);

      // Should have 1 VPC Gateway Attachment
      template.resourceCountIs("AWS::EC2::VPCGatewayAttachment", 1);
    });
  });

  describe("Route tables", () => {
    it("creates route tables for public and private subnets", () => {
      // Arrange & Act
      new VpcConstruct(stack, "TestVpc", {
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);

      // Should have route tables (2 public + 2 private)
      template.resourceCountIs("AWS::EC2::RouteTable", 4);
    });

    it("routes public subnets to Internet Gateway", () => {
      // Arrange & Act
      new VpcConstruct(stack, "TestVpc", {
        environmentConfig: devConfig,
      });

      // Assert
      const template = Template.fromStack(stack);

      // Public route should point to IGW
      template.hasResourceProperties("AWS::EC2::Route", {
        DestinationCidrBlock: "0.0.0.0/0",
        GatewayId: Match.anyValue(),
      });
    });

    it("routes private subnets to NAT Gateway when enabled", () => {
      // Arrange & Act
      new VpcConstruct(stack, "TestVpc", {
        environmentConfig: prodConfig,
      });

      // Assert
      const template = Template.fromStack(stack);

      // Private routes should point to NAT
      template.hasResourceProperties("AWS::EC2::Route", {
        DestinationCidrBlock: "0.0.0.0/0",
        NatGatewayId: Match.anyValue(),
      });
    });
  });

  describe("Subnet count", () => {
    it("subnet count matches maxAzs configuration", () => {
      // Arrange & Act - Test with 2 AZs
      new VpcConstruct(stack, "TestVpc2Az", {
        environmentConfig: devConfig,
      });

      // Assert
      const template2Az = Template.fromStack(stack);
      template2Az.resourceCountIs("AWS::EC2::Subnet", 4); // 2 public + 2 private

      // Arrange & Act - Test with 2 AZs (prod config also uses 2)
      const app3Az = new cdk.App(); // Create fresh app to avoid synth conflicts
      const stack3Az = new cdk.Stack(app3Az, "TestStack3Az");
      new VpcConstruct(stack3Az, "TestVpc3Az", {
        environmentConfig: prodConfig,
      });

      // Assert
      const template3Az = Template.fromStack(stack3Az);
      template3Az.resourceCountIs("AWS::EC2::Subnet", 4); // 2 public + 2 private (matching prodConfig maxAzs: 2)
    });
  });

  describe("Resource naming", () => {
    it("applies environment-specific naming to VPC", () => {
      // Arrange & Act
      const construct = new VpcConstruct(stack, "TestVpc", {
        environmentConfig: devConfig,
      });

      // Assert
      expect(construct.vpc.node.id).toContain("Vpc");
    });
  });

  describe("Getters", () => {
    it("exposes VPC through getter", () => {
      // Arrange & Act
      const construct = new VpcConstruct(stack, "TestVpc", {
        environmentConfig: devConfig,
      });

      // Assert
      expect(construct.vpc).toBeDefined();
      expect(construct.vpc.vpcId).toBeDefined();
    });

    it("exposes public subnets through getter", () => {
      // Arrange & Act
      const construct = new VpcConstruct(stack, "TestVpc", {
        environmentConfig: devConfig,
      });

      // Assert
      expect(construct.publicSubnets).toBeDefined();
      expect(construct.publicSubnets.length).toBe(2);
    });

    it("exposes private subnets through getter", () => {
      // Arrange & Act
      const construct = new VpcConstruct(stack, "TestVpc", {
        environmentConfig: devConfig,
      });

      // Assert
      expect(construct.privateSubnets).toBeDefined();
      expect(construct.privateSubnets.length).toBe(2);
    });

    it("exposes availability zones through getter", () => {
      // Arrange & Act
      const construct = new VpcConstruct(stack, "TestVpc", {
        environmentConfig: devConfig,
      });

      // Assert
      expect(construct.availabilityZones).toBeDefined();
      expect(construct.availabilityZones.length).toBe(2);
    });

    it("exposes NAT gateway IPs when enabled", () => {
      // Arrange & Act
      const construct = new VpcConstruct(stack, "TestVpc", {
        environmentConfig: prodConfig,
      });

      // Assert
      expect(construct.natGatewayIps).toBeDefined();
      expect(construct.natGatewayIps.length).toBe(2); // Matches prodConfig natGateways: 2
    });

    it("returns empty array for NAT gateway IPs when disabled", () => {
      // Arrange & Act
      const construct = new VpcConstruct(stack, "TestVpc", {
        environmentConfig: devConfig,
      });

      // Assert
      expect(construct.natGatewayIps).toBeDefined();
      expect(construct.natGatewayIps.length).toBe(0);
    });
  });
});
