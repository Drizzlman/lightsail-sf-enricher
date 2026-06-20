import type { InstanceData, SFVerdict } from "../types";
import type { Evaluator } from "./base";

const STATE_VERDICTS: Record<string, { label: string; delta: number; summary: string }> = {
  running: { label: "Running", delta: 1, summary: "Instance is running — actively reachable" },
  stopped: { label: "Stopped", delta: -2, summary: "Instance is stopped — not actively reachable" },
};

export class InstanceStateEvaluator implements Evaluator {
  readonly name = "InstanceState";

  evaluate(instance: InstanceData): SFVerdict {
    const state = instance.state.name;
    const verdict = STATE_VERDICTS[state];

    if (verdict) {
      return {
        factorName: this.name,
        appliedLabel: verdict.label,
        delta: verdict.delta,
        evidence: {
          state: instance.state,
          summary: verdict.summary,
        },
      };
    }

    return {
      factorName: this.name,
      appliedLabel: "Unknown",
      delta: 0,
      evidence: {
        state: instance.state,
        summary: `Instance state is '${state}' — risk unclear`,
      },
    };
  }
}
