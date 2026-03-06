import path from "node:path";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { eq } from "drizzle-orm";

import { applyMigrations } from "../../../db/apply-migrations";
import { initDb, resetDbForTests } from "../../../db/client";
import { chatBranches, chats, entityProfiles, llmGenerations } from "../../../db/schema";
import { createTempDataDir, removeTempDataDir } from "../../../e2e/helpers/tmp-dir";
import * as generationsRepository from "../../chat-core/generations-repository";
import { createGeneration } from "../../chat-core/generations-repository";

import { finalizeRun } from "./finalize-run";

import type { RunContext, RunResult } from "../contracts";

let tempDir: string;
let dbPath: string;

async function seedChatFixture(): Promise<{ chatId: string; branchId: string }> {
  const db = await initDb();
  const ts = new Date("2026-03-06T12:30:00.000Z");

  db.insert(entityProfiles)
    .values({
      id: "entity-1",
      ownerId: "global",
      name: "Entity",
      kind: "CharSpec",
      specJson: "{}",
      metaJson: null,
      isFavorite: false,
      createdAt: ts,
      updatedAt: ts,
      avatarAssetId: null,
    })
    .run();

  db.insert(chats)
    .values({
      id: "chat-1",
      ownerId: "global",
      entityProfileId: "entity-1",
      title: "Chat",
      activeBranchId: "branch-1",
      instructionId: null,
      status: "active",
      createdAt: ts,
      updatedAt: ts,
      lastMessageAt: null,
      lastMessagePreview: null,
      version: 0,
      metaJson: null,
      originChatId: null,
      originBranchId: null,
      originMessageId: null,
    })
    .run();

  db.insert(chatBranches)
    .values({
      id: "branch-1",
      ownerId: "global",
      chatId: "chat-1",
      title: "main",
      createdAt: ts,
      updatedAt: ts,
      parentBranchId: null,
      forkedFromMessageId: null,
      forkedFromVariantId: null,
      metaJson: null,
      currentTurn: 0,
    })
    .run();

  return {
    chatId: "chat-1",
    branchId: "branch-1",
  };
}

function makeContext(generationId: string, chatId: string, branchId: string): RunContext {
  return {
    ownerId: "global",
    runId: generationId,
    generationId,
    trigger: "generate",
    chatId,
    branchId,
    entityProfileId: "entity-1",
    profileSnapshot: null,
    runtimeInfo: {
      providerId: "openrouter",
      model: "m",
    },
    sessionKey: null,
    historyLimit: 50,
    startedAt: 1_700_000_000_000,
  };
}

function makeResult(status: RunResult["status"]): RunResult {
  return {
    runId: "gen-1",
    generationId: "gen-1",
    status,
    failedType: status === "failed" ? "before_barrier" : null,
    phaseReports: [
      {
        phase: "prepare_run_context",
        status: "done",
        startedAt: 1,
        finishedAt: 2,
      },
    ],
    commitReportsByHook: {
      before_main_llm: {
        hook: "before_main_llm",
        status: "done",
        effects: [],
      },
    },
    promptHash: null,
    promptSnapshot: null,
    assistantText: "",
    errorMessage: null,
  };
}

beforeEach(async () => {
  tempDir = await createTempDataDir("talespinner-finalize-run-");
  dbPath = path.join(tempDir, "test.db");
  await initDb({ dbPath });
  await applyMigrations();
});

afterEach(async () => {
  vi.restoreAllMocks();
  resetDbForTests();
  await removeTempDataDir(tempDir);
});

describe("finalizeRun transaction behavior", () => {
  test("rolls back run reports when finishGeneration fails", async () => {
    const fixture = await seedChatFixture();
    const generation = await createGeneration({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
      messageId: null,
      variantId: null,
      providerId: "openrouter",
      model: "m",
      settings: {},
    });

    const spy = vi
      .spyOn(generationsRepository, "finishGeneration")
      .mockImplementation((((_params: {
        id: string;
        status: "streaming" | "done" | "aborted" | "error";
        error?: string | null;
        executor?: unknown;
      }) => {
        throw new Error("forced finishGeneration failure");
      }) as unknown) as typeof generationsRepository.finishGeneration);

    await expect(
      finalizeRun({
        context: makeContext(generation.id, fixture.chatId, fixture.branchId),
        result: makeResult("done"),
      })
    ).rejects.toThrow("forced finishGeneration failure");

    spy.mockRestore();

    const db = await initDb();
    const rows = await db
      .select({
        status: llmGenerations.status,
        phaseReportJson: llmGenerations.phaseReportJson,
        commitReportJson: llmGenerations.commitReportJson,
        finishedAt: llmGenerations.finishedAt,
      })
      .from(llmGenerations)
      .where(eq(llmGenerations.id, generation.id))
      .limit(1);

    expect(rows[0]).toMatchObject({
      status: "streaming",
      phaseReportJson: null,
      commitReportJson: null,
      finishedAt: null,
    });
  });
});
