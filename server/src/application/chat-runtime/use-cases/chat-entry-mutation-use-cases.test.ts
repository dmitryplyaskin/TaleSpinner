import path from "node:path";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  buildInstructionRenderContext: vi.fn(),
  resolveAndApplyWorldInfoToTemplateContext: vi.fn(),
}));

vi.mock("../../../services/chat-core/prompt-template-context", () => ({
  buildInstructionRenderContext: mocks.buildInstructionRenderContext,
  resolveAndApplyWorldInfoToTemplateContext: mocks.resolveAndApplyWorldInfoToTemplateContext,
}));

import { applyMigrations } from "../../../db/apply-migrations";
import { initDb, resetDbForTests } from "../../../db/client";
import { chatBranches, chats, entityProfiles } from "../../../db/schema";
import { createTempDataDir, removeTempDataDir } from "../../../e2e/helpers/tmp-dir";
import * as entriesRepository from "../../../services/chat-entry-parts/entries-repository";
import * as partsRepository from "../../../services/chat-entry-parts/parts-repository";
import { createEntryWithVariant, getActiveVariantWithParts, getEntryById } from "../../../services/chat-entry-parts/entries-repository";
import { createPart, getPartById } from "../../../services/chat-entry-parts/parts-repository";
import {
  createVariant,
  listEntryVariants,
  selectActiveVariant,
} from "../../../services/chat-entry-parts/variants-repository";

import { batchUpdateEntryParts } from "./batch-update-entry-parts";
import { deleteEntryVariant } from "./delete-entry-variant";
import { manualEditEntry } from "./manual-edit-entry";
import { selectEntryVariant } from "./select-entry-variant";
import { setEntryPromptVisibility } from "./set-entry-prompt-visibility";
import { undoPartCanonicalization } from "./undo-part-canonicalization";

type TestChatFixture = {
  entityProfileId: string;
  chatId: string;
  branchId: string;
};

type SeededEntry = Awaited<ReturnType<typeof createEntryWithVariant>>;

let tempDir: string;
let dbPath: string;

async function seedChatFixture(): Promise<TestChatFixture> {
  const db = await initDb();
  const entityProfileId = "entity-1";
  const chatId = "chat-1";
  const branchId = "branch-1";
  const ts = new Date("2026-03-06T10:00:00.000Z");

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
  role?: "user" | "assistant" | "system";
  meta?: unknown;
}): Promise<SeededEntry> {
  return createEntryWithVariant({
    ownerId: "global",
    chatId: params.chatId,
    branchId: params.branchId,
    role: params.role ?? "assistant",
    variantKind: "manual_edit",
    meta: params.meta,
  });
}

async function createTextPart(params: {
  variantId: string;
  payload: string;
  channel?: "main" | "aux";
  order?: number;
  source?: "user" | "agent" | "llm";
  replacesPartId?: string;
  tags?: string[];
}): Promise<Awaited<ReturnType<typeof createPart>>> {
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
    replacesPartId: params.replacesPartId,
    tags: params.tags,
  });
}

beforeEach(async () => {
  vi.clearAllMocks();

  tempDir = await createTempDataDir("talespinner-entry-mutations-");
  dbPath = path.join(tempDir, "test.db");
  await initDb({ dbPath });
  await applyMigrations();

  mocks.buildInstructionRenderContext.mockResolvedValue({
    char: {},
    user: { name: "Alice" },
    chat: {},
    messages: [],
    rag: {},
    art: {},
    now: new Date("2026-03-06T10:00:00.000Z").toISOString(),
  });
  mocks.resolveAndApplyWorldInfoToTemplateContext.mockResolvedValue(undefined);
});

afterEach(async () => {
  resetDbForTests();
  await removeTempDataDir(tempDir);
});

