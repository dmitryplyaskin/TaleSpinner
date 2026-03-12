import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { applyMigrations } from "../../../db/apply-migrations";
import { initDb, resetDbForTests } from "../../../db/client";
import {
  chatBranches,
  chatRuntimeState,
  chats,
  entityProfiles,
  operationProfiles,
} from "../../../db/schema";

import { ChatRuntimeStateRepository } from "./chat-runtime-state-repository";

describe("chat-runtime-state-repository", () => {
  let tempDir = "";
  const prevDataDir = process.env.DATA_DIR;
  const prevLegacyDataDir = process.env.TALESPINNER_DATA_DIR;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "talespinner-runtime-state-"));
    process.env.DATA_DIR = tempDir;
    delete process.env.TALESPINNER_DATA_DIR;
    resetDbForTests();
    await initDb();
    await applyMigrations();

    const db = await initDb();
    const now = new Date("2026-02-21T00:00:00.000Z");
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
    await db.insert(operationProfiles).values({
      id: "profile-1",
      ownerId: "global",
      name: "Profile",
      description: null,
      enabled: true,
      executionMode: "sequential",
      operationProfileSessionId: "sess-1",
      version: 1,
      specJson: "{\"blockRefs\":[]}",
      metaJson: null,
      createdAt: now,
      updatedAt: now,
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

  test("creates, loads and updates state in single scope row", async () => {
    const scope = {
      ownerId: "global",
      chatId: "chat-1",
      branchId: "branch-1",
      profileId: "profile-1",
      operationProfileSessionId: "sess-1",
    } as const;

    const missing = await ChatRuntimeStateRepository.getByScope(scope);
    expect(missing).toBeNull();

    await ChatRuntimeStateRepository.upsert({
      scope,
      payload: {
        version: 1,
        activationByOpId: {
          "op-1": { turnsCounter: 2, tokensCounter: 30 },
        },
        bootstrap: {
          source: "branch_active_history",
          userEventsCount: 2,
          lastRebuiltAt: "2026-02-21T00:00:00.000Z",
        },
      },
    });

    const first = await ChatRuntimeStateRepository.getByScope(scope);
    expect(first?.payload.activationByOpId["op-1"]).toEqual({
      turnsCounter: 2,
      tokensCounter: 30,
    });

    await ChatRuntimeStateRepository.upsert({
      scope,
      payload: {
        version: 1,
        activationByOpId: {
          "op-1": { turnsCounter: 3, tokensCounter: 45 },
        },
        bootstrap: {
          source: "branch_active_history",
          userEventsCount: 3,
          lastRebuiltAt: "2026-02-21T00:10:00.000Z",
        },
      },
    });

    const second = await ChatRuntimeStateRepository.getByScope(scope);
    expect(second?.payload.activationByOpId["op-1"]).toEqual({
      turnsCounter: 3,
      tokensCounter: 45,
    });

    const db = await initDb();
    const rows = await db.select().from(chatRuntimeState);
    expect(rows).toHaveLength(1);
  });
});
