import { describe, expect, test } from "vitest";

import { HttpError } from "@core/middleware/error-handler";

import {
  assertBatchUpdateVariantIsActive,
  buildEntryPromptUsage,
  buildBatchUpdatePartPlan,
  buildLatestWorldInfoActivationsFromGeneration,
  buildPromptApproxTokensByEntryId,
  buildPromptDiagnosticsFromDebug,
  buildPromptDiagnosticsFromSnapshot,
  buildUserEntryMeta,
  emptyLatestWorldInfoActivationsResponse,
  isCanonicalizationPart,
  mergeEntryPromptVisibilityMeta,
  pickPreviousUserEntries,
  renderUserInputWithLiquid,
  resolveActiveUndoCascade,
  resolveContinueUserTurnTarget,
  resolveRestoredPartId,
} from "../application/chat-runtime/chat-entry-helpers";

import type { Entry, Part, Variant } from "@shared/types/chat-entry-parts";

describe("buildUserEntryMeta", () => {
  test("includes personaSnapshot when selected persona exists", () => {
    const meta = buildUserEntryMeta({
      requestId: "req-1",
      selectedUser: {
        id: "persona-1",
        name: "Alice",
        avatarUrl: "/media/persona/alice.png",
      },
    });

    expect(meta).toEqual({
      requestId: "req-1",
      personaSnapshot: {
        id: "persona-1",
        name: "Alice",
        avatarUrl: "/media/persona/alice.png",
      },
    });
  });

  test("omits personaSnapshot when persona is not selected", () => {
    const meta = buildUserEntryMeta({
      requestId: "req-2",
      selectedUser: null,
    });

    expect(meta).toEqual({
      requestId: "req-2",
    });
  });

  test("keeps requestId nullable fallback", () => {
    const meta = buildUserEntryMeta({
      selectedUser: null,
    });

    expect(meta).toEqual({
      requestId: null,
    });
  });

  test("includes template render metadata when provided", () => {
    const meta = buildUserEntryMeta({
      requestId: "req-liquid",
      selectedUser: null,
      templateRender: {
        engine: "liquidjs",
        rawContent: "Hi {{user}}",
        renderedContent: "Hi Alice",
        changed: true,
        renderedAt: "2026-02-10T00:00:00.000Z",
      },
    });

    expect(meta).toEqual({
      requestId: "req-liquid",
      templateRender: {
        engine: "liquidjs",
        rawContent: "Hi {{user}}",
        renderedContent: "Hi Alice",
        changed: true,
        renderedAt: "2026-02-10T00:00:00.000Z",
      },
    });
  });

  test("continue target validation fails when last entry is not user", () => {
    const lastEntry: Entry = {
      entryId: "assistant-entry-1",
      chatId: "chat-1",
      branchId: "branch-1",
      role: "assistant",
      createdAt: Date.now(),
      activeVariantId: "variant-1",
    };

    expect(() =>
      resolveContinueUserTurnTarget({
        lastEntry,
        lastVariant: null,
      })
    ).toThrowError(HttpError);
  });

  test("continue target validation fails when user entry has no editable main part", () => {
    const lastEntry: Entry = {
      entryId: "user-entry-1",
      chatId: "chat-1",
      branchId: "branch-1",
      role: "user",
      createdAt: Date.now(),
      activeVariantId: "variant-1",
    };
    const lastVariant: Variant = {
      variantId: "variant-1",
      entryId: "user-entry-1",
      kind: "manual_edit",
      createdAt: Date.now(),
      parts: [
        {
          partId: "part-1",
          channel: "aux",
          order: 0,
          payload: "not-main",
          payloadFormat: "markdown",
          visibility: { ui: "always", prompt: true },
          ui: { rendererId: "markdown" },
          prompt: { serializerId: "asText" },
          lifespan: "infinite",
          createdTurn: 1,
          source: "user",
        },
      ],
    };

    expect(() =>
      resolveContinueUserTurnTarget({
        lastEntry,
        lastVariant,
      })
    ).toThrowError(HttpError);
  });

  test("continue target validation returns user entry and editable main part", () => {
    const lastEntry: Entry = {
      entryId: "user-entry-1",
      chatId: "chat-1",
      branchId: "branch-1",
      role: "user",
      createdAt: Date.now(),
      activeVariantId: "variant-1",
    };
    const lastVariant: Variant = {
      variantId: "variant-1",
      entryId: "user-entry-1",
      kind: "manual_edit",
      createdAt: Date.now(),
      parts: [
        {
          partId: "part-old",
          channel: "main",
          order: 0,
          payload: "hello",
          payloadFormat: "markdown",
          visibility: { ui: "always", prompt: true },
          ui: { rendererId: "markdown" },
          prompt: { serializerId: "asText" },
          lifespan: "infinite",
          createdTurn: 1,
          source: "user",
        },
        {
          partId: "part-new",
          channel: "main",
          order: 1,
          payload: "hello-v2",
          payloadFormat: "text",
          visibility: { ui: "always", prompt: true },
          ui: { rendererId: "markdown" },
          prompt: { serializerId: "asText" },
          lifespan: "infinite",
          createdTurn: 2,
          source: "user",
        },
      ],
    };

    expect(
      resolveContinueUserTurnTarget({
        lastEntry,
        lastVariant,
      })
    ).toEqual({
      userEntryId: "user-entry-1",
      userMainPartId: "part-new",
    });
  });

  test("continue target prefers active replacement part from projection chain", () => {
    const lastEntry: Entry = {
      entryId: "user-entry-1",
      chatId: "chat-1",
      branchId: "branch-1",
      role: "user",
      createdAt: Date.now(),
      activeVariantId: "variant-1",
    };
    const lastVariant: Variant = {
      variantId: "variant-1",
      entryId: "user-entry-1",
      kind: "manual_edit",
      createdAt: Date.now(),
      parts: [
        {
          partId: "part-orig",
          channel: "main",
          order: 0,
          payload: "hello",
          payloadFormat: "markdown",
          visibility: { ui: "always", prompt: true },
          ui: { rendererId: "markdown" },
          prompt: { serializerId: "asText" },
          lifespan: "infinite",
          createdTurn: 1,
          source: "user",
        },
        {
          partId: "part-canon",
          channel: "main",
          order: 0,
          payload: "hello normalized",
          payloadFormat: "markdown",
          visibility: { ui: "always", prompt: true },
          ui: { rendererId: "markdown" },
          prompt: { serializerId: "asText" },
          lifespan: "infinite",
          createdTurn: 1,
          source: "agent",
          replacesPartId: "part-orig",
          tags: ["canonicalization"],
        },
      ],
    };

    expect(
      resolveContinueUserTurnTarget({
        lastEntry,
        lastVariant,
        currentTurn: 10,
      })
    ).toEqual({
      userEntryId: "user-entry-1",
      userMainPartId: "part-canon",
    });
  });

  test("pickPreviousUserEntries returns users before anchor from nearest to oldest", () => {
    const entries: Entry[] = [
      {
        entryId: "system-1",
        chatId: "chat-1",
        branchId: "branch-1",
        role: "system",
        createdAt: 1,
        activeVariantId: "variant-system",
      },
      {
        entryId: "user-1",
        chatId: "chat-1",
        branchId: "branch-1",
        role: "user",
        createdAt: 2,
        activeVariantId: "variant-user-1",
      },
      {
        entryId: "assistant-1",
        chatId: "chat-1",
        branchId: "branch-1",
        role: "assistant",
        createdAt: 3,
        activeVariantId: "variant-assistant-1",
      },
      {
        entryId: "user-2",
        chatId: "chat-1",
        branchId: "branch-1",
        role: "user",
        createdAt: 4,
        activeVariantId: "variant-user-2",
      },
      {
        entryId: "assistant-target",
        chatId: "chat-1",
        branchId: "branch-1",
        role: "assistant",
        createdAt: 5,
        activeVariantId: "variant-assistant-target",
      },
    ];

    const picked = pickPreviousUserEntries({
      entries,
      anchorEntryId: "assistant-target",
    });

    expect(picked.map((entry) => entry.entryId)).toEqual(["user-2", "user-1"]);
  });

  test("pickPreviousUserEntries skips soft-deleted user entries", () => {
    const entries: Entry[] = [
      {
        entryId: "user-deleted",
        chatId: "chat-1",
        branchId: "branch-1",
        role: "user",
        createdAt: 1,
        activeVariantId: "variant-user-deleted",
        softDeleted: true,
      },
      {
        entryId: "assistant-target",
        chatId: "chat-1",
        branchId: "branch-1",
        role: "assistant",
        createdAt: 2,
        activeVariantId: "variant-assistant-target",
      },
    ];

    const picked = pickPreviousUserEntries({
      entries,
      anchorEntryId: "assistant-target",
    });

    expect(picked).toEqual([]);
  });
});

