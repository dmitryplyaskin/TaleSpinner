import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listProjectedPromptMessages: vi.fn(),
}));

vi.mock("../chat-entry-parts/prompt-history", () => ({
  listProjectedPromptMessages: mocks.listProjectedPromptMessages,
}));

import { buildPromptDraft } from "./prompt-draft-builder";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("prompt-draft-builder depth insertions", () => {
  test("inserts at depth=0 at the end of history", async () => {
    mocks.listProjectedPromptMessages.mockResolvedValue({
      currentTurn: 2,
      entryCount: 2,
      messages: [
        { role: "user", content: "U1" },
        { role: "assistant", content: "A1" },
      ],
    });

    const out = await buildPromptDraft({
      chatId: "chat",
      branchId: "branch",
      systemPrompt: "SYS",
      depthInsertions: [{ depth: 0, role: "system", content: "D0" }],
    });

    expect(out.draft.messages).toEqual([
      { role: "system", content: "SYS" },
      { role: "user", content: "U1" },
      { role: "assistant", content: "A1" },
      { role: "system", content: "D0" },
    ]);
  });

  test("inserts at bounded head when depth exceeds history length", async () => {
    mocks.listProjectedPromptMessages.mockResolvedValue({
      currentTurn: 2,
      entryCount: 2,
      messages: [
        { role: "user", content: "U1" },
        { role: "assistant", content: "A1" },
      ],
    });

    const out = await buildPromptDraft({
      chatId: "chat",
      branchId: "branch",
      systemPrompt: "SYS",
      depthInsertions: [{ depth: 10, role: "user", content: "U_HEAD" }],
    });

    expect(out.draft.messages).toEqual([
      { role: "system", content: "SYS" },
      { role: "user", content: "U_HEAD" },
      { role: "user", content: "U1" },
      { role: "assistant", content: "A1" },
    ]);
  });

  test("applies multiple depth insertions in deterministic order", async () => {
    mocks.listProjectedPromptMessages.mockResolvedValue({
      currentTurn: 3,
      entryCount: 3,
      messages: [
        { role: "user", content: "U1" },
        { role: "assistant", content: "A1" },
        { role: "user", content: "U2" },
      ],
    });

    const out = await buildPromptDraft({
      chatId: "chat",
      branchId: "branch",
      systemPrompt: "SYS",
      depthInsertions: [
        { depth: 1, role: "system", order: 100, content: "S1" },
        { depth: 2, role: "assistant", order: 100, content: "A2" },
      ],
    });

    expect(out.draft.messages).toEqual([
      { role: "system", content: "SYS" },
      { role: "user", content: "U1" },
      { role: "assistant", content: "A1" },
      { role: "assistant", content: "A2" },
      { role: "system", content: "S1" },
      { role: "user", content: "U2" },
    ]);
  });

  test("orders same-depth insertions by order then role", async () => {
    mocks.listProjectedPromptMessages.mockResolvedValue({
      currentTurn: 2,
      entryCount: 2,
      messages: [
        { role: "user", content: "U1" },
        { role: "assistant", content: "A1" },
      ],
    });

    const out = await buildPromptDraft({
      chatId: "chat",
      branchId: "branch",
      systemPrompt: "",
      depthInsertions: [
        { depth: 1, role: "system", order: 100, content: "S100" },
        { depth: 1, role: "assistant", order: 100, content: "A100" },
        { depth: 1, role: "user", order: 100, content: "U100" },
        { depth: 1, role: "assistant", order: 10, content: "A010" },
      ],
    });

    expect(out.draft.messages).toEqual([
      { role: "user", content: "U1" },
      { role: "assistant", content: "A010" },
      { role: "assistant", content: "A100" },
      { role: "user", content: "U100" },
      { role: "system", content: "S100" },
      { role: "assistant", content: "A1" },
    ]);
  });
});
