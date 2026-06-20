#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { LightsailTestStack } from '../lib/lightsail-stack';

const app = new cdk.App();

new LightsailTestStack(app, 'LightsailSFTestStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Test Lightsail instances for Severity Factor enricher POC',
});
