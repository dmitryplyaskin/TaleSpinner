import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  applyMigrations: vi.fn(),
  initDb: vi.fn(),
  ensureInstructionsSchema: vi.fn(),
  ensureOperationBlocksCutover: vi.fn(),
  bootstrapLlm: vi.fn(),
  bootstrapRag: vi.fn(),
  bootstrapChroma: vi.fn(),
}));

vi.mock("../../db/apply-migrations", () => ({
  applyMigrations: mocks.applyMigrations,
}));

vi.mock("../../db/client", () => ({
  initDb: mocks.initDb,
}));

vi.mock("../../db/ensure-instructions-schema", () => ({
  ensureInstructionsSchema: mocks.ensureInstructionsSchema,
}));

vi.mock("../../db/ensure-operation-blocks-cutover", () => ({
  ensureOperationBlocksCutover: mocks.ensureOperationBlocksCutover,
}));

vi.mock("../../services/llm/llm-bootstrap", () => ({
  bootstrapLlm: mocks.bootstrapLlm,
}));

vi.mock("../../services/rag.service", () => ({
  bootstrapRag: mocks.bootstrapRag,
}));

vi.mock("../../services/rag/chroma-rag.service", () => ({
  bootstrapChroma: mocks.bootstrapChroma,
}));

import { runBackendBootstrap } from "./bootstrap-coordinator";

describe("runBackendBootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("runs bootstrap steps in order and passes dbPath to db init", async () => {
    const steps: string[] = [];
    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    mocks.initDb.mockImplementation(async ({ dbPath }: { dbPath?: string }) => {
      steps.push(`db.init:${dbPath ?? "missing"}`);
    });
    mocks.applyMigrations.mockImplementation(async () => {
      steps.push("db.migrations");
    });
    mocks.ensureInstructionsSchema.mockImplementation(async () => {
      steps.push("db.instructions_schema");
    });
    mocks.ensureOperationBlocksCutover.mockImplementation(async () => {
      steps.push("db.operation_blocks_cutover");
    });
    mocks.bootstrapLlm.mockImplementation(async () => {
      steps.push("llm.bootstrap");
    });
    mocks.bootstrapRag.mockImplementation(async () => {
      steps.push("rag.bootstrap");
    });
    mocks.bootstrapChroma.mockImplementation(async () => {
      steps.push("chroma.bootstrap");
    });

    await runBackendBootstrap({
      dbPath: "C:/tmp/test.db",
      logger,
    });

    expect(steps).toEqual([
      "db.init:C:/tmp/test.db",
      "db.migrations",
      "db.instructions_schema",
      "db.operation_blocks_cutover",
      "llm.bootstrap",
      "rag.bootstrap",
      "chroma.bootstrap",
    ]);
    expect(logger.info).toHaveBeenCalledWith("bootstrap.started", {
      event: "bootstrap.started",
    });
    expect(logger.info).toHaveBeenCalledWith("bootstrap.ready", {
      event: "bootstrap.ready",
    });
  });

  test("logs and rethrows the failing step", async () => {
    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    const failure = new Error("rag unavailable");

    mocks.initDb.mockResolvedValue(undefined);
    mocks.applyMigrations.mockResolvedValue(undefined);
    mocks.ensureInstructionsSchema.mockResolvedValue(undefined);
    mocks.ensureOperationBlocksCutover.mockResolvedValue(undefined);
    mocks.bootstrapLlm.mockResolvedValue(undefined);
    mocks.bootstrapRag.mockRejectedValue(failure);
    mocks.bootstrapChroma.mockResolvedValue(undefined);

    await expect(runBackendBootstrap({ logger })).rejects.toThrow("rag unavailable");

    expect(logger.error).toHaveBeenCalledWith("bootstrap.step.failed", {
      event: "bootstrap.step.failed",
      step: "rag.bootstrap",
      error: "rag unavailable",
    });
    expect(mocks.bootstrapChroma).not.toHaveBeenCalled();
  });
});
