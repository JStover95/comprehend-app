import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ComprehendStack } from '../lib/stacks/comprehend-stack';

describe('CDK App', () => {
  test('ComprehendStack synthesizes successfully', () => {
    const app = new cdk.App();
    
    // Create stack with dev environment
    const stack = new ComprehendStack(app, 'TestStack', {
      environmentName: 'dev',
    });
    
    // Verify stack synthesizes without errors
    const template = Template.fromStack(stack);
    
    // Verify VPC is created
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
    });
    
    // Verify subnets are created
    template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private for dev
  });

  test('ComprehendStack creates correct outputs', () => {
    const app = new cdk.App();
    
    const stack = new ComprehendStack(app, 'TestStack', {
      environmentName: 'dev',
    });
    
    const template = Template.fromStack(stack);
    const outputs = template.findOutputs('*');
    
    // Verify all required outputs exist
    expect(outputs.VpcId).toBeDefined();
    expect(outputs.PublicSubnetIds).toBeDefined();
    expect(outputs.PrivateSubnetIds).toBeDefined();
    expect(outputs.AvailabilityZones).toBeDefined();
    expect(outputs.NatGatewayIps).toBeDefined();
    expect(outputs.NatGatewayIps.Value).toBe("disabled"); // Verify placeholder value
    expect(outputs.EnvironmentName).toBeDefined();
    expect(outputs.VpcCidr).toBeDefined();
  });
});
