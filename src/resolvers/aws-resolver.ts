import {
  LightsailClient,
  GetInstancesCommand,
  GetInstancePortStatesCommand,
  GetInstanceStateCommand,
} from '@aws-sdk/client-lightsail';
import { validateProtocol, validateState } from '../utils/validation';
import type { InstanceData, PortInfo, InstanceTag, InstanceState, InstanceBase } from '../types';
import type { IDataResolver } from './interface';

function toPortInfo(ps: {
  fromPort?: number;
  toPort?: number;
  protocol?: string;
  cidrs?: string[];
  ipv6Cidrs?: string[];
  cidrListAliases?: string[];
}): PortInfo {
  return {
    fromPort: ps.fromPort ?? 0,
    toPort: ps.toPort ?? 0,
    protocol: validateProtocol(ps.protocol || 'tcp'),
    cidrs: ps.cidrs || [],
    ipv6Cidrs: ps.ipv6Cidrs || [],
    cidrListAliases: ps.cidrListAliases || [],
    accessType: 'public',
  };
}

function toInstanceState(s: { name?: string; code?: number } | undefined): InstanceState {
  return {
    name: validateState(s?.name || 'unknown'),
    code: s?.code ?? 0,
  };
}

export class AwsResolver implements IDataResolver {
  private client: LightsailClient;

  constructor(region: string) {
    this.client = new LightsailClient({ region });
  }

  async resolve(): Promise<InstanceData[]> {
    const instances = await this.fetchAllInstances();
    return Promise.all(instances.map(inst => this.enrichInstance(inst)));
  }

  private async fetchAllInstances(): Promise<InstanceBase[]> {
    const command = new GetInstancesCommand({});
    const response = await this.client.send(command);
    const rawInstances = response.instances || [];

    return rawInstances.map(inst => {
      const location = inst.location || {};
      const tags: InstanceTag[] = (inst.tags || []).map(t => ({
        key: t.key || '',
        value: t.value || '',
      }));

      return {
        name: inst.name || '',
        region: location.regionName || 'us-east-1',
        publicIp: inst.publicIpAddress || '',
        privateIp: inst.privateIpAddress || '',
        tags,
      };
    });
  }

  private async enrichInstance(base: InstanceBase): Promise<InstanceData> {
    const [portStates, stateResult] = await Promise.all([
      this.fetchPortStates(base.name),
      this.fetchInstanceState(base.name),
    ]);

    return {
      ...base,
      ports: portStates.map(toPortInfo),
      state: toInstanceState(stateResult),
    };
  }

  private async fetchPortStates(instanceName: string) {
    const command = new GetInstancePortStatesCommand({ instanceName });
    const response = await this.client.send(command);
    return response.portStates || [];
  }

  private async fetchInstanceState(instanceName: string) {
    const command = new GetInstanceStateCommand({ instanceName });
    const response = await this.client.send(command);
    return response.state || {};
  }
}
