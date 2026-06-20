import * as fs from "fs";
import * as path from "path";
import { validateProtocol, validateState } from "../utils/validation";
import type { InstanceData, PortInfo, InstanceTag, InstanceState } from "../types";
import type { IDataResolver } from "./interface";

interface RawPort {
  fromPort: number;
  toPort: number;
  protocol: string;
  cidrs?: string[];
  ipv6Cidrs?: string[];
  cidrListAliases?: string[];
  accessType: string;
}

interface RawTag {
  key: string;
  value: string;
}

interface RawInstance {
  name: string;
  region: string;
  publicIp: string;
  privateIp: string;
  ports: RawPort[];
  tags: RawTag[];
  state: { name: string; code: number };
}

function parsePorts(raw: RawPort[]): PortInfo[] {
  return (raw || []).map((p) => ({
    fromPort: p.fromPort,
    toPort: p.toPort,
    protocol: validateProtocol(p.protocol),
    cidrs: p.cidrs || [],
    ipv6Cidrs: p.ipv6Cidrs || [],
    cidrListAliases: p.cidrListAliases || [],
    accessType: p.accessType === "private" ? "private" : "public",
  }));
}

function parseTags(raw: RawTag[]): InstanceTag[] {
  return (raw || []).map((t) => ({
    key: t.key,
    value: t.value,
  }));
}

function parseState(raw: { name: string; code: number } | undefined): InstanceState {
  return {
    name: validateState(raw?.name || "unknown"),
    code: raw?.code ?? 0,
  };
}

function parseInstance(raw: RawInstance): InstanceData {
  return {
    name: raw.name,
    region: raw.region || "us-east-1",
    publicIp: raw.publicIp || "",
    privateIp: raw.privateIp || "",
    ports: parsePorts(raw.ports),
    tags: parseTags(raw.tags),
    state: parseState(raw.state),
  };
}

export class JsonResolver implements IDataResolver {
  constructor(private filePath: string) {}

  async resolve(): Promise<InstanceData[]> {
    const resolvedPath = path.resolve(this.filePath);
    const content = fs.readFileSync(resolvedPath, "utf-8");
    const raw: RawInstance[] = JSON.parse(content);

    if (!Array.isArray(raw)) {
      throw new Error(`Expected JSON array at ${this.filePath}`);
    }

    return raw.map(parseInstance);
  }
}
