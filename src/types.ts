export type PortProtocol = 'tcp' | 'udp' | 'icmp' | 'icmpv6' | 'all';

export interface PortInfo {
  fromPort: number;
  toPort: number;
  protocol: PortProtocol;
  cidrs: string[];
  ipv6Cidrs: string[];
  cidrListAliases: string[];
  accessType: 'public' | 'private';
}

export interface InstanceTag {
  key: string;
  value: string;
}

export type InstanceStateName = 'running' | 'stopped' | 'pending' | 'unknown';

export interface InstanceState {
  name: InstanceStateName;
  code: number;
}

export interface InstanceBase {
  name: string;
  region: string;
  publicIp: string;
  privateIp: string;
  tags: InstanceTag[];
}

export interface InstanceData extends InstanceBase {
  ports: PortInfo[];
  state: InstanceState;
}

export type SeverityLabel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface SFVerdict {
  factorName: string;
  appliedLabel: string;
  delta: number;
  evidence: Record<string, unknown>;
}

export interface Finding {
  instanceName: string;
  region: string;
  publicIp: string;
  baseSeverity: 'HIGH';
  finalScore: number;
  finalSeverity: SeverityLabel;
  verdicts: SFVerdict[];
  rawPorts: PortInfo[];
  rawTags: InstanceTag[];
  rawState: InstanceState;
}

export interface EnricherOutput {
  summary: {
    totalInstances: number;
    failedInstances: number;
    passedInstances: number;
    bySeverity: Record<SeverityLabel, number>;
  };
  findings: Finding[];
}
