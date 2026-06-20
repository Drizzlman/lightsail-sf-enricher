# lightsail-sf-enricher

Severity Factor enricher for Prowler check `lightsail_instance_public`.

Takes FAIL findings, enriches them with 5 Severity Factors (SourceCIDR,
ServiceSensitivity, ExposureScope, EnvironmentTag, InstanceState), and outputs
a per-resource final severity: LOW / MEDIUM / HIGH / CRITICAL.

## Project structure

```
lightsail-sf-enricher/
├── README.md
├── package.json              # Main project deps (ts-node, typescript, @aws-sdk)
├── tsconfig.json
├── docs/
│   └── severity-factors.md   # SF design document
├── src/
│   ├── index.ts              # CLI entry point
│   ├── types.ts              # Domain types
│   ├── config.ts             # Port->service map, thresholds
│   ├── severity.ts           # Score->severity calculator
│   ├── evaluators/           # 5 evaluators, one per SF
│   ├── resolvers/            # IDataResolver (JSON offline + AWS real)
│   └── output/
├── data/
│   └── instances.json        # 5 mock instances covering all SFs
└── cdk/
    ├── package.json          # CDK deps
    ├── cdk.json
    ├── bin/app.ts
    └── lib/lightsail-stack.ts # 3 Lightsail instances
```

## Quick start (offline, no AWS)

```bash
npm install
npx ts-node src/index.ts
# or explicitly:
npx ts-node src/index.ts --resolver json --input ./data/instances.json
```

## Verify results (no AWS account needed)

Run the command above. You should see JSON output with:

| Instance | Expected severity | Why |
|---|---|---|
| `prod-wordpress` | **HIGH** | HTTP/HTTPS world-open, prod tag — expected web service |
| `prod-db-server` | **CRITICAL** | MySQL:3306 world-open + SSH + prod + running |
| `dev-web` | **LOW** | HTTP restricted to 10.0.0.0/24, dev tag |
| `bastion-host` | **HIGH** | SSH world-open but stopped — risk deferred |
| `all-ports` | **HIGH** | All ports (0-65535) world-open, no env tag |

### To verify SF logic individually

Check each evaluator's `appliedLabel` and `delta` in the JSON output:

| SF pair | Look for | Expected effect |
|---|---|---|
| SourceCIDR | `"appliedLabel": "OpenToWorld"` | delta +2 |
| SourceCIDR | `"appliedLabel": "RestrictedCIDR"` | delta -1 |
| ServiceSensitivity | `"appliedLabel": "CriticalService"` | delta +2 |
| ServiceSensitivity | `"appliedLabel": "StandardService"` | delta -1 |
| ExposureScope | `"appliedLabel": "WideRange"` | delta +1 |
| EnvironmentTag | `"appliedLabel": "Production"` | delta +1 |
| InstanceState | `"appliedLabel": "Stopped"` | delta -2 |

Score = base(3) + sum(all deltas). Thresholds: ≥7 CRITICAL, 4-6 HIGH, 2-3 MEDIUM, ≤1 LOW.

### Run typecheck

```bash
npm run typecheck
```

## Run with real AWS (optional)

Requires AWS credentials configured (via env vars, ~/.aws/credentials, or IAM role).

```bash
npx ts-node src/index.ts --resolver aws --region us-east-1
```

The resolver calls three read-only APIs:
- `GetInstances` — instance list and metadata
- `GetInstancePortStates` — per-port CIDR info
- `GetInstanceState` — running/stopped status

## CDK deploy / destroy

The `cdk/` directory contains a stack that deploys 3 Lightsail instances
exercising different SF combinations.

```bash
cd cdk
npm install

# Deploy (requires AWS account)
npx cdk deploy

# Destroy
npx cdk destroy
```

### Instances created

| Instance name | Ports | CIDR | Tags | Exercises |
|---|---|---|---|---|
| `sf-prod-wordpress` | 80, 443 | 0.0.0.0/0 | Env=Production | World + Standard + Prod + Running → HIGH |
| `sf-bastion-host` | 22 | 0.0.0.0/0 | (none) | World + Critical + NoTag → HIGH |
| `sf-dev-web` | 80 | 10.0.0.0/24 | Env=Dev | Restricted + Standard + Dev → LOW |