describe("chat entry mutation use cases", () => {
  test("manualEditEntry edits the explicitly requested part", async () => {
    const fixture = await seedChatFixture();
    const entry = await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
    });
    const mainPart = await createTextPart({
      variantId: entry.variant.variantId,
      payload: "Main",
      channel: "main",
    });
    const auxPart = await createTextPart({
      variantId: entry.variant.variantId,
      payload: "Aux",
      channel: "aux",
      order: 10,
    });

    const result = await manualEditEntry({
      entryId: entry.entry.entryId,
      body: {
        partId: auxPart.partId,
        content: "Edited aux",
        requestId: "req-manual-explicit",
      },
    });

    expect(result).toEqual({
      entryId: entry.entry.entryId,
      activeVariantId: entry.variant.variantId,
    });
    expect((await getPartById({ partId: auxPart.partId }))?.payload).toBe("Edited aux");
    expect((await getPartById({ partId: mainPart.partId }))?.payload).toBe("Main");
  });

  test("manualEditEntry falls back to the visible editable main part", async () => {
    const fixture = await seedChatFixture();
    const entry = await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
    });
    const mainPart = await createTextPart({
      variantId: entry.variant.variantId,
      payload: "Main",
      channel: "main",
    });
    const auxPart = await createTextPart({
      variantId: entry.variant.variantId,
      payload: "Aux",
      channel: "aux",
      order: 10,
    });

    await manualEditEntry({
      entryId: entry.entry.entryId,
      body: {
        content: "Edited main",
        requestId: "req-manual-fallback",
      },
    });

    expect((await getPartById({ partId: mainPart.partId }))?.payload).toBe("Edited main");
    expect((await getPartById({ partId: auxPart.partId }))?.payload).toBe("Aux");
  });

  test("manualEditEntry rolls back part payload when meta update fails", async () => {
    const fixture = await seedChatFixture();
    const entry = await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
    });
    const mainPart = await createTextPart({
      variantId: entry.variant.variantId,
      payload: "Original",
      channel: "main",
    });

    const spy = vi
      .spyOn(entriesRepository, "updateEntryMeta")
      .mockImplementation((((_params: {
        entryId: string;
        meta: unknown | null;
        executor?: unknown;
      }) => {
        throw new Error("forced updateEntryMeta failure");
      }) as unknown) as typeof entriesRepository.updateEntryMeta);

    await expect(
      manualEditEntry({
        entryId: entry.entry.entryId,
        body: {
          content: "Should rollback",
          requestId: "req-manual-rollback",
        },
      })
    ).rejects.toThrow("forced updateEntryMeta failure");

    spy.mockRestore();

    expect((await getPartById({ partId: mainPart.partId }))?.payload).toBe("Original");
    expect((await getEntryById({ entryId: entry.entry.entryId }))?.meta).toBeUndefined();
  });

  test("batchUpdateEntryParts rejects stale variant ids", async () => {
    const fixture = await seedChatFixture();
    const entry = await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
    });
    const mainPart = await createTextPart({
      variantId: entry.variant.variantId,
      payload: "Main",
      channel: "main",
    });
    const staleVariant = await createVariant({
      ownerId: "global",
      entryId: entry.entry.entryId,
      kind: "manual_edit",
    });

    await expect(
      batchUpdateEntryParts({
        entryId: entry.entry.entryId,
        body: {
          variantId: staleVariant.variantId,
          mainPartId: mainPart.partId,
          orderedPartIds: [mainPart.partId],
          parts: [
            {
              partId: mainPart.partId,
              deleted: false,
              visibility: { ui: "always", prompt: true },
              payload: "Main",
            },
          ],
        },
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  test("batchUpdateEntryParts persists main selection, ordering and deletions", async () => {
    const fixture = await seedChatFixture();
    const entry = await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
    });
    const mainPart = await createTextPart({
      variantId: entry.variant.variantId,
      payload: "Main",
      channel: "main",
    });
    const auxPart = await createTextPart({
      variantId: entry.variant.variantId,
      payload: "Aux",
      channel: "aux",
      order: 10,
    });
    const deletePart = await createTextPart({
      variantId: entry.variant.variantId,
      payload: "Delete me",
      channel: "aux",
      order: 20,
    });

    const result = await batchUpdateEntryParts({
      entryId: entry.entry.entryId,
      body: {
        variantId: entry.variant.variantId,
        mainPartId: auxPart.partId,
        orderedPartIds: [auxPart.partId, mainPart.partId],
        parts: [
          {
            partId: mainPart.partId,
            deleted: false,
            visibility: { ui: "always", prompt: true },
            payload: "Old main moved",
          },
          {
            partId: auxPart.partId,
            deleted: false,
            visibility: { ui: "always", prompt: true },
            payload: "New main",
          },
          {
            partId: deletePart.partId,
            deleted: true,
            visibility: { ui: "always", prompt: false },
            payload: "Delete me",
          },
        ],
      },
    });

    expect(result).toEqual({
      entryId: entry.entry.entryId,
      variantId: entry.variant.variantId,
      mainPartId: auxPart.partId,
      updatedPartIds: expect.arrayContaining([mainPart.partId, auxPart.partId, deletePart.partId]),
      deletedPartIds: [deletePart.partId],
    });

    const refreshedEntry = await getEntryById({ entryId: entry.entry.entryId });
    const refreshedVariant = refreshedEntry
      ? await getActiveVariantWithParts({ entry: refreshedEntry })
      : null;
    const refreshedParts = new Map((refreshedVariant?.parts ?? []).map((part) => [part.partId, part] as const));

    expect(refreshedParts.get(auxPart.partId)).toMatchObject({
      channel: "main",
      order: 0,
      payload: "New main",
      softDeleted: false,
    });
    expect(refreshedParts.get(mainPart.partId)).toMatchObject({
      channel: "aux",
      order: 10,
      payload: "Old main moved",
      softDeleted: false,
    });
    expect(refreshedParts.get(deletePart.partId)).toMatchObject({
      softDeleted: true,
      softDeletedBy: "user",
    });
  });

  test("selectEntryVariant rejects variants from another entry", async () => {
    const fixture = await seedChatFixture();
    const firstEntry = await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
    });
    const secondEntry = await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
    });

    await expect(
      selectEntryVariant({
        entryId: firstEntry.entry.entryId,
        variantId: secondEntry.variant.variantId,
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  test("selectEntryVariant updates the active variant", async () => {
    const fixture = await seedChatFixture();
    const entry = await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
    });
    const secondVariant = await createVariant({
      ownerId: "global",
      entryId: entry.entry.entryId,
      kind: "manual_edit",
    });

    const result = await selectEntryVariant({
      entryId: entry.entry.entryId,
      variantId: secondVariant.variantId,
    });

    expect(result).toEqual({
      entryId: entry.entry.entryId,
      activeVariantId: secondVariant.variantId,
    });
    expect((await getEntryById({ entryId: entry.entry.entryId }))?.activeVariantId).toBe(
      secondVariant.variantId
    );
  });

  test("deleteEntryVariant rejects deleting the last remaining variant", async () => {
    const fixture = await seedChatFixture();
    const entry = await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
    });

    await expect(
      deleteEntryVariant({
        entryId: entry.entry.entryId,
        variantId: entry.variant.variantId,
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test("deleteEntryVariant switches active variant to the deterministic fallback", async () => {
    const fixture = await seedChatFixture();
    const entry = await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
    });
    const secondVariant = await createVariant({
      ownerId: "global",
      entryId: entry.entry.entryId,
      kind: "manual_edit",
    });
    await selectActiveVariant({
      entryId: entry.entry.entryId,
      variantId: secondVariant.variantId,
    });

    const result = await deleteEntryVariant({
      entryId: entry.entry.entryId,
      variantId: secondVariant.variantId,
    });

    expect(result).toEqual({
      entryId: entry.entry.entryId,
      activeVariantId: entry.variant.variantId,
      deletedVariantId: secondVariant.variantId,
    });
    expect((await getEntryById({ entryId: entry.entry.entryId }))?.activeVariantId).toBe(
      entry.variant.variantId
    );
    expect((await listEntryVariants({ entryId: entry.entry.entryId })).map((variant) => variant.variantId)).toEqual([
      entry.variant.variantId,
    ]);
  });

  test("setEntryPromptVisibility preserves unrelated meta and toggles excludedFromPrompt", async () => {
    const fixture = await seedChatFixture();
    const entry = await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
      meta: {
        foo: "bar",
        excludedFromPrompt: true,
      },
    });

    await expect(
      setEntryPromptVisibility({
        entryId: entry.entry.entryId,
        includeInPrompt: true,
      })
    ).resolves.toEqual({
      id: entry.entry.entryId,
      includeInPrompt: true,
    });
    expect((await getEntryById({ entryId: entry.entry.entryId }))?.meta).toEqual({
      foo: "bar",
    });

    await expect(
      setEntryPromptVisibility({
        entryId: entry.entry.entryId,
        includeInPrompt: false,
      })
    ).resolves.toEqual({
      id: entry.entry.entryId,
      includeInPrompt: false,
    });
    expect((await getEntryById({ entryId: entry.entry.entryId }))?.meta).toEqual({
      foo: "bar",
      excludedFromPrompt: true,
    });
  });

  test("undoPartCanonicalization soft-deletes the full active descendant chain", async () => {
    const fixture = await seedChatFixture();
    const entry = await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
    });
    const originalPart = await createTextPart({
      variantId: entry.variant.variantId,
      payload: "Original",
      channel: "main",
      source: "user",
    });
    const canonicalPart = await createTextPart({
      variantId: entry.variant.variantId,
      payload: "Canonical",
      channel: "main",
      order: 10,
      source: "agent",
      replacesPartId: originalPart.partId,
      tags: ["canonicalization"],
    });
    const descendantPart = await createTextPart({
      variantId: entry.variant.variantId,
      payload: "Descendant",
      channel: "aux",
      order: 20,
      source: "agent",
      replacesPartId: canonicalPart.partId,
      tags: ["canonicalization"],
    });

    const result = await undoPartCanonicalization({
      partId: canonicalPart.partId,
      body: { by: "user" },
    });

    expect(result).toEqual({
      undonePartIds: expect.arrayContaining([canonicalPart.partId, descendantPart.partId]),
      restoredPartId: originalPart.partId,
      entryId: entry.entry.entryId,
    });
    expect((await getPartById({ partId: canonicalPart.partId }))?.softDeleted).toBe(true);
    expect((await getPartById({ partId: descendantPart.partId }))?.softDeleted).toBe(true);
    expect((await getPartById({ partId: originalPart.partId }))?.softDeleted).toBe(false);
  });

  test("undoPartCanonicalization rolls back the cascade when a delete fails", async () => {
    const fixture = await seedChatFixture();
    const entry = await createEntry({
      chatId: fixture.chatId,
      branchId: fixture.branchId,
    });
    const originalPart = await createTextPart({
      variantId: entry.variant.variantId,
      payload: "Original",
      channel: "main",
      source: "user",
    });
    const canonicalPart = await createTextPart({
      variantId: entry.variant.variantId,
      payload: "Canonical",
      channel: "main",
      order: 10,
      source: "agent",
      replacesPartId: originalPart.partId,
      tags: ["canonicalization"],
    });
    const descendantPart = await createTextPart({
      variantId: entry.variant.variantId,
      payload: "Descendant",
      channel: "aux",
      order: 20,
      source: "agent",
      replacesPartId: canonicalPart.partId,
      tags: ["canonicalization"],
    });

    const originalSoftDeletePart = partsRepository.softDeletePart;
    let calls = 0;
    const spy = vi
      .spyOn(partsRepository, "softDeletePart")
      .mockImplementation((((params: Parameters<typeof partsRepository.softDeletePart>[0]) => {
        calls += 1;
        if (calls === 2) {
          throw new Error("forced softDeletePart failure");
        }
        return originalSoftDeletePart(params as never) as never;
      }) as unknown) as typeof partsRepository.softDeletePart);

    await expect(
      undoPartCanonicalization({
        partId: canonicalPart.partId,
        body: { by: "user" },
      })
    ).rejects.toThrow("forced softDeletePart failure");

    spy.mockRestore();

    expect((await getPartById({ partId: canonicalPart.partId }))?.softDeleted).toBe(false);
    expect((await getPartById({ partId: descendantPart.partId }))?.softDeleted).toBe(false);
  });
});
