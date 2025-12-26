import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { VpcConstructProps } from "../../types";

/**
 * VPC Construct for Comprehend Application
 *
 * Creates a VPC with public and private subnets across multiple availability zones.
 * Supports environment-specific configuration including NAT gateway enablement
 * for cost optimization in development environments.
 *
 * Features:
 * - Configurable CIDR block per environment
 * - Public subnets with Internet Gateway
 * - Private subnets with optional NAT Gateways
 * - Multi-AZ deployment for high availability
 * - Environment-specific resource naming and tagging
 */
export class VpcConstruct extends Construct {
  /**
   * The VPC instance
   */
  public readonly vpc: ec2.Vpc;

  /**
   * Public subnets (internet-facing)
   */
  public readonly publicSubnets: ec2.ISubnet[];

  /**
   * Private subnets (internal)
   */
  public readonly privateSubnets: ec2.ISubnet[];

  /**
   * Availability zones used
   */
  public readonly availabilityZones: string[];

  /**
   * NAT gateway Elastic IP addresses (empty if NAT gateways disabled)
   */
  public readonly natGatewayIps: string[];

  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    const { environmentConfig } = props;

    // Calculate subnet configuration
    const maxAzs = environmentConfig.maxAzs;
    const natGateways = environmentConfig.enableNatGateways
      ? (environmentConfig.natGateways ?? maxAzs)
      : 0;

    // Create VPC with custom configuration
    this.vpc = new ec2.Vpc(this, "Vpc", {
      ipAddresses: ec2.IpAddresses.cidr(environmentConfig.vpcCidr),
      maxAzs: maxAzs,
      enableDnsHostnames: true,
      enableDnsSupport: true,

      // Define subnet configuration
      subnetConfiguration: [
        {
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
          mapPublicIpOnLaunch: true,
        },
        {
          name: "Private",
          subnetType: environmentConfig.enableNatGateways
            ? ec2.SubnetType.PRIVATE_WITH_EGRESS
            : ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 23,
        },
      ],

      // NAT gateway configuration
      natGateways: natGateways,

      // Create Internet Gateway
      createInternetGateway: true,
    });

    // Extract subnets
    this.publicSubnets = this.vpc.publicSubnets;
    this.privateSubnets = this.vpc.privateSubnets.concat(
      this.vpc.isolatedSubnets,
    );
    this.availabilityZones = this.vpc.availabilityZones;

    // Extract NAT gateway IPs if enabled
    this.natGatewayIps = [];
    if (environmentConfig.enableNatGateways) {
      // NAT gateway IPs are available through the VPC's NAT gateway provider
      // For now, we'll collect them from the public subnets
      this.publicSubnets.forEach((subnet, index) => {
        if (index < natGateways) {
          // NAT gateway EIP will be created automatically by CDK
          // We'll expose the reference for stack outputs
          const natGatewayId = `NatGateway${index + 1}`;
          this.natGatewayIps.push(natGatewayId);
        }
      });
    }

    // Apply tags to VPC and all subnets
    cdk.Tags.of(this.vpc).add(
      "Name",
      `comprehend-${environmentConfig.name}-vpc`,
    );
    cdk.Tags.of(this.vpc).add(
      "Application",
      environmentConfig.tags.Application,
    );
    cdk.Tags.of(this.vpc).add(
      "Environment",
      environmentConfig.tags.Environment,
    );
    cdk.Tags.of(this.vpc).add("ManagedBy", environmentConfig.tags.ManagedBy);

    // Tag subnets with their type
    this.publicSubnets.forEach((subnet, index) => {
      cdk.Tags.of(subnet).add(
        "Name",
        `comprehend-${environmentConfig.name}-public-${index + 1}`,
      );
      cdk.Tags.of(subnet).add("SubnetType", "Public");
    });

    this.privateSubnets.forEach((subnet, index) => {
      cdk.Tags.of(subnet).add(
        "Name",
        `comprehend-${environmentConfig.name}-private-${index + 1}`,
      );
      cdk.Tags.of(subnet).add("SubnetType", "Private");
    });

    // Add additional custom tags if provided
    Object.entries(environmentConfig.tags).forEach(([key, value]) => {
      if (!["Application", "Environment", "ManagedBy"].includes(key)) {
        cdk.Tags.of(this.vpc).add(key, value);
      }
    });

    // Output information for debugging
    new cdk.CfnOutput(this, "VpcIdOutput", {
      value: this.vpc.vpcId,
      description: `VPC ID for ${environmentConfig.name} environment`,
      exportName: `${environmentConfig.name}-VpcId-Construct`,
    });

    new cdk.CfnOutput(this, "VpcCidrOutput", {
      value: this.vpc.vpcCidrBlock,
      description: `VPC CIDR block for ${environmentConfig.name} environment`,
    });

    new cdk.CfnOutput(this, "AvailabilityZonesOutput", {
      value: this.availabilityZones.join(", "),
      description: `Availability zones used in ${environmentConfig.name} environment`,
    });
  }

  /**
   * Get public subnet IDs as comma-separated string
   */
  public getPublicSubnetIds(): string {
    return this.publicSubnets.map((subnet) => subnet.subnetId).join(",");
  }

  /**
   * Get private subnet IDs as comma-separated string
   */
  public getPrivateSubnetIds(): string {
    return this.privateSubnets.map((subnet) => subnet.subnetId).join(",");
  }

  /**
   * Get availability zones as comma-separated string
   */
  public getAvailabilityZonesString(): string {
    return this.availabilityZones.join(",");
  }

  /**
   * Get NAT gateway IPs as comma-separated string
   * Returns "disabled" when NAT gateways are not enabled
   */
  public getNatGatewayIpsString(): string {
    return this.natGatewayIps.length > 0
      ? this.natGatewayIps.join(",")
      : "disabled";
  }
}
