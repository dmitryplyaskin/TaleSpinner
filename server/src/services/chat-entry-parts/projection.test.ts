import { describe, expect, it } from "vitest";

import { getPromptProjection, getPromptProjectionWithEntryIds, getUiProjection } from "./projection";
import { serializePart } from "./prompt-serializers";

import type { Entry, Part, Variant } from "@shared/types/chat-entry-parts";

function mkEntry(params: Partial<Entry> & Pick<Entry, "entryId" | "role">): Entry {
  return {
    entryId: params.entryId,
    chatId: params.chatId ?? "c1",
    branchId: params.branchId ?? "b1",
    role: params.role,
    createdAt: params.createdAt ?? Date.now(),
    activeVariantId: params.activeVariantId ?? "v1",
    softDeleted: params.softDeleted,
    meta: params.meta,
  };
}

function mkVariant(params: Partial<Variant> & Pick<Variant, "variantId" | "entryId">): Variant {
  return {
    variantId: params.variantId,
    entryId: params.entryId,
    kind: params.kind ?? "generation",
    createdAt: params.createdAt ?? Date.now(),
    parts: params.parts ?? [],
    derived: params.derived,
  };
}

function mkPart(params: Partial<Part> & Pick<Part, "partId" | "channel" | "order">): Part {
  return {
    partId: params.partId,
    channel: params.channel,
    order: params.order,
    payload: params.payload ?? "",
    payloadFormat: params.payloadFormat ?? "markdown",
    visibility: params.visibility ?? { ui: "always", prompt: true },
    ui: params.ui ?? { rendererId: "markdown" },
    prompt: params.prompt ?? { serializerId: "asText" },
    lifespan: params.lifespan ?? "infinite",
    createdTurn: params.createdTurn ?? 0,
    source: params.source ?? "llm",
    replacesPartId: params.replacesPartId,
    softDeleted: params.softDeleted,
  };
}

