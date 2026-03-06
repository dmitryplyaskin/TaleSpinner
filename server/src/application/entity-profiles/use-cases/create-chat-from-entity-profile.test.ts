import path from "node:path";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { applyMigrations } from "../../../db/apply-migrations";
import { initDb, resetDbForTests } from "../../../db/client";
import { entityProfiles } from "../../../db/schema";
import { createTempDataDir, removeTempDataDir } from "../../../e2e/helpers/tmp-dir";
import { listChatMessages } from "../../../services/chat-core/chats-repository";
import * as promptTemplateContext from "../../../services/chat-core/prompt-template-context";
import { listEntriesWithActiveVariants } from "../../../services/chat-entry-parts/entries-repository";
import { listEntryVariants } from "../../../services/chat-entry-parts/variants-repository";

import { createChatFromEntityProfile } from "./create-chat-from-entity-profile";

let tempDir: string;
let dbPath: string;

async function seedEntityProfile(params: {
  id?: string;
  firstMes?: string;
  alternateGreetings?: string[];
} = {}): Promise<string> {
  const db = await initDb();
  const id = params.id ?? "entity-1";
  const ts = new Date("2026-03-06T18:00:00.000Z");

  db.insert(entityProfiles)
    .values({
      id,
      ownerId: "global",
      name: "Entity",
      kind: "CharSpec",
      specJson: JSON.stringify({
        first_mes: params.firstMes ?? "Hello there",
        alternate_greetings: params.alternateGreetings ?? ["Alt hello"],
      }),
      metaJson: null,
      isFavorite: false,
      createdAt: ts,
      updatedAt: ts,
      avatarAssetId: null,
    })
    .run();

  return id;
}

beforeEach(async () => {
  tempDir = await createTempDataDir("talespinner-entity-profile-chat-");
  dbPath = path.join(tempDir, "test.db");
  await initDb({ dbPath });
  await applyMigrations();
});

afterEach(async () => {
  vi.restoreAllMocks();
  resetDbForTests();
  await removeTempDataDir(tempDir);
});

describe("createChatFromEntityProfile", () => {
  test("creates a chat and seeds both entry-parts and legacy assistant greeting", async () => {
    const entityProfileId = await seedEntityProfile();

    const created = await createChatFromEntityProfile({
      entityProfileId,
      ownerId: "global",
      title: "Seeded chat",
    });

    expect(created.chat.entityProfileId).toBe(entityProfileId);
    expect(created.mainBranch.chatId).toBe(created.chat.id);

    const seededEntries = await listEntriesWithActiveVariants({
      chatId: created.chat.id,
      branchId: created.mainBranch.id,
      limit: 20,
    });
    expect(seededEntries).toHaveLength(1);
    expect(seededEntries[0]?.entry.role).toBe("assistant");
    expect(seededEntries[0]?.variant?.parts[0]?.payload).toBe("Hello there");

    const variants = await listEntryVariants({
      entryId: seededEntries[0]!.entry.entryId,
    });
    expect(variants).toHaveLength(2);
    expect(variants.map((variant) => variant.parts[0]?.payload)).toEqual([
      "Hello there",
      "Alt hello",
    ]);

    const legacyMessages = await listChatMessages({
      chatId: created.chat.id,
      branchId: created.mainBranch.id,
      limit: 20,
    });
    expect(legacyMessages).toHaveLength(1);
    expect(legacyMessages[0]?.role).toBe("assistant");
    expect(legacyMessages[0]?.promptText).toBe("Hello there");
  });

  test("does not fail chat creation when greeting seeding throws", async () => {
    const entityProfileId = await seedEntityProfile({
      id: "entity-2",
      firstMes: "Hello anyway",
      alternateGreetings: [],
    });
    vi.spyOn(promptTemplateContext, "buildInstructionRenderContext").mockRejectedValue(
      new Error("forced seeding failure")
    );

    const created = await createChatFromEntityProfile({
      entityProfileId,
      ownerId: "global",
      title: "Best effort chat",
    });

    expect(created.chat.entityProfileId).toBe(entityProfileId);

    const seededEntries = await listEntriesWithActiveVariants({
      chatId: created.chat.id,
      branchId: created.mainBranch.id,
      limit: 20,
    });
    const legacyMessages = await listChatMessages({
      chatId: created.chat.id,
      branchId: created.mainBranch.id,
      limit: 20,
    });

    expect(seededEntries).toHaveLength(0);
    expect(legacyMessages).toHaveLength(0);
  });
});
