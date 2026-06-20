import { SourceCidrEvaluator } from './evaluators/source-cidr';
import { ServiceSensitivityEvaluator } from './evaluators/service-sensitivity';
import { ExposureScopeEvaluator } from './evaluators/exposure-scope';
import { EnvironmentTagEvaluator } from './evaluators/environment-tag';
import { InstanceStateEvaluator } from './evaluators/instance-state';
import { JsonResolver } from './resolvers/json-resolver';
import { AwsResolver } from './resolvers/aws-resolver';
import { computeFinalSeverity } from './severity';
import { formatOutput, printJSON } from './output/formatter';
import type { IDataResolver } from './resolvers/interface';
import type { Evaluator } from './evaluators/base';
import type { InstanceData, Finding, EnricherOutput } from './types';

function parseArgs(): { resolver: 'json' | 'aws'; region?: string; input?: string } {
  const args = process.argv.slice(2);
  let resolver: 'json' | 'aws' = 'json';
  let region: string | undefined;
  let input: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    if (arg === '--resolver' || arg === '-r') {
      const val = args[++i];
      if (val === 'aws') resolver = 'aws';
      else if (val === 'json') resolver = 'json';
      else {
        console.error(`Unknown resolver '${val}'. Use 'json' or 'aws'.`);
        process.exit(1);
      }
    } else if (arg === '--region') {
      region = args[++i];
    } else if (arg === '--input' || arg === '-i') {
      input = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return { resolver, region, input };
}

function printHelp(): void {
  console.log(`
lightsail-sf-enricher — enrich Prowler FAIL findings with Severity Factors
 
Usage:
  npm start -- --resolver json --input ./data/instances.json
  npm start -- --resolver aws --region us-east-1

Options:
  --resolver, -r   Data source: 'json' (offline) or 'aws' (live)   [default: json]
  --input, -i      Path to JSON file (json resolver only)           [default: ./data/instances.json]
  --region         AWS region (aws resolver only)
  --help, -h       Show this help
`);
}

function createResolver(args: ReturnType<typeof parseArgs>): IDataResolver {
  if (args.resolver === 'json') {
    const inputPath = args.input || './data/instances.json';
    return new JsonResolver(inputPath);
  }

  if (!args.region) {
    console.error('--region is required for aws resolver');
    process.exit(1);
  }

  return new AwsResolver(args.region);
}

function createEvaluators(): Evaluator[] {
  return [
    new SourceCidrEvaluator(),
    new ServiceSensitivityEvaluator(),
    new ExposureScopeEvaluator(),
    new EnvironmentTagEvaluator(),
    new InstanceStateEvaluator(),
  ];
}

function filterFailedInstances(instances: InstanceData[]): InstanceData[] {
  return instances.filter(inst => {
    const hasPublicIp = inst.publicIp.length > 0;
    const hasPublicPort = inst.ports.some(p => p.accessType === 'public');
    return hasPublicIp && hasPublicPort;
  });
}

function evaluateInstance(inst: InstanceData, evaluators: Evaluator[]): Finding {
  const verdicts = evaluators.map(e => e.evaluate(inst));
  const deltas = verdicts.map(v => v.delta);
  const { score, label } = computeFinalSeverity(deltas);

  return {
    instanceName: inst.name,
    region: inst.region,
    publicIp: inst.publicIp,
    baseSeverity: 'HIGH' as const,
    finalScore: score,
    finalSeverity: label,
    verdicts,
    rawPorts: inst.ports,
    rawTags: inst.tags,
    rawState: inst.state,
  };
}

async function runPipeline(
  resolver: IDataResolver,
  evaluators: Evaluator[]
): Promise<EnricherOutput> {
  const instances = await resolver.resolve();
  const failed = filterFailedInstances(instances);
  const findings = failed.map(inst => evaluateInstance(inst, evaluators));
  return formatOutput(findings, instances.length);
}

async function main(): Promise<void> {
  const args = parseArgs();
  const resolver = createResolver(args);
  const evaluators = createEvaluators();
  const output = await runPipeline(resolver, evaluators);
  printJSON(output);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