describe("mergeEntryPromptVisibilityMeta", () => {
  test("preserves unrelated meta fields and adds excludedFromPrompt when includeInPrompt=false", () => {
    const next = mergeEntryPromptVisibilityMeta({
      existingMeta: { requestId: "req-1", custom: { a: 1 } },
      includeInPrompt: false,
    });

    expect(next).toEqual({
      requestId: "req-1",
      custom: { a: 1 },
      excludedFromPrompt: true,
    });
  });

  test("removes excludedFromPrompt when includeInPrompt=true", () => {
    const next = mergeEntryPromptVisibilityMeta({
      existingMeta: { requestId: "req-1", excludedFromPrompt: true },
      includeInPrompt: true,
    });

    expect(next).toEqual({ requestId: "req-1" });
  });

  test("returns null when only excludedFromPrompt was present and includeInPrompt=true", () => {
    const next = mergeEntryPromptVisibilityMeta({
      existingMeta: { excludedFromPrompt: true },
      includeInPrompt: true,
    });

    expect(next).toBeNull();
  });
});

describe("renderUserInputWithLiquid", () => {
  const context = {
    char: {},
    user: { name: "Alice" },
    chat: {},
    messages: [],
    rag: {},
    art: {},
    now: new Date("2026-02-10T00:00:00.000Z").toISOString(),
  };

  test("returns same text for plain input", async () => {
    const rendered = await renderUserInputWithLiquid({
      content: "Just text",
      context,
    });

    expect(rendered).toEqual({
      renderedContent: "Just text",
      changed: false,
    });
  });

  test("renders valid liquid template", async () => {
    const rendered = await renderUserInputWithLiquid({
      content: "Hi {{user.name}}",
      context,
    });

    expect(rendered).toEqual({
      renderedContent: "Hi Alice",
      changed: true,
    });
  });

  test("renders nested liquid values recursively up to depth 3", async () => {
    const rendered = await renderUserInputWithLiquid({
      content: "{{description}}",
      context: {
        ...context,
        description: "{{persona}}",
        persona: "{{user.name}}",
      },
    });

    expect(rendered).toEqual({
      renderedContent: "Alice",
      changed: true,
    });
  });

  test("throws HttpError on liquid syntax error", async () => {
    await expect(
      renderUserInputWithLiquid({
        content: "Hi {{",
        context,
      })
    ).rejects.toBeInstanceOf(HttpError);
  });

  test("throws HttpError when rendered output is empty", async () => {
    await expect(
      renderUserInputWithLiquid({
        content: "{{missing.value}}",
        context,
      })
    ).rejects.toBeInstanceOf(HttpError);
  });

  test("allows empty rendered output when allowEmptyResult=true", async () => {
    const rendered = await renderUserInputWithLiquid({
      content: "{{missing.value}}",
      context,
      options: { allowEmptyResult: true },
    });

    expect(rendered).toEqual({
      renderedContent: "",
      changed: true,
    });
  });
});

