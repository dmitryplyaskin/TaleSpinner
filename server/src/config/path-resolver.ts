import fs from "node:fs";
import path from "node:path";

const DEFAULT_DATA_DIR = "./data";
const DATA_DIR_ENV = "DATA_DIR";
const LEGACY_DATA_DIR_ENV = "TALESPINNER_DATA_DIR";
const DB_PATH_ENV = "DB_PATH";

function hasFile(targetPath: string): boolean {
  return fs.existsSync(targetPath);
}

function hasDir(targetPath: string): boolean {
  return fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory();
}

function isMonorepoRoot(dir: string): boolean {
  return (
    hasFile(path.join(dir, "package.json")) &&
    hasDir(path.join(dir, "server")) &&
    hasDir(path.join(dir, "web")) &&
    hasDir(path.join(dir, "shared"))
  );
}

function walkUpToMonorepoRoot(startDir: string): string | null {
  let current = path.resolve(startDir);
  while (true) {
    if (isMonorepoRoot(current)) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

function normalizeEnvPath(rawPath: string | undefined): string | null {
  const trimmed = rawPath?.trim();
  return trimmed ? trimmed : null;
}

export function resolveMonorepoRoot(options?: {
  cwd?: string;
  moduleDir?: string;
}): string {
  const cwd = options?.cwd ?? process.cwd();
  const moduleDir = options?.moduleDir ?? __dirname;

  const fromCwd = walkUpToMonorepoRoot(cwd);
  if (fromCwd) {
    return fromCwd;
  }

  const fromModuleDir = walkUpToMonorepoRoot(moduleDir);
  if (fromModuleDir) {
    return fromModuleDir;
  }

  return path.resolve(cwd);
}

export function resolveEnvPath(rawPath: string, monorepoRoot: string): string {
  if (path.isAbsolute(rawPath)) {
    return path.normalize(rawPath);
  }
  return path.resolve(monorepoRoot, rawPath);
}

type EnvLike = NodeJS.ProcessEnv | Record<string, string | undefined>;

export function resolveDataDirPath(
  env: EnvLike = process.env,
  monorepoRoot: string = resolveMonorepoRoot()
): string {
  const configured =
    normalizeEnvPath(env[DATA_DIR_ENV]) ??
    normalizeEnvPath(env[LEGACY_DATA_DIR_ENV]) ??
    DEFAULT_DATA_DIR;
  return resolveEnvPath(configured, monorepoRoot);
}

export function resolveDbPath(
  env: EnvLike = process.env,
  monorepoRoot: string = resolveMonorepoRoot()
): string {
  const configuredDbPath = normalizeEnvPath(env[DB_PATH_ENV]);
  if (configuredDbPath) {
    return resolveEnvPath(configuredDbPath, monorepoRoot);
  }
  return path.join(resolveDataDirPath(env, monorepoRoot), "db.sqlite");
}
