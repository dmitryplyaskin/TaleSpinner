import { resolveEnvPath, resolveMonorepoRoot } from "./path-resolver";

export type ChromaConfig = {
  url: string;
  host: string;
  port: number;
  ssl: boolean;
  tenant: string;
  database: string;
  worldInfoCollection: string;
  dataDir: string;
  timeoutMs: number;
};

const DEFAULT_CHROMA_HOST = "127.0.0.1";
const DEFAULT_CHROMA_PORT = 8000;
const DEFAULT_CHROMA_SSL = false;
const DEFAULT_CHROMA_TENANT = "default_tenant";
const DEFAULT_CHROMA_DATABASE = "default_database";
const DEFAULT_CHROMA_COLLECTION_WORLD_INFO = "world-info";
const DEFAULT_CHROMA_DATA_DIR = "./data/chroma";
const DEFAULT_CHROMA_TIMEOUT_MS = 15000;

type EnvLike = NodeJS.ProcessEnv | Record<string, string | undefined>;

function asNonEmptyString(input: string | undefined, fallback: string): string {
  const value = input?.trim();
  return value && value.length > 0 ? value : fallback;
}

function parsePort(input: string | undefined): number {
  const raw = input?.trim();
  if (!raw) return DEFAULT_CHROMA_PORT;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    return DEFAULT_CHROMA_PORT;
  }
  return parsed;
}

function parseBoolean(input: string | undefined, fallback: boolean): boolean {
  const raw = input?.trim().toLowerCase();
  if (!raw) return fallback;
  if (raw === "true" || raw === "1" || raw === "yes" || raw === "on") {
    return true;
  }
  if (raw === "false" || raw === "0" || raw === "no" || raw === "off") {
    return false;
  }
  return fallback;
}

function parsePositiveInt(input: string | undefined, fallback: number): number {
  const raw = input?.trim();
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function resolveUrl(params: {
  rawUrl: string | undefined;
  host: string;
  port: number;
  ssl: boolean;
}): string {
  const direct = params.rawUrl?.trim();
  if (direct) {
    try {
      if (/^https?:\/\//i.test(direct)) {
        return new URL(direct).toString().replace(/\/$/, "");
      }
      return new URL(`http://${direct}`).toString().replace(/\/$/, "");
    } catch {
      // Fall through to host/port mode.
    }
  }

  const protocol = params.ssl ? "https" : "http";
  return `${protocol}://${params.host}:${params.port}`;
}

let cachedConfig: ChromaConfig | null = null;

export function resolveChromaConfig(
  env: EnvLike = process.env,
  monorepoRoot: string = resolveMonorepoRoot()
): ChromaConfig {
  const host = asNonEmptyString(env.CHROMA_HOST, DEFAULT_CHROMA_HOST);
  const port = parsePort(env.CHROMA_PORT);
  const ssl = parseBoolean(env.CHROMA_SSL, DEFAULT_CHROMA_SSL);
  const tenant = asNonEmptyString(env.CHROMA_TENANT, DEFAULT_CHROMA_TENANT);
  const database = asNonEmptyString(env.CHROMA_DATABASE, DEFAULT_CHROMA_DATABASE);
  const worldInfoCollection = asNonEmptyString(
    env.CHROMA_COLLECTION_WORLD_INFO,
    DEFAULT_CHROMA_COLLECTION_WORLD_INFO
  );
  const dataDir = resolveEnvPath(
    asNonEmptyString(env.CHROMA_DATA_DIR, DEFAULT_CHROMA_DATA_DIR),
    monorepoRoot
  );
  const timeoutMs = parsePositiveInt(env.CHROMA_TIMEOUT_MS, DEFAULT_CHROMA_TIMEOUT_MS);
  const url = resolveUrl({ rawUrl: env.CHROMA_URL, host, port, ssl });

  return {
    url,
    host,
    port,
    ssl,
    tenant,
    database,
    worldInfoCollection,
    dataDir,
    timeoutMs,
  };
}

export function getChromaConfig(): ChromaConfig {
  if (!cachedConfig) {
    cachedConfig = resolveChromaConfig();
  }
  return cachedConfig;
}

export function resetChromaConfigCacheForTests(): void {
  cachedConfig = null;
}
