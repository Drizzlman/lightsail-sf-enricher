import type { Finding, EnricherOutput, SeverityLabel } from '../types';

export function formatOutput(findings: Finding[], totalInstances: number): EnricherOutput {
  const bySeverity: Record<SeverityLabel, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };

  for (const f of findings) {
    bySeverity[f.finalSeverity]++;
  }

  return {
    summary: {
      totalInstances,
      failedInstances: findings.length,
      passedInstances: totalInstances - findings.length,
      bySeverity,
    },
    findings,
  };
}

export function printJSON(output: EnricherOutput): void {
  console.log(JSON.stringify(output, null, 2));
}
