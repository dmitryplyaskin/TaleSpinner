import path from "node:path";

import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rerenderGreetingTemplatesIfPreplay: vi.fn(),
  getOperationProfileSettings: vi.fn(),
  getOperationProfileById: vi.fn(),
  resolveCompiledOperationProfile: vi.fn(),
  loadOrBootstrapRuntimeState: vi.fn(),
  getLatestGenerationByChatBranchWithDebug: vi.fn(),
}));

vi.mock("../../../services/chat-core/greeting-template-rerender", () => ({
  rerenderGreetingTemplatesIfPreplay: mocks.rerenderGreetingTemplatesIfPreplay,
}));

vi.mock("../../../services/operations/operation-profile-settings-repository", () => ({
  getOperationProfileSettings: mocks.getOperationProfileSettings,
}));

vi.mock("../../../services/operations/operation-profiles-repository", () => ({
  getOperationProfileById: mocks.getOperationProfileById,
}));

vi.mock("../../../services/operations/operation-profile-resolver", () => ({
  resolveCompiledOperationProfile: mocks.resolveCompiledOperationProfile,
}));

vi.mock("../../../services/chat-generation-v3/runtime/operation-runtime-state", () => ({
  loadOrBootstrapRuntimeState: mocks.loadOrBootstrapRuntimeState,
}));

vi.mock("../../../services/chat-core/generations-repository", async () => {
  const actual = await vi.importActual<object>("../../../services/chat-core/generations-repository");
  return {
    ...actual,
    getLatestGenerationByChatBranchWithDebug: mocks.getLatestGenerationByChatBranchWithDebug,
  };
});

import { applyMigrations } from "../../../db/apply-migrations";
import { initDb, resetDbForTests } from "../../../db/client";
import { chatBranches, chatEntries, chats, entityProfiles } from "../../../db/schema";
import { createTempDataDir, removeTempDataDir } from "../../../e2e/helpers/tmp-dir";
import { createEntryWithVariant } from "../../../services/chat-entry-parts/entries-repository";
import { createPart } from "../../../services/chat-entry-parts/parts-repository";
import { createVariant } from "../../../services/chat-entry-parts/variants-repository";

import { getChatEntries } from "./get-chat-entries";
import { getChatOperationRuntimeState } from "./get-chat-operation-runtime-state";
import { getEntryVariants } from "./get-entry-variants";
import { getLatestWorldInfoActivations } from "./get-latest-world-info-activations";

type TestChatFixture = {
  entityProfileId: string;
  chatId: string;
  branchId: string;
};

let tempDir: string;
let dbPath: string;

