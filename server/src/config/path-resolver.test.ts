import path from "node:path";

import { describe, expect, test } from "vitest";

import {
  resolveDataDirPath,
  resolveDbPath,
  resolveEnvPath,
} from "./path-resolver";

const MONOREPO_ROOT = path.resolve(path.sep, "tmp", "talespinner-root");

describe("path-resolver", () => {
  test("resolves relative DATA_DIR from monorepo root", () => {
    const resolved = resolveDataDirPath(
      { DATA_DIR: "./custom-data" },
      MONOREPO_ROOT
    );
    expect(resolved).toBe(path.join(MONOREPO_ROOT, "custom-data"));
  });

  test("keeps absolute DATA_DIR as-is", () => {
    const abs = path.resolve(path.sep, "var", "talespinner-data");
    const resolved = resolveDataDirPath({ DATA_DIR: abs }, MONOREPO_ROOT);
    expect(resolved).toBe(path.normalize(abs));
  });

  test("resolves relative DB_PATH from monorepo root", () => {
    const resolved = resolveDbPath(
      { DB_PATH: "./storage/main.sqlite" },
      MONOREPO_ROOT
    );
    expect(resolved).toBe(path.join(MONOREPO_ROOT, "storage", "main.sqlite"));
  });

  test("keeps absolute DB_PATH as-is", () => {
    const abs = path.resolve(path.sep, "db", "prod.sqlite");
    const resolved = resolveDbPath({ DB_PATH: abs }, MONOREPO_ROOT);
    expect(resolved).toBe(path.normalize(abs));
  });

  test("uses legacy TALESPINNER_DATA_DIR when DATA_DIR is absent", () => {
    const resolved = resolveDataDirPath(
      { TALESPINNER_DATA_DIR: "./legacy-data" },
      MONOREPO_ROOT
    );
    expect(resolved).toBe(path.join(MONOREPO_ROOT, "legacy-data"));
  });

  test("falls back to ./data when DATA_DIR and legacy env are absent", () => {
    const resolved = resolveDataDirPath({}, MONOREPO_ROOT);
    expect(resolved).toBe(path.join(MONOREPO_ROOT, "data"));
  });

  test("uses DB_PATH over DATA_DIR when both are provided", () => {
    const resolved = resolveDbPath(
      {
        DATA_DIR: "./data-a",
        DB_PATH: "./data-b/priority.sqlite",
      },
      MONOREPO_ROOT
    );
    expect(resolved).toBe(path.join(MONOREPO_ROOT, "data-b", "priority.sqlite"));
  });

  test("uses DATA_DIR/db.sqlite when DB_PATH is absent", () => {
    const resolved = resolveDbPath(
      {
        DATA_DIR: "./my-data",
      },
      MONOREPO_ROOT
    );
    expect(resolved).toBe(path.join(MONOREPO_ROOT, "my-data", "db.sqlite"));
  });

  test("resolveEnvPath resolves relative and preserves absolute", () => {
    const rel = resolveEnvPath("nested/file.txt", MONOREPO_ROOT);
    expect(rel).toBe(path.join(MONOREPO_ROOT, "nested", "file.txt"));

    const absInput = path.resolve(path.sep, "abs", "file.txt");
    const abs = resolveEnvPath(absInput, MONOREPO_ROOT);
    expect(abs).toBe(path.normalize(absInput));
  });
});