describe("prompt diagnostics helpers", () => {
  test("buildPromptDiagnosticsFromDebug returns normalized payload", () => {
    const data = buildPromptDiagnosticsFromDebug({
      generation: {
        id: "gen-1",
        chatId: "chat-1",
        branchId: "branch-1",
        messageId: null,
        variantId: "variant-1",
        status: "done",
        startedAt: new Date("2026-02-12T12:00:00.000Z"),
        finishedAt: new Date("2026-02-12T12:00:05.000Z"),
        error: null,
        promptHash: "hash-1",
        promptSnapshot: null,
        debug: {
          estimator: "chars_div4",
          prompt: {
            messages: [{ role: "system", content: "sys" }],
            approxTokens: {
              total: 3,
              byRole: { system: 3, user: 0, assistant: 0 },
              sections: {
                systemInstruction: 3,
                chatHistory: 0,
                worldInfoBefore: 0,
                worldInfoAfter: 0,
                worldInfoDepth: 0,
                worldInfoOutlets: 0,
                worldInfoAN: 0,
                worldInfoEM: 0,
              },
            },
          },
        },
      },
      entryId: "entry-1",
      variantId: "variant-1",
    });

    expect(data).toEqual(
      expect.objectContaining({
        generationId: "gen-1",
        entryId: "entry-1",
        variantId: "variant-1",
        estimator: "chars_div4",
        prompt: expect.objectContaining({
          messages: [{ role: "system", content: "sys" }],
        }),
        turnCanonicalizations: [],
      })
    );
  });

  test("buildPromptDiagnosticsFromDebug includes user turn canonicalization history", () => {
    const data = buildPromptDiagnosticsFromDebug({
      generation: {
        id: "gen-1",
        chatId: "chat-1",
        branchId: "branch-1",
        messageId: null,
        variantId: "variant-1",
        status: "done",
        startedAt: new Date("2026-02-12T12:00:00.000Z"),
        finishedAt: new Date("2026-02-12T12:00:05.000Z"),
        error: null,
        promptHash: "hash-1",
        promptSnapshot: null,
        debug: {
          estimator: "chars_div4",
          prompt: {
            messages: [{ role: "system", content: "sys" }],
            approxTokens: {
              total: 3,
              byRole: { system: 3, user: 0, assistant: 0 },
              sections: {
                systemInstruction: 3,
                chatHistory: 0,
                worldInfoBefore: 0,
                worldInfoAfter: 0,
                worldInfoDepth: 0,
                worldInfoOutlets: 0,
                worldInfoAN: 0,
                worldInfoEM: 0,
              },
            },
          },
          operations: {
            turnUserCanonicalization: [
              {
                hook: "before_main_llm",
                opId: "canon-op",
                userEntryId: "user-entry-1",
                userMainPartId: "part-1",
                replacedPartId: "part-1",
                canonicalPartId: "part-2",
                beforeText: "raw",
                afterText: "normalized",
                committedAt: "2026-02-12T12:00:01.000Z",
              },
            ],
          },
        },
      },
      entryId: "entry-1",
      variantId: "variant-1",
    });

    expect(data?.turnCanonicalizations).toEqual([
      {
        hook: "before_main_llm",
        opId: "canon-op",
        userEntryId: "user-entry-1",
        userMainPartId: "part-1",
        replacedPartId: "part-1",
        canonicalPartId: "part-2",
        beforeText: "raw",
        afterText: "normalized",
        committedAt: "2026-02-12T12:00:01.000Z",
      },
    ]);
  });

  test("buildPromptDiagnosticsFromSnapshot falls back when debug is missing", () => {
    const data = buildPromptDiagnosticsFromSnapshot({
      generation: {
        id: "gen-2",
        chatId: "chat-1",
        branchId: "branch-1",
        messageId: null,
        variantId: "variant-1",
        status: "done",
        startedAt: new Date("2026-02-12T12:10:00.000Z"),
        finishedAt: new Date("2026-02-12T12:10:05.000Z"),
        error: null,
        promptHash: "hash-2",
        debug: null,
        promptSnapshot: {
          v: 1,
          messages: [
            { role: "system", content: "sys" },
            { role: "user", content: "hello" },
          ],
          truncated: false,
          meta: {
            historyLimit: 50,
            historyReturnedCount: 1,
            worldInfo: {
              activatedCount: 1,
              beforeChars: 24,
              afterChars: 0,
              warnings: [],
            },
          },
        },
      },
      entryId: "entry-1",
      variantId: "variant-1",
    });

    expect(data?.prompt.approxTokens.sections.worldInfoBefore).toBeGreaterThan(0);
    expect(data?.prompt.messages).toHaveLength(2);
  });

  test("buildLatestWorldInfoActivationsFromGeneration extracts entries", () => {
    const data = buildLatestWorldInfoActivationsFromGeneration({
      id: "gen-3",
      chatId: "chat-1",
      branchId: "branch-1",
      messageId: null,
      variantId: "variant-1",
      status: "done",
      startedAt: new Date("2026-02-12T13:00:00.000Z"),
      finishedAt: new Date("2026-02-12T13:00:05.000Z"),
      error: null,
      promptHash: "hash-3",
      promptSnapshot: null,
      debug: {
        worldInfo: {
          activatedCount: 1,
          warnings: ["w1"],
          entries: [
            {
              hash: "h1",
              bookId: "book-1",
              bookName: "Book",
              uid: 7,
              comment: "Entry",
              content: "Lore",
              matchedKeys: ["dragon"],
              reasons: ["key_match"],
            },
          ],
        },
      },
    });

    expect(data?.generationId).toBe("gen-3");
    expect(data?.entries[0]?.matchedKeys).toEqual(["dragon"]);
    expect(data?.warnings).toEqual(["w1"]);
  });

  test("emptyLatestWorldInfoActivationsResponse returns null-like payload", () => {
    expect(emptyLatestWorldInfoActivationsResponse()).toEqual({
      generationId: null,
      startedAt: null,
      status: null,
      activatedCount: 0,
      warnings: [],
      entries: [],
    });
  });
});

