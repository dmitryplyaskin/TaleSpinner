import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveActiveWorldInfoBooks } from "./world-info-bindings";
import {
  getWorldInfoBooksByIds,
  listWorldInfoBindings,
} from "./world-info-repositories";

import type { WorldInfoBindingDto, WorldInfoBookDto } from "./world-info-types";

vi.mock("./world-info-repositories", () => ({
  listWorldInfoBindings: vi.fn(),
  getWorldInfoBooksByIds: vi.fn(),
}));

function makeBinding(
  id: string,
  patch: Partial<WorldInfoBindingDto>
): WorldInfoBindingDto {
  return {
    id,
    ownerId: "global",
    scope: "global",
    scopeId: null,
    bookId: `${id}-book`,
    bindingRole: "additional",
    displayOrder: 0,
    enabled: true,
    meta: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...patch,
  };
}

function makeBook(id: string): WorldInfoBookDto {
  return {
    id,
    ownerId: "global",
    slug: id,
    name: id,
    description: null,
    data: { entries: {}, extensions: {} },
    extensions: null,
    source: "native",
    version: 1,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    deletedAt: null,
  };
}

describe("resolveActiveWorldInfoBooks", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getWorldInfoBooksByIds).mockImplementation(async ({ ids }) =>
      ids.map((id) => makeBook(id))
    );
  });

  it("orders active bindings by global, entity, persona, then chat", async () => {
    vi.mocked(listWorldInfoBindings).mockImplementation(async ({ scope }) => {
      if (scope === "global") {
        return [
          makeBinding("global-2", {
            scope: "global",
            bookId: "book-global-2",
            displayOrder: 1,
          }),
          makeBinding("global-1", {
            scope: "global",
            bookId: "book-global-1",
            displayOrder: 0,
          }),
        ];
      }

      if (scope === "entity_profile") {
        return [
          makeBinding("entity-1", {
            scope: "entity_profile",
            scopeId: "entity-1",
            bookId: "book-entity-1",
          }),
        ];
      }

      if (scope === "persona") {
        return [
          makeBinding("persona-1", {
            scope: "persona",
            scopeId: "persona-1",
            bookId: "book-persona-1",
          }),
        ];
      }

      if (scope === "chat") {
        return [
          makeBinding("chat-1", {
            scope: "chat",
            scopeId: "chat-1",
            bookId: "book-chat-1",
          }),
        ];
      }

      return [];
    });

    const result = await resolveActiveWorldInfoBooks({
      ownerId: "global",
      chatId: "chat-1",
      entityProfileId: "entity-1",
      personaId: "persona-1",
      settings: { insertionStrategy: 2, characterStrategy: 0 },
    });

    expect(result.orderedBindings.map((item) => item.bookId)).toEqual([
      "book-global-1",
      "book-global-2",
      "book-entity-1",
      "book-persona-1",
      "book-chat-1",
    ]);
    expect(vi.mocked(getWorldInfoBooksByIds)).toHaveBeenCalledWith({
      ownerId: "global",
      ids: [
        "book-global-1",
        "book-global-2",
        "book-entity-1",
        "book-persona-1",
        "book-chat-1",
      ],
    });
    expect(result.orderedBooks.map((item) => item.id)).toEqual([
      "book-global-1",
      "book-global-2",
      "book-entity-1",
      "book-persona-1",
      "book-chat-1",
    ]);
  });

  it("filters disabled bindings and sorts legacy multi-bindings deterministically", async () => {
    vi.mocked(listWorldInfoBindings).mockImplementation(async ({ scope }) => {
      if (scope === "global") {
        return [
          makeBinding("late", {
            scope: "global",
            bookId: "book-late",
            displayOrder: 3,
          }),
          makeBinding("same-order-b", {
            scope: "global",
            bookId: "book-same-order-b",
            displayOrder: 1,
            createdAt: new Date("2026-01-03T00:00:00.000Z"),
          }),
          makeBinding("disabled", {
            scope: "global",
            bookId: "book-disabled",
            displayOrder: 0,
            enabled: false,
          }),
          makeBinding("same-order-a", {
            scope: "global",
            bookId: "book-same-order-a",
            displayOrder: 1,
            createdAt: new Date("2026-01-02T00:00:00.000Z"),
          }),
          makeBinding("same-order-a-z", {
            scope: "global",
            bookId: "book-same-order-a-z",
            displayOrder: 1,
            createdAt: new Date("2026-01-02T00:00:00.000Z"),
            id: "z-id",
          }),
          makeBinding("same-order-a-a", {
            scope: "global",
            bookId: "book-same-order-a-a",
            displayOrder: 1,
            createdAt: new Date("2026-01-02T00:00:00.000Z"),
            id: "a-id",
          }),
        ];
      }

      return [];
    });

    const result = await resolveActiveWorldInfoBooks({
      ownerId: "global",
      chatId: "chat-1",
      entityProfileId: "entity-1",
      personaId: null,
      settings: { insertionStrategy: 1, characterStrategy: 2 },
    });

    expect(result.orderedBindings.map((item) => item.bookId)).toEqual([
      "book-same-order-a-a",
      "book-same-order-a",
      "book-same-order-a-z",
      "book-same-order-b",
      "book-late",
    ]);
  });
});
