import type { InstanceData, SFVerdict } from "../types";

export interface Evaluator {
  readonly name: string;
  evaluate(instance: InstanceData): SFVerdict;
}