describe("entry prompt usage helpers", () => {
  test("buildPromptApproxTokensByEntryId computes chars_div4 tokens", () => {
    const byEntry = buildPromptApproxTokensByEntryId([
      { entryId: "entry-1", content: "1234" },
      { entryId: "entry-2", content: "12345" },
    ]);

    expect(byEntry.get("entry-1")).toBe(1);
    expect(byEntry.get("entry-2")).toBe(2);
  });

  test("buildEntryPromptUsage returns 0 when entry is outside prompt window", () => {
    const usage = buildEntryPromptUsage({
      entryId: "entry-outside",
      approxTokensByEntryId: new Map<string, number>([
        ["entry-in-window", 7],
      ]),
    });

    expect(usage).toEqual({
      estimator: "chars_div4",
      included: false,
      approxTokens: 0,
    });
  });
});

describe("canonicalization undo helpers", () => {
  function makeMainPart(params: {
    partId: string;
    payload: string;
    source: "user" | "agent";
    replacesPartId?: string;
    softDeleted?: boolean;
    tags?: string[];
  }): Part {
    return {
      partId: params.partId,
      channel: "main",
      order: 0,
      payload: params.payload,
      payloadFormat: "markdown",
      visibility: { ui: "always", prompt: true },
      ui: { rendererId: "markdown" },
      prompt: { serializerId: "asText" },
      lifespan: "infinite",
      createdTurn: 1,
      source: params.source,
      replacesPartId: params.replacesPartId,
      softDeleted: params.softDeleted,
      tags: params.tags,
    };
  }

  test("isCanonicalizationPart detects canonical replacement main part", () => {
    expect(
      isCanonicalizationPart(
        makeMainPart({
          partId: "canon-1",
          payload: "normalized",
          source: "agent",
          replacesPartId: "part-1",
          tags: ["canonicalization"],
        })
      )
    ).toBe(true);

    expect(
      isCanonicalizationPart(
        makeMainPart({
          partId: "user-1",
          payload: "raw",
          source: "user",
        })
      )
    ).toBe(false);
  });

  test("resolveActiveUndoCascade returns selected step and all active descendants", () => {
    const parts: Part[] = [
      makeMainPart({ partId: "part-1", payload: "raw", source: "user" }),
      makeMainPart({
        partId: "canon-1",
        payload: "v1",
        source: "agent",
        replacesPartId: "part-1",
        tags: ["canonicalization"],
      }),
      makeMainPart({
        partId: "canon-2",
        payload: "v2",
        source: "agent",
        replacesPartId: "canon-1",
        tags: ["canonicalization"],
      }),
      makeMainPart({
        partId: "canon-3-soft",
        payload: "v3",
        source: "agent",
        replacesPartId: "canon-2",
        tags: ["canonicalization"],
        softDeleted: true,
      }),
    ];

    expect(
      resolveActiveUndoCascade({
        startPartId: "canon-1",
        parts,
      })
    ).toEqual(["canon-1", "canon-2"]);
  });

  test("resolveRestoredPartId skips undone chain and returns nearest active parent", () => {
    const parts: Part[] = [
      makeMainPart({ partId: "part-1", payload: "raw", source: "user" }),
      makeMainPart({
        partId: "canon-1",
        payload: "v1",
        source: "agent",
        replacesPartId: "part-1",
        tags: ["canonicalization"],
      }),
      makeMainPart({
        partId: "canon-2",
        payload: "v2",
        source: "agent",
        replacesPartId: "canon-1",
        tags: ["canonicalization"],
      }),
    ];

    expect(
      resolveRestoredPartId({
        startReplacesPartId: "canon-1",
        parts,
        undonePartIds: ["canon-1", "canon-2"],
      })
    ).toBe("part-1");
  });
});

