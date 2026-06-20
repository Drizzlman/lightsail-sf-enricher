import type { SeverityLabel } from './types';

interface ServiceEntry {
  name: string;
  critical: boolean;
}

export const SERVICE_REGISTRY: Record<number, ServiceEntry> = {
  22: { name: 'SSH', critical: true },
  23: { name: 'Telnet', critical: true },
  21: { name: 'FTP', critical: true },
  25: { name: 'SMTP', critical: true },
  135: { name: 'RPC', critical: true },
  139: { name: 'NetBIOS', critical: true },
  445: { name: 'SMB', critical: true },
  1433: { name: 'MSSQL', critical: true },
  1521: { name: 'Oracle DB', critical: true },
  3306: { name: 'MySQL', critical: true },
  3389: { name: 'RDP', critical: true },
  5432: { name: 'PostgreSQL', critical: true },
  5672: { name: 'RabbitMQ', critical: true },
  6379: { name: 'Redis', critical: true },
  8080: { name: 'HTTP-Proxy', critical: true },
  8443: { name: 'HTTPS-Alt', critical: true },
  9090: { name: 'Cockpit', critical: true },
  9200: { name: 'Elasticsearch', critical: true },
  11211: { name: 'Memcached', critical: true },
  27017: { name: 'MongoDB', critical: true },
  53: { name: 'DNS', critical: false },
  80: { name: 'HTTP', critical: false },
  443: { name: 'HTTPS', critical: false },
};

export const CRITICAL_SERVICE_PORTS = new Set(
  Object.entries(SERVICE_REGISTRY)
    .filter(([, v]) => v.critical)
    .map(([k]) => Number(k))
);

export const STANDARD_SERVICE_PORTS = new Set(
  Object.entries(SERVICE_REGISTRY)
    .filter(([, v]) => !v.critical)
    .map(([k]) => Number(k))
);

export type SeverityThreshold = { min: number; label: SeverityLabel };

export const BASE_SEVERITY_SCORE = 3;

export const SEVERITY_THRESHOLDS: SeverityThreshold[] = [
  { min: 7, label: 'CRITICAL' },
  { min: 4, label: 'HIGH' },
  { min: 2, label: 'MEDIUM' },
  { min: -Infinity, label: 'LOW' },
];

export const PRODUCTION_ENV_VALUES = new Set(['production', 'prod', 'prd']);

export const WORLD_CIDR_VALUES = new Set(['0.0.0.0/0', '::/0']);
