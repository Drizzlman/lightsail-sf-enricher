# Severity Factors — `lightsail_instance_public`

## Base Check

**Prowler rule:** `lightsail_instance_public`
**Base severity:** HIGH
**FAIL condition:** instance has a public IP **and** at least one firewall port with `accessType = "public"`.

Raw check is binary — it cannot distinguish between a production database exposed to the entire internet and a dev web server restricted to an office CIDR. These Severity Factors add that context.

---

## SF Pair 1 — Source CIDR Restriction

| | Name | Delta | Effect |
|---|---|---|---|
| ❌ | **OpenToWorld** | **+2** | Escalates toward CRITICAL |
| ✅ | **RestrictedCIDR** | **-1** | De-escalates toward LOW |

**Check logic:**
- For every public port, inspect `cidrs[]` from `GetInstancePortStates`.
- If **any** port has `"0.0.0.0/0"`, `"::/0"`, or empty `cidrs[]` (default = world): → `OpenToWorld`
- If **all** ports have a specific non-world CIDR: → `RestrictedCIDR`

**Evidence:** per-port `{cidrs: ["0.0.0.0/0"]}` or `{cidrs: ["10.0.0.0/24"]}`

**Read-only API:** `GetInstancePortStates`

**Customer value:** A database on port 3306 open to the world vs the same database restricted to a VPN CIDR — same Prowler result, radically different risk.

---

## SF Pair 2 — Service Sensitivity

| | Name | Delta | Effect |
|---|---|---|---|
| ❌ | **CriticalService** | **+2** | Escalates |
| ✅ | **StandardService** | **-1** | De-escalates |

**Check logic:**
- Map `fromPort` + `protocol` against service registry:
  - **Critical:** 22(SSH), 3389(RDP), 3306(MySQL), 5432(PostgreSQL), 6379(Redis), 27017(MongoDB), 9200(Elasticsearch), 9090(Cockpit), 445(SMB), 23(Telnet), 21(FTP), 25(SMTP), 1433(MSSQL), 8080(proxy/admin)
  - **Standard:** 80(HTTP), 443(HTTPS), 53(DNS)
- Single critical port → `CriticalService`
- Only standard ports → `StandardService`
- Mixed → neutral (0)

**Evidence:** `{fromPort: 22, protocol: "tcp"}` → `"SSH (Remote Admin)"`

**Customer value:** SSH/RDP open to the internet invites continuous brute-force attacks. HTTPS is expected behaviour of a web server. Prevents false panic for legitimate services.

---

## SF Pair 3 — Exposure Scope

| | Name | Delta | Effect |
|---|---|---|---|
| ❌ | **WideRange** | **+1** | Escalates |
| ✅ | **NarrowRange** | **0** | Baseline |

**Check logic:**
- `width = toPort - fromPort`. If **any** port has `width >= 100` or `fromPort == 0`: → `WideRange`
- All ports single (width == 0): → `NarrowRange`

**Evidence:** `{fromPort: 0, toPort: 65535}` → `"All ports (0-65535)"`

**Customer value:** Opening all ports is almost never intentional — usually a misconfiguration. Narrow ports indicate deliberate intent.

---

## SF Pair 4 — Environment Criticality

| | Name | Delta | Effect |
|---|---|---|---|
| ❌ | **Production** | **+1** | Escalates |
| ✅ | **NonProduction** | **-1** | De-escalates |

**Check logic:**
- Check `tags[]` for `key == "Environment"` with value matching `production`/`prod`/`prd` (case-insensitive).
- Match → `Production`. Missing or `dev`/`test`/`staging` → `NonProduction`

**Evidence:** `"tags": [{"key": "Environment", "value": "Production"}]`

**Read-only API:** `GetInstances`

**Customer value:** Public exposure in prod demands immediate action. Same exposure in dev is a learning opportunity.

---

## SF Pair 5 — Instance Liveness

| | Name | Delta | Effect |
|---|---|---|---|
| ❌ | **Running** | **+1** | Escalates |
| ✅ | **Stopped** | **-2** | De-escalates strongly |

**Check logic:**
- Call `GetInstanceState`. `"running"` → `Running`. `"stopped"` → `Stopped`.

**Evidence:** `"state": {"name": "stopped", "code": 80}`

**Read-only API:** `GetInstanceState`

**Customer value:** Stopped instance with open ports is a deferred threat. Running instance is actively reachable.

---

## Scoring

```
score = base(3) + Σ(deltas)

≥ 7  → CRITICAL
4-6  → HIGH
2-3  → MEDIUM
≤ 1  → LOW
```

## Worked Examples

| Scenario | CIDR | Service | Range | Env | State | ∑ | Final |
|---|---|---|---|---|---|---|---|
| prod MySQL world | +2 | +2 | 0 | +1 | +1 | **9** | **CRITICAL** |
| prod WordPress world | +2 | -1 | 0 | +1 | +1 | **6** | **HIGH** |
| dev HTTP office-only | -1 | -1 | 0 | -1 | +1 | **1** | **LOW** |
| bastion SSH stopped | +2 | +2 | 0 | -1 | -2 | **4** | **HIGH** |
| all-ports world | +2 | 0 | +1 | -1 | +1 | **6** | **HIGH** |
