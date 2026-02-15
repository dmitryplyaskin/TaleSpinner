import fs from "node:fs";
import path from "node:path";

import dotenv from "dotenv";

import { resolveMonorepoRoot } from "./path-resolver";

type EnvLoadSource = "root" | "server-fallback" | "none";

export type BackendEnvLoadResult = {
  source: EnvLoadSource;
  path: string | null;
};

type WarnLogger = Pick<Console, "warn">;

let loadedOnce = false;
let cachedResult: BackendEnvLoadResult = { source: "none", path: null };

export function resetBackendEnvLoadStateForTests(): void {
  loadedOnce = false;
  cachedResult = { source: "none", path: null };
}

function loadFromFile(params: {
  envFilePath: string;
  processEnv: NodeJS.ProcessEnv;
}): boolean {
  if (!fs.existsSync(params.envFilePath)) {
    return false;
  }

  dotenv.config({
    path: params.envFilePath,
    override: false,
    processEnv: params.processEnv as unknown as Record<string, string>,
    quiet: true,
  });
  return true;
}

export function loadBackendEnvOnce(options?: {
  processEnv?: NodeJS.ProcessEnv;
  logger?: WarnLogger;
  monorepoRoot?: string;
  forceReload?: boolean;
}): BackendEnvLoadResult {
  if (loadedOnce && !options?.forceReload) {
    return cachedResult;
  }

  const processEnv = options?.processEnv ?? process.env;
  const logger = options?.logger ?? console;
  const monorepoRoot =
    options?.monorepoRoot ?? resolveMonorepoRoot();

  const rootEnvPath = path.join(monorepoRoot, ".env");
  const serverEnvPath = path.join(monorepoRoot, "server", ".env");

  if (loadFromFile({ envFilePath: rootEnvPath, processEnv })) {
    cachedResult = { source: "root", path: rootEnvPath };
    loadedOnce = true;
    return cachedResult;
  }

  if (loadFromFile({ envFilePath: serverEnvPath, processEnv })) {
    logger.warn(
      `[env] Deprecated fallback in use: ${serverEnvPath}. Move backend env to ${rootEnvPath}.`
    );
    cachedResult = { source: "server-fallback", path: serverEnvPath };
    loadedOnce = true;
    return cachedResult;
  }

  cachedResult = { source: "none", path: null };
  loadedOnce = true;
  return cachedResult;
}
