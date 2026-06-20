import { WORLD_CIDR_VALUES } from '../config';
import type { PortProtocol, InstanceStateName } from '../types';

const VALID_PROTOCOLS = new Set(['tcp', 'udp', 'icmp', 'icmpv6', 'all']);
const VALID_STATES = new Set(['running', 'stopped', 'pending']);

export function validateProtocol(p: string): PortProtocol {
  if (VALID_PROTOCOLS.has(p)) return p as PortProtocol;
  return 'tcp';
}

export function validateState(s: string): InstanceStateName {
  if (VALID_STATES.has(s)) return s as InstanceStateName;
  return 'unknown';
}

export function isWorldCidr(cidr: string): boolean {
  return cidr === '' || WORLD_CIDR_VALUES.has(cidr);
}
