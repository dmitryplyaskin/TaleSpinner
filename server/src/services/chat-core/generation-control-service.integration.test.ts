import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { eq } from "drizzle-orm";

import { applyMigrations } from "../../db/apply-migrations";
import { initDb, resetDbForTests } from "../../db/client";
import {
  chatBranches,
  chats,
  entityProfiles,
  generationRuntimeControl,
} from "../../db/schema";
import { createGeneration } from "./generations-repository";
import { getGenerationControlByGenerationId, markGenerationAbortRequested } from "./generation-control-repository";
import { GenerationControlService } from "./generation-control-service";

async function waitFor(
  predicate: () => boolean,
  timeoutMs = 1_000,
  intervalMs = 20
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error("Timed out waiting for condition");
}

describe("GenerationControlService", () => {
  let tempDir = "";
  const prevDataDir = process.env.DATA_DIR;
  const prevLegacyDataDir = process.env.TALESPINNER_DATA_DIR;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "talespinner-generation-control-"));
    process.env.DATA_DIR = tempDir;
    delete process.env.TALESPINNER_DATA_DIR;
    resetDbForTests();
    await initDb();
    await applyMigrations();

    const db = await initDb();
    const now = new Date("2026-03-06T16:00:00.000Z");
    await db.insert(entityProfiles).values({
      id: "entity-1",
      ownerId: "global",
      name: "Entity",
      kind: "CharSpec",
      specJson: "{}",
      metaJson: null,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
      avatarAssetId: null,
    });
    await db.insert(chats).values({
      id: "chat-1",
      ownerId: "global",
      entityProfileId: "entity-1",
      title: "Chat",
      activeBranchId: "branch-1",
      instructionId: null,
      status: "active",
      createdAt: now,
      updatedAt: now,
      lastMessageAt: null,
      lastMessagePreview: null,
      version: 0,
      metaJson: null,
      originChatId: null,
      originBranchId: null,
      originMessageId: null,
    });
    await db.insert(chatBranches).values({
      id: "branch-1",
      ownerId: "global",
      chatId: "chat-1",
      title: "Main",
      createdAt: now,
      updatedAt: now,
      parentBranchId: null,
      forkedFromMessageId: null,
      forkedFromVariantId: null,
      metaJson: null,
      currentTurn: 0,
    });
  });

  afterEach(async () => {
    resetDbForTests();
    if (typeof prevDataDir === "string") process.env.DATA_DIR = prevDataDir;
    else delete process.env.DATA_DIR;
    if (typeof prevLegacyDataDir === "string") process.env.TALESPINNER_DATA_DIR = prevLegacyDataDir;
    else delete process.env.TALESPINNER_DATA_DIR;
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("acquire creates a lease row and release clears it", async () => {
    const generation = await createGeneration({
      ownerId: "global",
      chatId: "chat-1",
      branchId: "branch-1",
      messageId: null,
      variantId: null,
      providerId: "openrouter",
      model: "model-1",
      settings: {},
    });
    const abortController = new AbortController();

    const lease = await GenerationControlService.acquire({
      generationId: generation.id,
      runInstanceId: "run-1",
      abortController,
      pollMs: 50,
    });

    const record = await getGenerationControlByGenerationId(generation.id);
    expect(record).not.toBeNull();
    expect(record?.runInstanceId).toBe("run-1");

    await lease.release({ status: "done" });

    const cleared = await getGenerationControlByGenerationId(generation.id);
    expect(cleared).toBeNull();
  });

  test("requestAbort marks the active lease and aborts the local controller", async () => {
    const generation = await createGeneration({
      ownerId: "global",
      chatId: "chat-1",
      branchId: "branch-1",
      messageId: null,
      variantId: null,
      providerId: "openrouter",
      model: "model-1",
      settings: {},
    });
    const abortController = new AbortController();

    const lease = await GenerationControlService.acquire({
      generationId: generation.id,
      runInstanceId: "run-2",
      abortController,
      pollMs: 50,
    });

    await expect(GenerationControlService.requestAbort(generation.id)).resolves.toBe(true);
    expect(abortController.signal.aborted).toBe(true);

    const record = await getGenerationControlByGenerationId(generation.id);
    expect(record?.status).toBe("abort_requested");
    expect(record?.abortRequestedAt).not.toBeNull();

    await lease.release({ status: "aborted" });
  });

  test("poll loop aborts when an external abort request is written to the DB", async () => {
    const generation = await createGeneration({
      ownerId: "global",
      chatId: "chat-1",
      branchId: "branch-1",
      messageId: null,
      variantId: null,
      providerId: "openrouter",
      model: "model-1",
      settings: {},
    });
    const abortController = new AbortController();

    const lease = await GenerationControlService.acquire({
      generationId: generation.id,
      runInstanceId: "run-3",
      abortController,
      pollMs: 25,
    });

    await markGenerationAbortRequested({
      generationId: generation.id,
      requestedAt: new Date(),
    });

    await waitFor(() => abortController.signal.aborted);
    expect(abortController.signal.aborted).toBe(true);

    await lease.release({ status: "aborted" });
  });

  test("expired leases are treated as inactive and are cleared on abort requests", async () => {
    const generation = await createGeneration({
      ownerId: "global",
      chatId: "chat-1",
      branchId: "branch-1",
      messageId: null,
      variantId: null,
      providerId: "openrouter",
      model: "model-1",
      settings: {},
    });
    const db = await initDb();
    const now = new Date();
    const expiredAt = new Date(now.getTime() - 10_000);

    await db.insert(generationRuntimeControl).values({
      generationId: generation.id,
      runInstanceId: "expired-run",
      status: "active",
      abortRequestedAt: null,
      heartbeatAt: expiredAt,
      leaseExpiresAt: expiredAt,
      createdAt: expiredAt,
      updatedAt: expiredAt,
    });

    await expect(GenerationControlService.requestAbort(generation.id)).resolves.toBe(false);

    const rows = await db
      .select()
      .from(generationRuntimeControl)
      .where(eq(generationRuntimeControl.generationId, generation.id));
    expect(rows).toHaveLength(0);
  });
});
