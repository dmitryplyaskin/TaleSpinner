import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getBranchCurrentTurn: vi.fn(),
  listEntriesWithActiveVariantsPage: vi.fn(),
}));

vi.mock("../../chat-entry-parts/branch-turn-repository", () => ({
  getBranchCurrentTurn: mocks.getBranchCurrentTurn,
}));

vi.mock("../../chat-entry-parts/entries-repository", () => ({
  listEntriesWithActiveVariantsPage: mocks.listEntriesWithActiveVariantsPage,
}));

import {
  buildRuntimeBootstrapFromBranchHistory,
  replayOperationActivationByEvents,
} from "./operation-runtime-state";

import type { Entry, Part, Variant } from "@shared/types/chat-entry-parts";
import type { OperationInProfile } from "@shared/types/operation-profiles";

function makeEntry(params: {
  entryId: string;
  role: Entry["role"];
  createdAt: number;
  text: string;
}): { entry: Entry; variant: Variant } {
  const part: Part = {
    partId: `${params.entryId}-part`,
    channel: "main",
    order: 0,
    payload: params.text,
    payloadFormat: "markdown",
    visibility: { ui: "always", prompt: true },
    ui: { rendererId: "markdown" },
    prompt: { serializerId: "asText" },
    lifespan: "infinite",
    createdTurn: 1,
    source: params.role === "assistant" ? "llm" : "user",
  };
  const variant: Variant = {
    variantId: `${params.entryId}-variant`,
    entryId: params.entryId,
    kind: "generation",
    createdAt: params.createdAt,
    parts: [part],
  };
  const entry: Entry = {
    entryId: params.entryId,
    chatId: "chat-1",
    branchId: "branch-1",
    role: params.role,
    createdAt: params.createdAt,
    activeVariantId: variant.variantId,
  };
  return { entry, variant };
}

describe("operation runtime state bootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getBranchCurrentTurn.mockResolvedValue(10);
    mocks.listEntriesWithActiveVariantsPage.mockResolvedValue({
      entries: [],
      pageInfo: {
        hasMoreOlder: false,
        nextCursor: null,
      },
    });
  });

  test("replays activation from user context events with generate trigger semantics", () => {
    const operations: OperationInProfile[] = [
      {
        opId: "op-generate",
        name: "Generate op",
        kind: "template",
        config: {
          enabled: true,
          required: false,
          hooks: ["before_main_llm"],
          triggers: ["generate"],
          activation: { everyNTurns: 2 },
          order: 1,
          params: {
            template: "x",
            output: {
              type: "artifacts",
              writeArtifact: {
                tag: "state",
                persistence: "run_only",
                usage: "internal",
                semantics: "intermediate",
              },
            },
          },
        },
      },
      {
        opId: "op-regenerate-only",
        name: "Regen op",
        kind: "template",
        config: {
          enabled: true,
          required: false,
          hooks: ["before_main_llm"],
          triggers: ["regenerate"],
          activation: { everyNTurns: 2 },
          order: 2,
          params: {
            template: "x",
            output: {
              type: "artifacts",
              writeArtifact: {
                tag: "state2",
                persistence: "run_only",
                usage: "internal",
                semantics: "intermediate",
              },
            },
          },
        },
      },
    ];

    const result = replayOperationActivationByEvents({
      operations,
      events: [{ contextTokens: 10 }, { contextTokens: 12 }, { contextTokens: 14 }],
    });

    expect(result["op-generate"]).toEqual({ turnsCounter: 1, tokensCounter: 14 });
    expect(result["op-regenerate-only"]).toEqual({ turnsCounter: 3, tokensCounter: 36 });
  });

  test("excludes current user send event from bootstrap when source=user_message", async () => {
    mocks.listEntriesWithActiveVariantsPage.mockResolvedValueOnce({
      entries: [
        makeEntry({ entryId: "e1", role: "system", createdAt: 1, text: "sys" }),
        makeEntry({ entryId: "e2", role: "user", createdAt: 2, text: "hello" }),
        makeEntry({ entryId: "e3", role: "assistant", createdAt: 3, text: "assistant reply" }),
        makeEntry({ entryId: "e4", role: "user", createdAt: 4, text: "latest user send" }),
      ],
      pageInfo: {
        hasMoreOlder: false,
        nextCursor: null,
      },
    });

    const operations: OperationInProfile[] = [
      {
        opId: "op-turns",
        name: "Turns op",
        kind: "template",
        config: {
          enabled: true,
          required: false,
          hooks: ["before_main_llm"],
          triggers: ["generate"],
          activation: { everyNTurns: 3 },
          order: 1,
          params: {
            template: "x",
            output: {
              type: "artifacts",
              writeArtifact: {
                tag: "state",
                persistence: "run_only",
                usage: "internal",
                semantics: "intermediate",
              },
            },
          },
        },
      },
    ];

    const payload = await buildRuntimeBootstrapFromBranchHistory({
      chatId: "chat-1",
      branchId: "branch-1",
      operations,
      source: "user_message",
    });

    expect(payload.bootstrap.userEventsCount).toBe(1);
    expect(payload.activationByOpId["op-turns"]).toEqual({
      turnsCounter: 1,
      tokensCounter: 2,
    });
  });
});
