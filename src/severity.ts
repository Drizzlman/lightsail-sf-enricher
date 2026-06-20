import { BASE_SEVERITY_SCORE, SEVERITY_THRESHOLDS } from './config';
import type { SeverityLabel } from './types';

export function computeFinalSeverity(verdictDeltas: number[]): {
  score: number;
  label: SeverityLabel;
} {
  const totalDelta = verdictDeltas.reduce((sum, d) => sum + d, 0);
  const score = BASE_SEVERITY_SCORE + totalDelta;

  for (const threshold of SEVERITY_THRESHOLDS) {
    if (score >= threshold.min) {
      return { score, label: threshold.label };
    }
  }

  return { score, label: 'LOW' };
}
