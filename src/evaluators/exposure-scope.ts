import type { InstanceData, SFVerdict } from '../types';
import type { Evaluator } from './base';

export class ExposureScopeEvaluator implements Evaluator {
  readonly name = 'ExposureScope';

  evaluate(instance: InstanceData): SFVerdict {
    const publicPorts = instance.ports.filter(p => p.accessType === 'public');

    const hasWide = publicPorts.some(p => {
      const width = p.toPort - p.fromPort;
      return width >= 100 || p.fromPort === 0;
    });

    const allNarrow = publicPorts.every(p => p.fromPort === p.toPort);

    const portRanges = publicPorts.map(p => ({
      fromPort: p.fromPort,
      toPort: p.toPort,
      protocol: p.protocol,
      width: p.toPort - p.fromPort,
    }));

    if (hasWide) {
      return {
        factorName: this.name,
        appliedLabel: 'WideRange',
        delta: 1,
        evidence: { ports: portRanges },
      };
    }

    if (allNarrow) {
      return {
        factorName: this.name,
        appliedLabel: 'NarrowRange',
        delta: 0,
        evidence: { ports: portRanges },
      };
    }

    return {
      factorName: this.name,
      appliedLabel: 'Mixed',
      delta: 0,
      evidence: { ports: portRanges },
    };
  }
}
