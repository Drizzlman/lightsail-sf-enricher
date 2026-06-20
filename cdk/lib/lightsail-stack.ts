import * as cdk from 'aws-cdk-lib';
import * as lightsail from 'aws-cdk-lib/aws-lightsail';
import { Construct } from 'constructs';

export class LightsailTestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const az = `${this.region}a`;

    const prodWordpress = new lightsail.CfnInstance(this, 'ProdWordpress', {
      instanceName: 'sf-prod-wordpress',
      availabilityZone: az,
      blueprintId: 'amazon_linux_2',
      bundleId: 'nano_3_0',
      networking: {
        ports: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrs: ['0.0.0.0/0'],
            accessType: 'public',
          },
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrs: ['0.0.0.0/0'],
            accessType: 'public',
          },
        ],
      },
      tags: [
        { key: 'Environment', value: 'Production' },
        { key: 'Project', value: 'SF-POC' },
      ],
    });

    const bastion = new lightsail.CfnInstance(this, 'BastionHost', {
      instanceName: 'sf-bastion-host',
      availabilityZone: az,
      blueprintId: 'amazon_linux_2',
      bundleId: 'nano_3_0',
      networking: {
        ports: [
          {
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            cidrs: ['0.0.0.0/0'],
            accessType: 'public',
          },
        ],
      },
      tags: [{ key: 'Project', value: 'SF-POC' }],
    });

    const devWeb = new lightsail.CfnInstance(this, 'DevWeb', {
      instanceName: 'sf-dev-web',
      availabilityZone: az,
      blueprintId: 'amazon_linux_2',
      bundleId: 'nano_3_0',
      networking: {
        ports: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrs: ['10.0.0.0/24'],
            accessType: 'public',
          },
        ],
      },
      tags: [
        { key: 'Environment', value: 'Dev' },
        { key: 'Project', value: 'SF-POC' },
      ],
    });

    new cdk.CfnOutput(this, 'ProdWordpressName', {
      value: prodWordpress.instanceName,
      description: 'Production WordPress instance (HTTP+HTTPS world-open)',
    });

    new cdk.CfnOutput(this, 'BastionHostName', {
      value: bastion.instanceName,
      description: 'Bastion host (SSH world-open, no tags)',
    });

    new cdk.CfnOutput(this, 'DevWebName', {
      value: devWeb.instanceName,
      description: 'Dev web server (HTTP restricted to office CIDR)',
    });
  }
}
