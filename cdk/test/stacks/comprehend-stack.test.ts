import * as cdk from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
import { ComprehendStack } from "../../lib/stacks/comprehend-stack";
import { EnvironmentConfig } from "../../lib/types";

describe("ComprehendStack", () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe("Environment configuration", () => {
    it("creates stack with dev environment configuration", () => {
      // Arrange & Act
      const stack = new ComprehendStack(app, "TestStack", {
        environmentName: "dev",
      });

      // Assert
      expect(stack.environmentConfig.name).toBe("dev");
      expect(stack.environmentConfig.vpcCidr).toBe("10.0.0.0/16");
      expect(stack.environmentConfig.maxAzs).toBe(2);
      expect(stack.environmentConfig.enableNatGateways).toBe(false);
    });

    it("creates stack with staging environment configuration", () => {
      // Arrange & Act
      const stack = new ComprehendStack(app, "TestStack", {
        environmentName: "staging",
      });

      // Assert
      expect(stack.environmentConfig.name).toBe("staging");
      expect(stack.environmentConfig.vpcCidr).toBe("10.1.0.0/16");
      expect(stack.environmentConfig.maxAzs).toBe(2);
      expect(stack.environmentConfig.enableNatGateways).toBe(true);
    });

    it("creates stack with prod environment configuration", () => {
      // Arrange & Act
      const stack = new ComprehendStack(app, "TestStack", {
        environmentName: "prod",
      });

      // Assert
      expect(stack.environmentConfig.name).toBe("prod");
      expect(stack.environmentConfig.vpcCidr).toBe("10.2.0.0/16");
      expect(stack.environmentConfig.maxAzs).toBe(3);
      expect(stack.environmentConfig.enableNatGateways).toBe(true);
    });

    it("accepts custom environment configuration", () => {
      // Arrange
      const customConfig: EnvironmentConfig = {
        name: "dev",
        vpcCidr: "10.10.0.0/16",
        maxAzs: 2,
        enableNatGateways: true,
        tags: {
          Application: "Comprehend",
          Environment: "dev",
          ManagedBy: "CDK",
          CustomTag: "CustomValue",
        },
      };

      // Act
      const stack = new ComprehendStack(app, "TestStack", {
        environmentConfig: customConfig,
      });

      // Assert
      expect(stack.environmentConfig.vpcCidr).toBe("10.10.0.0/16");
      expect(stack.environmentConfig.tags.CustomTag).toBe("CustomValue");
    });
  });

  describe("Resource naming", () => {
    it("applies environment-specific resource naming", () => {
      // Arrange & Act
      const stack = new ComprehendStack(app, "TestStack", {
        environmentName: "dev",
      });
      const template = Template.fromStack(stack);

      // Assert - VPC should exist with proper configuration
      template.hasResourceProperties("AWS::EC2::VPC", {
        CidrBlock: "10.0.0.0/16",
      });
    });
  });

  describe("Resource tagging", () => {
    it("applies required tags to all resources", () => {
      // Arrange & Act
      const stack = new ComprehendStack(app, "TestStack", {
        environmentName: "dev",
      });
      const template = Template.fromStack(stack);

      // Assert - Check that VPC has tags
      template.hasResourceProperties("AWS::EC2::VPC", {
        Tags: Match.arrayWith([
          { Key: "Application", Value: "Comprehend" },
          { Key: "Environment", Value: "dev" },
          { Key: "ManagedBy", Value: "CDK" },
        ]),
      });
    });

    it("applies custom tags from configuration", () => {
      // Arrange
      const customConfig: EnvironmentConfig = {
        name: "dev",
        vpcCidr: "10.0.0.0/16",
        maxAzs: 2,
        enableNatGateways: false,
        tags: {
          Application: "Comprehend",
          Environment: "dev",
          ManagedBy: "CDK",
          CostCenter: "Development",
          Owner: "Backend Team",
        },
      };

      // Act
      const stack = new ComprehendStack(app, "TestStack", {
        environmentConfig: customConfig,
      });
      const template = Template.fromStack(stack);

      // Assert
      template.hasResourceProperties("AWS::EC2::VPC", {
        Tags: Match.arrayWith([
          { Key: "CostCenter", Value: "Development" },
          { Key: "Owner", Value: "Backend Team" },
        ]),
      });
    });
  });

  describe("NAT Gateway configuration", () => {
    it("dev environment has no NAT gateways", () => {
      // Arrange & Act
      const stack = new ComprehendStack(app, "TestStack", {
        environmentName: "dev",
      });
      const template = Template.fromStack(stack);

      // Assert
      template.resourceCountIs("AWS::EC2::NatGateway", 0);
    });

    it("prod environment has NAT gateways when enabled", () => {
      // Arrange & Act
      const stack = new ComprehendStack(app, "TestStack", {
        environmentName: "prod",
      });
      const template = Template.fromStack(stack);

      // Assert - NAT gateways are created (actual count depends on available AZs)
      // In test environments, typically 2 AZs are available even if maxAzs is 3
      const templateResources = template.toJSON().Resources;
      const natGatewayCount = Object.keys(templateResources).filter(
        (key) => templateResources[key].Type === "AWS::EC2::NatGateway",
      ).length;
      expect(natGatewayCount).toBeGreaterThanOrEqual(1); // At least 1 NAT gateway
      expect(natGatewayCount).toBeLessThanOrEqual(3); // No more than maxAzs
    });
  });

  describe("Configuration validation", () => {
    it("validates invalid environment names are rejected", () => {
      // Arrange
      const invalidConfig: EnvironmentConfig = {
        name: "invalid" as any,
        vpcCidr: "10.0.0.0/16",
        maxAzs: 2,
        enableNatGateways: false,
        tags: {
          Application: "Comprehend",
          Environment: "invalid",
          ManagedBy: "CDK",
        },
      };

      // Act & Assert
      expect(() => {
        new ComprehendStack(app, "TestStack", {
          environmentConfig: invalidConfig,
        });
      }).toThrow("Invalid environment configuration");
    });

    it("validates invalid CIDR blocks are rejected", () => {
      // Arrange
      const invalidConfig: EnvironmentConfig = {
        name: "dev",
        vpcCidr: "not-a-cidr",
        maxAzs: 2,
        enableNatGateways: false,
        tags: {
          Application: "Comprehend",
          Environment: "dev",
          ManagedBy: "CDK",
        },
      };

      // Act & Assert
      expect(() => {
        new ComprehendStack(app, "TestStack", {
          environmentConfig: invalidConfig,
        });
      }).toThrow("Invalid environment configuration");
    });

    it("validates maxAzs out of range are rejected", () => {
      // Arrange
      const invalidConfig: EnvironmentConfig = {
        name: "dev",
        vpcCidr: "10.0.0.0/16",
        maxAzs: 5,
        enableNatGateways: false,
        tags: {
          Application: "Comprehend",
          Environment: "dev",
          ManagedBy: "CDK",
        },
      };

      // Act & Assert
      expect(() => {
        new ComprehendStack(app, "TestStack", {
          environmentConfig: invalidConfig,
        });
      }).toThrow("Invalid environment configuration");
    });
  });

  describe("Stack outputs", () => {
    it("exports VPC ID with environment-prefixed name", () => {
      // Arrange & Act
      const stack = new ComprehendStack(app, "TestStack", {
        environmentName: "dev",
      });
      const template = Template.fromStack(stack);

      // Assert
      const outputs = template.findOutputs("*");
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.VpcId.Export?.Name).toBe("dev-VpcId");
    });

    it("exports public subnet IDs comma-separated", () => {
      // Arrange & Act
      const stack = new ComprehendStack(app, "TestStack", {
        environmentName: "dev",
      });
      const template = Template.fromStack(stack);

      // Assert
      const outputs = template.findOutputs("*");
      expect(outputs.PublicSubnetIds).toBeDefined();
      expect(outputs.PublicSubnetIds.Export?.Name).toBe("dev-PublicSubnetIds");
    });

    it("exports private subnet IDs comma-separated", () => {
      // Arrange & Act
      const stack = new ComprehendStack(app, "TestStack", {
        environmentName: "dev",
      });
      const template = Template.fromStack(stack);

      // Assert
      const outputs = template.findOutputs("*");
      expect(outputs.PrivateSubnetIds).toBeDefined();
      expect(outputs.PrivateSubnetIds.Export?.Name).toBe(
        "dev-PrivateSubnetIds",
      );
    });

    it("exports availability zones comma-separated", () => {
      // Arrange & Act
      const stack = new ComprehendStack(app, "TestStack", {
        environmentName: "dev",
      });
      const template = Template.fromStack(stack);

      // Assert
      const outputs = template.findOutputs("*");
      expect(outputs.AvailabilityZones).toBeDefined();
      expect(outputs.AvailabilityZones.Export?.Name).toBe(
        "dev-AvailabilityZones",
      );
    });

    it("exports NAT gateway IPs when enabled", () => {
      // Arrange & Act
      const stack = new ComprehendStack(app, "TestStack", {
        environmentName: "prod",
      });
      const template = Template.fromStack(stack);

      // Assert
      const outputs = template.findOutputs("*");
      expect(outputs.NatGatewayIps).toBeDefined();
      expect(outputs.NatGatewayIps.Export?.Name).toBe("prod-NatGatewayIps");
    });

    it("exports environment name", () => {
      // Arrange & Act
      const stack = new ComprehendStack(app, "TestStack", {
        environmentName: "dev",
      });
      const template = Template.fromStack(stack);

      // Assert
      const outputs = template.findOutputs("*");
      expect(outputs.EnvironmentName).toBeDefined();
      expect(outputs.EnvironmentName.Export?.Name).toBe("dev-EnvironmentName");
    });

    it("exports VPC CIDR block", () => {
      // Arrange & Act
      const stack = new ComprehendStack(app, "TestStack", {
        environmentName: "dev",
      });
      const template = Template.fromStack(stack);

      // Assert
      const outputs = template.findOutputs("*");
      expect(outputs.VpcCidr).toBeDefined();
      expect(outputs.VpcCidr.Export?.Name).toBe("dev-VpcCidr");
    });

    it("export names follow naming convention {env}-{OutputName}", () => {
      // Arrange & Act
      const stack = new ComprehendStack(app, "TestStack", {
        environmentName: "staging",
      });
      const template = Template.fromStack(stack);

      // Assert
      const outputs = template.findOutputs("*");
      expect(outputs.VpcId.Export?.Name).toBe("staging-VpcId");
      expect(outputs.PublicSubnetIds.Export?.Name).toBe(
        "staging-PublicSubnetIds",
      );
      expect(outputs.PrivateSubnetIds.Export?.Name).toBe(
        "staging-PrivateSubnetIds",
      );
      expect(outputs.AvailabilityZones.Export?.Name).toBe(
        "staging-AvailabilityZones",
      );
      expect(outputs.NatGatewayIps.Export?.Name).toBe("staging-NatGatewayIps");
      expect(outputs.EnvironmentName.Export?.Name).toBe(
        "staging-EnvironmentName",
      );
      expect(outputs.VpcCidr.Export?.Name).toBe("staging-VpcCidr");
    });
  });
});