async function seedChatFixture(): Promise<TestChatFixture> {
  const db = await initDb();
  const entityProfileId = "entity-1";
  const chatId = "chat-1";
  const branchId = "branch-1";
  const ts = new Date("2026-03-06T12:00:00.000Z");

  db.insert(entityProfiles)
    .values({
      id: entityProfileId,
      ownerId: "global",
      name: "Test Entity",
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
      id: chatId,
      ownerId: "global",
      entityProfileId,
      title: "Test Chat",
      activeBranchId: branchId,
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
      id: branchId,
      ownerId: "global",
      chatId,
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

  return { entityProfileId, chatId, branchId };
}

async function createEntry(params: {
  chatId: string;
  branchId: string;
  role: "user" | "assistant" | "system";
  meta?: unknown;
}) {
  return createEntryWithVariant({
    ownerId: "global",
    chatId: params.chatId,
    branchId: params.branchId,
    role: params.role,
    variantKind: params.role === "assistant" ? "generation" : "manual_edit",
    meta: params.meta,
  });
}

async function createTextPart(params: {
  variantId: string;
  payload: string;
  channel?: "main" | "aux";
  order?: number;
  source?: "user" | "agent" | "llm";
}) {
  return createPart({
    ownerId: "global",
    variantId: params.variantId,
    channel: params.channel ?? "main",
    order: params.order ?? 0,
    payload: params.payload,
    payloadFormat: "markdown",
    visibility: { ui: "always", prompt: true },
    ui: { rendererId: "markdown" },
    prompt: { serializerId: "asText" },
    lifespan: "infinite",
    createdTurn: 0,
    source: params.source ?? "user",
  });
}

beforeEach(async () => {
  vi.clearAllMocks();

  tempDir = await createTempDataDir("talespinner-entry-reads-");
  dbPath = path.join(tempDir, "test.db");
  await initDb({ dbPath });
  await applyMigrations();

  mocks.rerenderGreetingTemplatesIfPreplay.mockResolvedValue(undefined);
  mocks.getOperationProfileSettings.mockResolvedValue({
    activeProfileId: null,
  });
  mocks.getOperationProfileById.mockResolvedValue(null);
  mocks.resolveCompiledOperationProfile.mockResolvedValue({ operations: [] });
  mocks.loadOrBootstrapRuntimeState.mockResolvedValue({
    updatedAt: new Date("2026-03-06T12:00:01.000Z"),
    payload: {
      activationByOpId: {},
    },
  });
  mocks.getLatestGenerationByChatBranchWithDebug.mockResolvedValue(null);
});

afterEach(async () => {
  resetDbForTests();
  await removeTempDataDir(tempDir);
});

describe("chat entry read use cases", () => {
  test("getChatEntries returns page info, currentTurn and prompt usage", async () => {
    const fixture = await seedChatFixture();
    const userEntry = await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
      role: "user",
    });
    await createTextPart({
      variantId: userEntry.variant.variantId,
      payload: "Hello there",
      source: "user",
    });

    const assistantEntry = await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
      role: "assistant",
    });
    await createTextPart({
      variantId: assistantEntry.variant.variantId,
      payload: "General Kenobi",
      source: "llm",
    });

    const result = await getChatEntries({
      chatId: fixture.chatId,
      query: {
        limit: 50,
      },
    });

    expect(result.branchId).toBe(fixture.branchId);
    expect(result.currentTurn).toBe(0);
    expect(result.pageInfo).toEqual({
      hasMoreOlder: false,
      nextCursor: null,
    });
    expect(result.lastSelectedPersonaId).toBeNull();
    expect(result.entries).toHaveLength(2);
    expect(result.entries.every((item) => item.promptUsage.estimator === "chars_div4")).toBe(true);
    expect(result.entries.every((item) => item.promptUsage.included)).toBe(true);
    expect(result.entries.every((item) => item.promptUsage.approxTokens > 0)).toBe(true);
  });

  test("getChatEntries returns lastSelectedPersonaId from the latest active user entry", async () => {
    const fixture = await seedChatFixture();
    await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
      role: "user",
      meta: {
        requestId: "req-1",
        personaSnapshot: {
          id: "persona-1",
          name: "Alice",
        },
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 2));

    await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
      role: "assistant",
      meta: {
        personaSnapshot: {
          id: "persona-assistant",
          name: "Assistant Persona",
        },
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 2));

    await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
      role: "user",
      meta: {
        requestId: "req-2",
        personaSnapshot: {
          id: "persona-2",
          name: "Bob",
        },
      },
    });

    const result = await getChatEntries({
      chatId: fixture.chatId,
      query: {
        limit: 50,
      },
    });

    expect(result.lastSelectedPersonaId).toBe("persona-2");
  });

  test("getChatEntries ignores assistant and system persona snapshots for lastSelectedPersonaId", async () => {
    const fixture = await seedChatFixture();
    await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
      role: "user",
      meta: {
        personaSnapshot: {
          id: "persona-user",
          name: "User Persona",
        },
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 2));

    await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
      role: "system",
      meta: {
        personaSnapshot: {
          id: "persona-system",
          name: "System Persona",
        },
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 2));

    await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
      role: "assistant",
      meta: {
        personaSnapshot: {
          id: "persona-assistant",
          name: "Assistant Persona",
        },
      },
    });

    const result = await getChatEntries({
      chatId: fixture.chatId,
      query: {
        limit: 50,
      },
    });

    expect(result.lastSelectedPersonaId).toBe("persona-user");
  });

  test("getChatEntries ignores soft-deleted user entries when resolving lastSelectedPersonaId", async () => {
    const fixture = await seedChatFixture();
    await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
      role: "user",
      meta: {
        personaSnapshot: {
          id: "persona-active",
          name: "Active Persona",
        },
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 2));

    const deletedEntry = await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
      role: "user",
      meta: {
        personaSnapshot: {
          id: "persona-deleted",
          name: "Deleted Persona",
        },
      },
    });

    const db = await initDb();
    db.update(chatEntries)
      .set({
        softDeleted: true,
        softDeletedAt: new Date("2026-03-06T12:00:10.000Z"),
        softDeletedBy: "user",
      })
      .where(eq(chatEntries.entryId, deletedEntry.entry.entryId))
      .run();

    const result = await getChatEntries({
      chatId: fixture.chatId,
      query: {
        limit: 50,
      },
    });

    expect(result.lastSelectedPersonaId).toBe("persona-active");
  });

  test("getChatEntries returns null for lastSelectedPersonaId when user entries have no persona snapshot", async () => {
    const fixture = await seedChatFixture();
    await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
      role: "user",
      meta: {
        requestId: "req-no-persona",
      },
    });

    const result = await getChatEntries({
      chatId: fixture.chatId,
      query: {
        limit: 50,
      },
    });

    expect(result.lastSelectedPersonaId).toBeNull();
  });

  test("getChatEntries ignores greeting rerender failures", async () => {
    const fixture = await seedChatFixture();
    const entry = await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
      role: "user",
    });
    await createTextPart({
      variantId: entry.variant.variantId,
      payload: "Still works",
      source: "user",
    });

    mocks.rerenderGreetingTemplatesIfPreplay.mockRejectedValueOnce(new Error("forced rerender failure"));

    await expect(
      getChatEntries({
        chatId: fixture.chatId,
        query: {
          limit: 50,
        },
      })
    ).resolves.toMatchObject({
      branchId: fixture.branchId,
      currentTurn: 0,
    });
  });

  test("getChatOperationRuntimeState returns empty payload when no active profile exists", async () => {
    const fixture = await seedChatFixture();

    await expect(
      getChatOperationRuntimeState({
        chatId: fixture.chatId,
      })
    ).resolves.toEqual({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
      profileId: null,
      operationProfileSessionId: null,
      updatedAt: null,
      operations: [],
    });
  });

  test("getChatOperationRuntimeState returns populated counters when runtime state exists", async () => {
    const fixture = await seedChatFixture();

    mocks.getOperationProfileSettings.mockResolvedValue({
      activeProfileId: "profile-1",
    });
    mocks.getOperationProfileById.mockResolvedValue({
      profileId: "profile-1",
      enabled: true,
      operationProfileSessionId: "session-1",
    });
    mocks.resolveCompiledOperationProfile.mockResolvedValue({
      operations: [
        {
          opId: "op-1",
          config: {
            activation: {
              everyNTurns: 2,
              everyNContextTokens: 100,
            },
          },
        },
      ],
    });
    mocks.loadOrBootstrapRuntimeState.mockResolvedValue({
      updatedAt: new Date("2026-03-06T12:00:05.000Z"),
      payload: {
        activationByOpId: {
          "op-1": {
            turnsCounter: 2,
            tokensCounter: 50,
          },
        },
      },
    });

    await expect(
      getChatOperationRuntimeState({
        chatId: fixture.chatId,
      })
    ).resolves.toEqual({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
      profileId: "profile-1",
      operationProfileSessionId: "session-1",
      updatedAt: "2026-03-06T12:00:05.000Z",
      operations: [
        {
          opId: "op-1",
          everyNTurns: 2,
          everyNContextTokens: 100,
          turnsCounter: 2,
          tokensCounter: 50,
          isReachedNow: true,
        },
      ],
    });
  });

  test("getLatestWorldInfoActivations returns empty payload when branch is absent", async () => {
    const fixture = await seedChatFixture();
    const db = await initDb();
    db.update(chats).set({ activeBranchId: null }).where(eq(chats.id, fixture.chatId)).run();

    await expect(
      getLatestWorldInfoActivations({
        chatId: fixture.chatId,
      })
    ).resolves.toEqual({
      generationId: null,
      startedAt: null,
      status: null,
      activatedCount: 0,
      warnings: [],
      entries: [],
    });
  });

  test("getLatestWorldInfoActivations returns normalized activation data", async () => {
    const fixture = await seedChatFixture();

    mocks.getLatestGenerationByChatBranchWithDebug.mockResolvedValue({
      id: "gen-1",
      chatId: fixture.chatId,
      branchId: fixture.branchId,
      messageId: null,
      variantId: null,
      status: "done",
      startedAt: new Date("2026-03-06T12:00:10.000Z"),
      finishedAt: new Date("2026-03-06T12:00:11.000Z"),
      error: null,
      promptHash: "hash-1",
      promptSnapshot: null,
      debug: {
        worldInfo: {
          activatedCount: 1,
          warnings: ["warn-1"],
          entries: [
            {
              hash: "entry-hash-1",
              bookId: "book-1",
              bookName: "Book",
              uid: 42,
              comment: "Note",
              content: "Dragon",
              matchedKeys: ["dragon"],
              reasons: ["keyword"],
            },
          ],
        },
      },
    });

    await expect(
      getLatestWorldInfoActivations({
        chatId: fixture.chatId,
      })
    ).resolves.toEqual({
      generationId: "gen-1",
      startedAt: "2026-03-06T12:00:10.000Z",
      status: "done",
      activatedCount: 1,
      warnings: ["warn-1"],
      entries: [
        {
          hash: "entry-hash-1",
          bookId: "book-1",
          bookName: "Book",
          uid: 42,
          comment: "Note",
          content: "Dragon",
          matchedKeys: ["dragon"],
          reasons: ["keyword"],
        },
      ],
    });
  });

  test("getEntryVariants returns variants for an existing entry and 404s for missing entry", async () => {
    const fixture = await seedChatFixture();
    const entry = await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
      role: "assistant",
    });
    const secondVariant = await createVariant({
      ownerId: "global",
      entryId: entry.entry.entryId,
      kind: "manual_edit",
    });

    await expect(
      getEntryVariants({
        entryId: entry.entry.entryId,
      })
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ variantId: entry.variant.variantId }),
        expect.objectContaining({ variantId: secondVariant.variantId }),
      ])
    );

    await expect(
      getEntryVariants({
        entryId: "missing-entry",
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
