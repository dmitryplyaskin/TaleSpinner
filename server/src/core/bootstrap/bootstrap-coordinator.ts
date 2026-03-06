import { applyMigrations } from "../../db/apply-migrations";
import { initDb } from "../../db/client";
import { ensureInstructionsSchema } from "../../db/ensure-instructions-schema";
import { ensureOperationBlocksCutover } from "../../db/ensure-operation-blocks-cutover";
import { bootstrapLlm } from "../../services/llm/llm-bootstrap";
import { bootstrapChroma } from "../../services/rag/chroma-rag.service";
import { bootstrapRag } from "../../services/rag.service";
import { logLifecycle, structuredLogger } from "../logging/structured-logger";

import type { Logger } from "../types/common";

type BootstrapStep = {
  key:
    | "db.init"
    | "db.migrations"
    | "db.instructions_schema"
    | "db.operation_blocks_cutover"
    | "llm.bootstrap"
    | "rag.bootstrap"
    | "chroma.bootstrap";
  run: (params: { dbPath?: string }) => Promise<void>;
};

const bootstrapSteps: BootstrapStep[] = [
  {
    key: "db.init",
    run: async ({ dbPath }) => {
      await initDb({ dbPath });
    },
  },
  {
    key: "db.migrations",
    run: async () => {
      await applyMigrations();
    },
  },
  {
    key: "db.instructions_schema",
    run: async () => {
      await ensureInstructionsSchema();
    },
  },
  {
    key: "db.operation_blocks_cutover",
    run: async () => {
      await ensureOperationBlocksCutover();
    },
  },
  {
    key: "llm.bootstrap",
    run: async () => {
      await bootstrapLlm();
    },
  },
  {
    key: "rag.bootstrap",
    run: async () => {
      await bootstrapRag();
    },
  },
  {
    key: "chroma.bootstrap",
    run: async () => {
      await bootstrapChroma();
    },
  },
];

export async function runBackendBootstrap(params: {
  dbPath?: string;
  logger?: Logger;
} = {}): Promise<void> {
  const logger = params.logger ?? structuredLogger;
  logLifecycle(logger, "bootstrap.started");

  for (const step of bootstrapSteps) {
    logLifecycle(logger, "bootstrap.step.started", {
      step: step.key,
    });
    try {
      await step.run({ dbPath: params.dbPath });
      logLifecycle(logger, "bootstrap.step.ready", {
        step: step.key,
      });
    } catch (error) {
      logger.error("bootstrap.step.failed", {
        event: "bootstrap.step.failed",
        step: step.key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  logLifecycle(logger, "bootstrap.ready");
}
