import path from "node:path";

import { describe, expect, test } from "vitest";

import { resolveChromaConfig } from "./chroma-config";

const MONOREPO_ROOT = path.resolve(path.sep, "tmp", "talespinner-root");

describe("chroma-config", () => {
  test("uses defaults when env is missing", () => {
    const resolved = resolveChromaConfig({}, MONOREPO_ROOT);

    expect(resolved.url).toBe("http://127.0.0.1:8000");
    expect(resolved.host).toBe("127.0.0.1");
    expect(resolved.port).toBe(8000);
    expect(resolved.ssl).toBe(false);
    expect(resolved.tenant).toBe("default_tenant");
    expect(resolved.database).toBe("default_database");
    expect(resolved.worldInfoCollection).toBe("world-info");
    expect(resolved.timeoutMs).toBe(15000);
    expect(resolved.dataDir).toBe(path.join(MONOREPO_ROOT, "data", "chroma"));
  });

  test("uses CHROMA_URL when valid and trims trailing slash", () => {
    const resolved = resolveChromaConfig(
      {
        CHROMA_URL: "https://chroma.example.com:443/",
        CHROMA_HOST: "ignored-host",
        CHROMA_PORT: "9999",
      },
      MONOREPO_ROOT
    );

    expect(resolved.url).toBe("https://chroma.example.com");
  });

  test("falls back to host/port when CHROMA_URL is invalid", () => {
    const resolved = resolveChromaConfig(
      {
        CHROMA_URL: "://bad-url",
        CHROMA_HOST: "localhost",
        CHROMA_PORT: "8011",
      },
      MONOREPO_ROOT
    );

    expect(resolved.url).toBe("http://localhost:8011");
  });

  test("supports ssl host/port mode and valid numeric timeout", () => {
    const resolved = resolveChromaConfig(
      {
        CHROMA_HOST: "chroma.local",
        CHROMA_PORT: "8443",
        CHROMA_SSL: "true",
        CHROMA_TIMEOUT_MS: "12000",
      },
      MONOREPO_ROOT
    );

    expect(resolved.url).toBe("https://chroma.local:8443");
    expect(resolved.timeoutMs).toBe(12000);
  });

  test("uses safe fallbacks for invalid port/timeout/bool", () => {
    const resolved = resolveChromaConfig(
      {
        CHROMA_PORT: "0",
        CHROMA_TIMEOUT_MS: "-1",
        CHROMA_SSL: "not-a-bool",
        CHROMA_COLLECTION_WORLD_INFO: " ",
      },
      MONOREPO_ROOT
    );

    expect(resolved.port).toBe(8000);
    expect(resolved.timeoutMs).toBe(15000);
    expect(resolved.ssl).toBe(false);
    expect(resolved.worldInfoCollection).toBe("world-info");
  });

  test("resolves CHROMA_DATA_DIR as absolute from monorepo root", () => {
    const resolved = resolveChromaConfig(
      {
        CHROMA_DATA_DIR: "./storage/chroma",
      },
      MONOREPO_ROOT
    );

    expect(resolved.dataDir).toBe(path.join(MONOREPO_ROOT, "storage", "chroma"));
  });
});
