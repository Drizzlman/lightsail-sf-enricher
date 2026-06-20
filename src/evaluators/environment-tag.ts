import { PRODUCTION_ENV_VALUES } from "../config";
import type { InstanceData, SFVerdict } from "../types";
import type { Evaluator } from "./base";

export class EnvironmentTagEvaluator implements Evaluator {
  readonly name = "EnvironmentTag";

  evaluate(instance: InstanceData): SFVerdict {
    const envTag = instance.tags.find(
      (t) => t.key.toLowerCase() === "environment"
    );

    if (!envTag) {
      return {
        factorName: this.name,
        appliedLabel: "NonProduction",
        delta: -1,
        evidence: {
          tags: instance.tags,
          summary: "No Environment tag found — assumed non-production",
        },
      };
    }

    const isProd = PRODUCTION_ENV_VALUES.has(envTag.value.toLowerCase());

    if (isProd) {
      return {
        factorName: this.name,
        appliedLabel: "Production",
        delta: 1,
        evidence: {
          tags: instance.tags,
          matchedTag: envTag,
        },
      };
    }

    return {
      factorName: this.name,
      appliedLabel: "NonProduction",
      delta: -1,
      evidence: {
        tags: instance.tags,
        matchedTag: envTag,
      },
    };
  }
}
