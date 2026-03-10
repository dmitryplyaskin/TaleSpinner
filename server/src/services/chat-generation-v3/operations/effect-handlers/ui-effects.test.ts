import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getBranchCurrentTurn: vi.fn(),
  listEntriesWithActiveVariants: vi.fn(),
  getEntryById: vi.fn(),
  getActiveVariantWithParts: vi.fn(),
  getPartWithVariantContextById: vi.fn(),
  createPart: vi.fn(),
}));

vi.mock("../../../chat-entry-parts/branch-turn-repository", () => ({
  getBranchCurrentTurn: mocks.getBranchCurrentTurn,
}));

vi.mock("../../../chat-entry-parts/entries-repository", () => ({
  listEntriesWithActiveVariants: mocks.listEntriesWithActiveVariants,
  getEntryById: mocks.getEntryById,
  getActiveVariantWithParts: mocks.getActiveVariantWithParts,
}));

vi.mock("../../../chat-entry-parts/parts-repository", () => ({
  getPartWithVariantContextById: mocks.getPartWithVariantContextById,
  createPart: mocks.createPart,
}));

import { persistUiInlineEffect } from "./ui-effects";

describe("persistUiInlineEffect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getBranchCurrentTurn.mockResolvedValue(7);
    mocks.listEntriesWithActiveVariants.mockResolvedValue([]);
    mocks.getEntryById.mockResolvedValue({
      entryId: "user-entry-current",
      chatId: "chat-1",
      branchId: "branch-1",
      role: "user",
      createdAt: 100,
      activeVariantId: "variant-current",
    });
    mocks.getActiveVariantWithParts.mockResolvedValue({
      variantId: "variant-current",
      entryId: "user-entry-current",
      kind: "generation",
      createdAt: 100,
      parts: [
        {
          partId: "user-main-current",
          channel: "main",
          order: 10,
          payload: "hello",
          payloadFormat: "markdown",
          visibility: { ui: "always", prompt: true },
          prompt: { serializerId: "asText" },
          ui: { rendererId: "markdown" },
          lifespan: "infinite",
          createdTurn: 1,
          source: "user",
        },
      ],
    });
    mocks.getPartWithVariantContextById.mockResolvedValue({
      entryId: "user-entry-current",
      variantId: "variant-current",
      part: {
        partId: "user-main-current",
        channel: "main",
        order: 10,
        payload: "hello",
        payloadFormat: "markdown",
        visibility: { ui: "always", prompt: true },
        prompt: { serializerId: "asText" },
        ui: { rendererId: "markdown" },
        lifespan: "infinite",
        createdTurn: 1,
        source: "user",
      },
    });
    mocks.createPart.mockResolvedValue({
      partId: "aux-inline",
      variantId: "variant-current",
    });
  });

  test("attaches inline UI part to current user target for after_last_user anchor", async () => {
    await persistUiInlineEffect({
      ownerId: "global",
      chatId: "chat-1",
      branchId: "branch-1",
      hook: "before_main_llm",
      effect: {
        type: "ui.inline",
        opId: "op-inline",
        role: "user",
        anchor: "after_last_user",
        payload: { summary: "note" },
        format: "json",
      },
      persistenceTarget: {
        mode: "entry_parts",
        assistantEntryId: "assistant-entry",
        assistantMainPartId: "assistant-main",
      },
      userTurnTarget: {
        mode: "entry_parts",
        userEntryId: "user-entry-current",
        userMainPartId: "user-main-current",
      },
    });

    expect(mocks.createPart).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: "global",
        variantId: "variant-current",
        channel: "aux",
        order: 20,
        payload: { summary: "note" },
        payloadFormat: "json",
        createdTurn: 7,
        visibility: { ui: "always", prompt: false },
        tags: ["artifact_exposure", "ui_inline"],
      })
    );
  });

  test("uses depth_from_end over matching role entries when current target is not applicable", async () => {
    mocks.listEntriesWithActiveVariants.mockResolvedValue([
      {
        entry: {
          entryId: "assistant-1",
          chatId: "chat-1",
          branchId: "branch-1",
          role: "assistant",
          createdAt: 10,
          activeVariantId: "variant-a1",
        },
        variant: {
          variantId: "variant-a1",
          entryId: "assistant-1",
          kind: "generation",
          createdAt: 10,
          parts: [
            {
              partId: "assistant-1-main",
              channel: "main",
              order: 10,
              payload: "a1",
              payloadFormat: "markdown",
              visibility: { ui: "always", prompt: true },
              prompt: { serializerId: "asText" },
              ui: { rendererId: "markdown" },
              lifespan: "infinite",
              createdTurn: 1,
              source: "llm",
            },
          ],
        },
      },
      {
        entry: {
          entryId: "assistant-2",
          chatId: "chat-1",
          branchId: "branch-1",
          role: "assistant",
          createdAt: 20,
          activeVariantId: "variant-a2",
        },
        variant: {
          variantId: "variant-a2",
          entryId: "assistant-2",
          kind: "generation",
          createdAt: 20,
          parts: [
            {
              partId: "assistant-2-main",
              channel: "main",
              order: 10,
              payload: "a2",
              payloadFormat: "markdown",
              visibility: { ui: "always", prompt: true },
              prompt: { serializerId: "asText" },
              ui: { rendererId: "markdown" },
              lifespan: "infinite",
              createdTurn: 2,
              source: "llm",
            },
          ],
        },
      },
    ]);

    await persistUiInlineEffect({
      ownerId: "global",
      chatId: "chat-1",
      branchId: "branch-1",
      hook: "before_main_llm",
      effect: {
        type: "ui.inline",
        opId: "op-inline",
        role: "assistant",
        anchor: "depth_from_end",
        depthFromEnd: 1,
        payload: "older-target",
        format: "markdown",
      },
      persistenceTarget: {
        mode: "entry_parts",
        assistantEntryId: "assistant-entry",
        assistantMainPartId: "assistant-main",
      },
    });

    expect(mocks.createPart).toHaveBeenCalledWith(
      expect.objectContaining({
        variantId: "variant-a1",
        payload: "older-target",
        payloadFormat: "markdown",
      })
    );
  });
});
