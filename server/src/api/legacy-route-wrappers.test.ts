import { afterEach, describe, expect, test } from "vitest";

import { createApp } from "../app";

import type { Server } from "node:http";

async function requestJson(path: string): Promise<Response> {
  const app = createApp();
  const server = await new Promise<Server>((resolve) => {
    const started = app.listen(0, () => resolve(started));
  });

  try {
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Failed to resolve test server address");
    }
    return await fetch(`http://127.0.0.1:${address.port}${path}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
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
