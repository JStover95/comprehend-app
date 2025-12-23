#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import { ComprehendStack } from "../lib/stacks/comprehend-stack";
import { EnvironmentName } from "../lib/types";

const app = new cdk.App();

// Get environment from context (e.g., --context environment=dev)
const environment = app.node.tryGetContext("environment") as
  | EnvironmentName
  | undefined;

// Create stack with environment-specific configuration
const stackName = environment
  ? `Comprehend${environment.charAt(0).toUpperCase() + environment.slice(1)}Stack`
  : "ComprehendDevStack";

new ComprehendStack(app, stackName, {
  environmentName: environment || "dev",

  /* Uncomment to specialize for specific AWS Account and Region */
  // env: {
  //   account: process.env.CDK_DEFAULT_ACCOUNT,
  //   region: process.env.CDK_DEFAULT_REGION
  // },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