describe("chat-entry-parts projection", () => {
  it("filters TTL-expired parts in UI projection", () => {
    const entry = mkEntry({ entryId: "e1", role: "assistant" });
    const variant = mkVariant({
      variantId: "v1",
      entryId: "e1",
      parts: [
        mkPart({
          partId: "p1",
          channel: "aux",
          order: 10,
          payload: "old",
          lifespan: { turns: 1 },
          createdTurn: 0,
        }),
        mkPart({
          partId: "p2",
          channel: "main",
          order: 0,
          payload: "main",
          lifespan: "infinite",
          createdTurn: 0,
        }),
      ],
    });

    const visible = getUiProjection(entry, variant, 1, { debugEnabled: false });
    expect(visible.map((p) => p.partId)).toEqual(["p2"]);
  });

  it("hides replaced originals in UI projection", () => {
    const entry = mkEntry({ entryId: "e1", role: "assistant" });
    const orig = mkPart({ partId: "orig", channel: "main", order: 0, payload: "A" });
    const repl = mkPart({
      partId: "repl",
      channel: "main",
      order: 0,
      payload: "B",
      replacesPartId: "orig",
      createdTurn: 2,
    });
    const variant = mkVariant({ variantId: "v1", entryId: "e1", parts: [orig, repl] });
    const visible = getUiProjection(entry, variant, 10, { debugEnabled: false });
    expect(visible.map((p) => p.partId)).toEqual(["repl"]);
  });

  it("resolves replacement conflicts deterministically (prefer higher createdTurn)", () => {
    const entry = mkEntry({ entryId: "e1", role: "assistant" });
    const orig = mkPart({ partId: "orig", channel: "main", order: 0, payload: "A", createdTurn: 0 });
    const r1 = mkPart({ partId: "r1", channel: "main", order: 0, payload: "B", replacesPartId: "orig", createdTurn: 1 });
    const r2 = mkPart({ partId: "r2", channel: "main", order: 0, payload: "C", replacesPartId: "orig", createdTurn: 3 });
    const variant = mkVariant({ variantId: "v1", entryId: "e1", parts: [orig, r1, r2] });
    const visible = getUiProjection(entry, variant, 10, { debugEnabled: false });
    expect(visible.map((p) => p.partId)).toEqual(["r2"]);
  });

  it("ignores soft-deleted replacers when choosing active projection", () => {
    const entry = mkEntry({ entryId: "e1", role: "assistant" });
    const orig = mkPart({ partId: "orig", channel: "main", order: 0, payload: "A", createdTurn: 0 });
    const repl = mkPart({
      partId: "repl",
      channel: "main",
      order: 0,
      payload: "B",
      replacesPartId: "orig",
      createdTurn: 2,
      softDeleted: true,
    });
    const variant = mkVariant({ variantId: "v1", entryId: "e1", parts: [orig, repl] });
    const visible = getUiProjection(entry, variant, 10, { debugEnabled: false });
    expect(visible.map((p) => p.partId)).toEqual(["orig"]);
  });

  it("includes only prompt-visible parts in prompt projection", () => {
    const entry = mkEntry({ entryId: "e1", role: "user" });
    const variant = mkVariant({
      variantId: "v1",
      entryId: "e1",
      parts: [
        mkPart({
          partId: "ui_only",
          channel: "aux",
          order: 10,
          payload: "debug",
          visibility: { ui: "always", prompt: false },
        }),
        mkPart({
          partId: "prompt",
          channel: "main",
          order: 0,
          payload: "hello",
          visibility: { ui: "always", prompt: true },
        }),
      ],
    });

    const msgs = getPromptProjection({
      entries: [{ entry, variant }],
      currentTurn: 0,
      serializePart,
    });

    expect(msgs).toEqual([{ role: "user", content: "hello" }]);
  });

  it("returns entry ids for prompt-visible messages", () => {
    const userEntry = mkEntry({ entryId: "e-user", role: "user" });
    const assistantEntry = mkEntry({ entryId: "e-assistant", role: "assistant", createdAt: userEntry.createdAt + 1 });
    const userVariant = mkVariant({
      variantId: "v-user",
      entryId: "e-user",
      parts: [
        mkPart({
          partId: "user-main",
          channel: "main",
          order: 0,
          payload: "hello",
          visibility: { ui: "always", prompt: true },
        }),
      ],
    });
    const assistantVariant = mkVariant({
      variantId: "v-assistant",
      entryId: "e-assistant",
      parts: [
        mkPart({
          partId: "assistant-main",
          channel: "main",
          order: 0,
          payload: "hi",
          visibility: { ui: "always", prompt: true },
        }),
      ],
    });

    const projected = getPromptProjectionWithEntryIds({
      entries: [
        { entry: userEntry, variant: userVariant },
        { entry: assistantEntry, variant: assistantVariant },
      ],
      currentTurn: 0,
      serializePart,
    });

    expect(projected).toEqual([
      { entryId: "e-user", role: "user", content: "hello" },
      { entryId: "e-assistant", role: "assistant", content: "hi" },
    ]);
  });

  it("excludes entries marked as excludedFromPrompt from prompt projection", () => {
    const entry = mkEntry({
      entryId: "e1",
      role: "assistant",
      meta: { excludedFromPrompt: true },
    });
    const variant = mkVariant({
      variantId: "v1",
      entryId: "e1",
      parts: [
        mkPart({
          partId: "main",
          channel: "main",
          order: 0,
          payload: "hidden from prompt",
          visibility: { ui: "always", prompt: true },
        }),
      ],
    });

    const msgs = getPromptProjection({
      entries: [{ entry, variant }],
      currentTurn: 0,
      serializePart,
    });

    expect(msgs).toEqual([]);
  });

  it("excludes entries marked as excludedFromPrompt from projection with entry ids", () => {
    const entry = mkEntry({
      entryId: "e1",
      role: "assistant",
      meta: { excludedFromPrompt: true },
    });
    const variant = mkVariant({
      variantId: "v1",
      entryId: "e1",
      parts: [
        mkPart({
          partId: "main",
          channel: "main",
          order: 0,
          payload: "hidden",
          visibility: { ui: "always", prompt: true },
        }),
      ],
    });

    const projected = getPromptProjectionWithEntryIds({
      entries: [{ entry, variant }],
      currentTurn: 0,
      serializePart,
    });

    expect(projected).toEqual([]);
  });

  it("applies replacement and ttl filters in projection with entry ids", () => {
    const entry = mkEntry({ entryId: "e1", role: "assistant" });
    const variant = mkVariant({
      variantId: "v1",
      entryId: "e1",
      parts: [
        mkPart({
          partId: "old-main",
          channel: "main",
          order: 0,
          payload: "old",
          createdTurn: 1,
          visibility: { ui: "always", prompt: true },
        }),
        mkPart({
          partId: "new-main",
          channel: "main",
          order: 0,
          payload: "new",
          createdTurn: 2,
          replacesPartId: "old-main",
          visibility: { ui: "always", prompt: true },
        }),
        mkPart({
          partId: "ttl-expired",
          channel: "aux",
          order: 10,
          payload: "expired",
          createdTurn: 0,
          lifespan: { turns: 1 },
          visibility: { ui: "always", prompt: true },
        }),
      ],
    });

    const projected = getPromptProjectionWithEntryIds({
      entries: [{ entry, variant }],
      currentTurn: 5,
      serializePart,
    });

    expect(projected).toEqual([{ entryId: "e1", role: "assistant", content: "new" }]);
  });
});

