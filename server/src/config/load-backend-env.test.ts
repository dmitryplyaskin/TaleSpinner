import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import {
  loadBackendEnvOnce,
  resetBackendEnvLoadStateForTests,
} from "./load-backend-env";

async function createTempMonorepoRoot(prefix: string): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  await fs.mkdir(path.join(root, "server"), { recursive: true });
  await fs.mkdir(path.join(root, "web"), { recursive: true });
  await fs.mkdir(path.join(root, "shared"), { recursive: true });
  await fs.writeFile(path.join(root, "package.json"), '{"name":"TaleSpinner-test"}');
  return root;
}

const tempDirs: string[] = [];

afterEach(async () => {
  resetBackendEnvLoadStateForTests();
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      await fs.rm(dir, { recursive: true, force: true });
    }
  }
});

describe("loadBackendEnvOnce", () => {
  test("loads env from monorepo root first", async () => {
    const root = await createTempMonorepoRoot("ts-env-root-");
    tempDirs.push(root);
    await fs.writeFile(
      path.join(root, ".env"),
      "PORT=6111\nDATA_DIR=./root-data\nTOKENS_MASTER_KEY=root-key\n"
    );
    await fs.writeFile(
      path.join(root, "server", ".env"),
      "PORT=7222\nDATA_DIR=./server-data\nTOKENS_MASTER_KEY=server-key\n"
    );

    const env = {} as NodeJS.ProcessEnv;
    const warnings: string[] = [];
    const result = loadBackendEnvOnce({
      processEnv: env,
      monorepoRoot: root,
      logger: { warn: (msg: string) => warnings.push(msg) },
      forceReload: true,
    });

    expect(result.source).toBe("root");
    expect(result.path).toBe(path.join(root, ".env"));
    expect(env.PORT).toBe("6111");
    expect(env.DATA_DIR).toBe("./root-data");
    expect(warnings).toHaveLength(0);
  });

  test("falls back to server/.env and warns when root env is missing", async () => {
    const root = await createTempMonorepoRoot("ts-env-fallback-");
    tempDirs.push(root);
    await fs.writeFile(
      path.join(root, "server", ".env"),
      "PORT=7333\nDATA_DIR=./server-data\nTOKENS_MASTER_KEY=fallback-key\n"
    );

    const env = {} as NodeJS.ProcessEnv;
    const warnings: string[] = [];
    const result = loadBackendEnvOnce({
      processEnv: env,
      monorepoRoot: root,
      logger: { warn: (msg: string) => warnings.push(msg) },
      forceReload: true,
    });

    expect(result.source).toBe("server-fallback");
    expect(result.path).toBe(path.join(root, "server", ".env"));
    expect(env.PORT).toBe("7333");
    expect(env.DATA_DIR).toBe("./server-data");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("Deprecated fallback");
  });

  test("returns none when no env files are present", async () => {
    const root = await createTempMonorepoRoot("ts-env-none-");
    tempDirs.push(root);

    const env = {} as NodeJS.ProcessEnv;
    const warnings: string[] = [];
    const result = loadBackendEnvOnce({
      processEnv: env,
      monorepoRoot: root,
      logger: { warn: (msg: string) => warnings.push(msg) },
      forceReload: true,
    });

    expect(result.source).toBe("none");
    expect(result.path).toBeNull();
    expect(Object.keys(env)).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });
});