describe("batch update entry parts helpers", () => {
  function makePart(params: {
    partId: string;
    channel?: Part["channel"];
    order?: number;
    payload?: Part["payload"];
    payloadFormat?: Part["payloadFormat"];
    visibility?: Part["visibility"];
    replacesPartId?: string;
    softDeleted?: boolean;
  }): Part {
    return {
      partId: params.partId,
      channel: params.channel ?? "aux",
      order: params.order ?? 0,
      payload: params.payload ?? "",
      payloadFormat: params.payloadFormat ?? "markdown",
      visibility: params.visibility ?? { ui: "always", prompt: true },
      ui: { rendererId: "markdown" },
      prompt: { serializerId: "asText" },
      lifespan: "infinite",
      createdTurn: 1,
      source: "user",
      replacesPartId: params.replacesPartId,
      softDeleted: params.softDeleted,
    };
  }

  test("assertBatchUpdateVariantIsActive throws 409 on stale variant", () => {
    const entry: Entry = {
      entryId: "entry-1",
      chatId: "chat-1",
      branchId: "branch-1",
      role: "assistant",
      createdAt: 1,
      activeVariantId: "variant-active",
    };

    expect(() =>
      assertBatchUpdateVariantIsActive({
        entry,
        requestedVariantId: "variant-stale",
      })
    ).toThrowError(HttpError);
  });

  test("buildBatchUpdatePartPlan returns valid plan", () => {
    const parts: Part[] = [
      makePart({
        partId: "part-main",
        channel: "main",
        order: 0,
        payload: "main text",
        payloadFormat: "markdown",
      }),
      makePart({
        partId: "part-alt",
        channel: "aux",
        order: 10,
        payload: "alt text",
        payloadFormat: "text",
      }),
      makePart({
        partId: "part-json",
        channel: "aux",
        order: 20,
        payload: { a: 1 },
        payloadFormat: "json",
      }),
    ];

    const plan = buildBatchUpdatePartPlan({
      variantParts: parts,
      nowMs: 100,
      body: {
        variantId: "variant-1",
        mainPartId: "part-alt",
        orderedPartIds: ["part-main", "part-alt", "part-json"],
        parts: [
          {
            partId: "part-main",
            deleted: false,
            visibility: { ui: "always", prompt: true },
            payload: "main edited",
          },
          {
            partId: "part-alt",
            deleted: false,
            visibility: { ui: "always", prompt: true },
            payload: "alt edited",
          },
          {
            partId: "part-json",
            deleted: false,
            visibility: { ui: "never", prompt: false },
            payload: { ok: true },
          },
        ],
      },
    });

    expect(plan.mainPartId).toBe("part-alt");
    expect(plan.deletedPartIds).toEqual([]);
    expect(plan.updatedPartIds).toEqual(["part-main", "part-alt", "part-json"]);
    expect(plan.patches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          partId: "part-alt",
          channel: "main",
          order: 0,
          replacesPartId: null,
          payload: "alt edited",
        }),
        expect.objectContaining({
          partId: "part-main",
          channel: "aux",
          order: 10,
          payload: "main edited",
        }),
        expect.objectContaining({
          partId: "part-json",
          channel: "aux",
          order: 20,
          visibility: { ui: "never", prompt: false },
          payload: { ok: true },
        }),
      ])
    );
  });

  test("buildBatchUpdatePartPlan rejects non-text main", () => {
    const parts: Part[] = [
      makePart({
        partId: "part-main",
        channel: "main",
        order: 0,
        payload: "main text",
        payloadFormat: "markdown",
      }),
      makePart({
        partId: "part-json",
        channel: "aux",
        order: 10,
        payload: { a: 1 },
        payloadFormat: "json",
      }),
    ];

    expect(() =>
      buildBatchUpdatePartPlan({
        variantParts: parts,
        body: {
          variantId: "variant-1",
          mainPartId: "part-json",
          orderedPartIds: ["part-main", "part-json"],
          parts: [
            {
              partId: "part-main",
              deleted: false,
              visibility: { ui: "always", prompt: true },
              payload: "main text",
            },
            {
              partId: "part-json",
              deleted: false,
              visibility: { ui: "always", prompt: false },
              payload: { a: 2 },
            },
          ],
        },
      })
    ).toThrowError(HttpError);
  });

  test("buildBatchUpdatePartPlan rejects delete-all", () => {
    const parts: Part[] = [
      makePart({
        partId: "part-main",
        channel: "main",
        order: 0,
        payload: "main text",
        payloadFormat: "markdown",
      }),
    ];

    expect(() =>
      buildBatchUpdatePartPlan({
        variantParts: parts,
        body: {
          variantId: "variant-1",
          mainPartId: "part-main",
          orderedPartIds: ["part-main"],
          parts: [
            {
              partId: "part-main",
              deleted: true,
              visibility: { ui: "always", prompt: true },
              payload: "main text",
            },
          ],
        },
      })
    ).toThrowError(HttpError);
  });

  test("buildBatchUpdatePartPlan rejects orderedPartIds mismatch", () => {
    const parts: Part[] = [
      makePart({
        partId: "part-main",
        channel: "main",
        order: 0,
        payload: "main text",
        payloadFormat: "markdown",
      }),
      makePart({
        partId: "part-aux",
        channel: "aux",
        order: 10,
        payload: "aux text",
        payloadFormat: "text",
      }),
    ];

    expect(() =>
      buildBatchUpdatePartPlan({
        variantParts: parts,
        body: {
          variantId: "variant-1",
          mainPartId: "part-main",
          orderedPartIds: ["part-main"],
          parts: [
            {
              partId: "part-main",
              deleted: false,
              visibility: { ui: "always", prompt: true },
              payload: "main text",
            },
            {
              partId: "part-aux",
              deleted: false,
              visibility: { ui: "always", prompt: true },
              payload: "aux text",
            },
          ],
        },
      })
    ).toThrowError(HttpError);
  });

  test("buildBatchUpdatePartPlan detaches replacement descendants when selected main changes", () => {
    const parts: Part[] = [
      makePart({
        partId: "part-main",
        channel: "main",
        order: 0,
        payload: "main text",
        payloadFormat: "markdown",
      }),
      makePart({
        partId: "part-descendant",
        channel: "aux",
        order: 10,
        payload: "derived",
        payloadFormat: "text",
        replacesPartId: "part-main",
      }),
      makePart({
        partId: "part-other",
        channel: "aux",
        order: 20,
        payload: "other",
        payloadFormat: "text",
      }),
    ];

    const plan = buildBatchUpdatePartPlan({
      variantParts: parts,
      body: {
        variantId: "variant-1",
        mainPartId: "part-main",
        orderedPartIds: ["part-main", "part-descendant", "part-other"],
        parts: [
          {
            partId: "part-main",
            deleted: false,
            visibility: { ui: "always", prompt: true },
            payload: "main text",
          },
          {
            partId: "part-descendant",
            deleted: false,
            visibility: { ui: "always", prompt: true },
            payload: "derived",
          },
          {
            partId: "part-other",
            deleted: false,
            visibility: { ui: "always", prompt: true },
            payload: "other",
          },
        ],
      },
    });

    const descendant = plan.patches.find((item) => item.partId === "part-descendant");
    expect(descendant?.replacesPartId).toBeNull();
  });
});
