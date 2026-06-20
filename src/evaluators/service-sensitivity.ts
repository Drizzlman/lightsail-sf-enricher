import { CRITICAL_SERVICE_PORTS, STANDARD_SERVICE_PORTS, SERVICE_REGISTRY } from "../config";
import type { InstanceData, SFVerdict, PortInfo } from "../types";
import type { Evaluator } from "./base";

type PortCategory = "critical" | "standard" | "unknown";

function classifyPort(port: number): PortCategory {
  const entry = SERVICE_REGISTRY[port];
  if (!entry) return "unknown";
  return entry.critical ? "critical" : "standard";
}

function toPortService(p: PortInfo) {
  const entry = SERVICE_REGISTRY[p.fromPort];
  return {
    port: p.fromPort,
    protocol: p.protocol,
    service: entry ? entry.name : "Unknown",
    category: classifyPort(p.fromPort),
  };
}

export class ServiceSensitivityEvaluator implements Evaluator {
  readonly name = "ServiceSensitivity";

  evaluate(instance: InstanceData): SFVerdict {
    const publicPorts = instance.ports.filter((p) => p.accessType === "public");

    const hasCritical = publicPorts.some((p) => CRITICAL_SERVICE_PORTS.has(p.fromPort));
    const allStandard = publicPorts.every((p) => STANDARD_SERVICE_PORTS.has(p.fromPort));

    const portServices = publicPorts.map(toPortService);

    if (hasCritical) {
      return {
        factorName: this.name,
        appliedLabel: "CriticalService",
        delta: 2,
        evidence: { ports: portServices },
      };
    }

    if (allStandard) {
      return {
        factorName: this.name,
        appliedLabel: "StandardService",
        delta: -1,
        evidence: { ports: portServices },
      };
    }

    return {
      factorName: this.name,
      appliedLabel: "Mixed",
      delta: 0,
      evidence: { ports: portServices },
    };
  }
}
