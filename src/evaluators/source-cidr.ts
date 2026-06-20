import { isWorldCidr } from '../utils/validation';
import type { InstanceData, SFVerdict } from '../types';
import type { Evaluator } from './base';

export class SourceCidrEvaluator implements Evaluator {
  readonly name = 'SourceCIDR';

  evaluate(instance: InstanceData): SFVerdict {
    const publicPorts = instance.ports.filter(p => p.accessType === 'public');

    const allCidrs = publicPorts.flatMap(p => [...p.cidrs, ...p.ipv6Cidrs]);

    const effectiveCidrs = allCidrs.length > 0 ? allCidrs : [''];

    const hasWorld = effectiveCidrs.some(isWorldCidr);

    const allRestricted = publicPorts.length > 0 && effectiveCidrs.every(c => !isWorldCidr(c));

    if (allRestricted) {
      return {
        factorName: this.name,
        appliedLabel: 'RestrictedCIDR',
        delta: -1,
        evidence: {
          cidrs: effectiveCidrs,
          summary: 'All public ports have non-world CIDR restrictions',
        },
      };
    }

    if (hasWorld) {
      return {
        factorName: this.name,
        appliedLabel: 'OpenToWorld',
        delta: 2,
        evidence: {
          cidrs: effectiveCidrs,
          summary: 'At least one public port is open to 0.0.0.0/0 or ::/0',
        },
      };
    }

    return {
      factorName: this.name,
      appliedLabel: 'Mixed',
      delta: 0,
      evidence: {
        cidrs: effectiveCidrs,
        summary: 'Mixed CIDR restrictions',
      },
    };
  }
}
