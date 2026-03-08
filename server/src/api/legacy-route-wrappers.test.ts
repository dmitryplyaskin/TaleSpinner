import fs from "node:fs/promises";
import os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, test } from "vitest";

import { bootstrapApp, createApp } from "../app";
import { resetDbForTests } from "../db/client";

import type { Server } from "node:http";

async function requestJson(requestPath: string): Promise<Response> {
  resetDbForTests();
  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "talespinner-legacy-routes-")
  );
  const dbPath = path.join(tempDir, "db.sqlite");
  await bootstrapApp({ dbPath });
  const app = createApp();
  const server = await new Promise<Server>((resolve) => {
    const started = app.listen(0, () => resolve(started));
  });

  try {
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Failed to resolve test server address");
    }
    return await fetch(`http://127.0.0.1:${address.port}${requestPath}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    resetDbForTests();
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

describe("legacy api wrappers", () => {
  afterEach(() => {
    // no-op: each request helper closes its own temporary server
  });

  test("GET /api/settings stays reachable through api registry", async () => {
    const response = await requestJson("/api/settings");

    expect(response.status).toBe(200);
  });

  test("GET /api/app-settings stays reachable through api registry", async () => {
    const response = await requestJson("/api/app-settings");

    expect(response.status).toBe(200);
  });
});
