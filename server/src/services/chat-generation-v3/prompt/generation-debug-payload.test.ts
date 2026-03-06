import { describe, expect, test } from "vitest";

import {
  buildPromptDiagnosticsDebugJson,
  normalizePromptDiagnosticsDebugJson,
} from "./generation-debug-payload";

describe("generation-debug-payload", () => {
  test("buildPromptDiagnosticsDebugJson assembles normalized diagnostics payload", () => {
    const payload = buildPromptDiagnosticsDebugJson({
      llmMessages: [
        { role: "system", content: "System instructions" },
        { role: "user", content: "Hello world" },
        { role: "assistant", content: "Hi there" },
      ],
      systemPrompt: "System instructions",
      templateHistoryMessages: [
        { role: "user", content: "Hello world" },
        { role: "assistant", content: "Hi there" },
      ],
      worldInfoDiagnostics: {
        worldInfoBefore: "Before block",
        worldInfoAfter: "After block",
        depthEntries: [{ content: "depth-1" }],
        outletEntries: { main: ["outlet-1", "outlet-2"] },
        anTop: ["an-top"],
        anBottom: ["an-bottom"],
        emTop: ["em-top"],
        emBottom: ["em-bottom"],
        warnings: ["warn-1"],
        activatedCount: 1,
        activatedEntries: [
          {
            hash: "hash-1",
            bookId: "book-1",
            bookName: "Book",
            uid: 5,
            comment: "Comment",
            content: "Content",
            matchedKeys: ["hero"],
            reasons: ["matched"],
          },
        ],
      },
      turnUserCanonicalization: [
        {
          hook: "before_main_llm",
          opId: "op-1",
          userEntryId: "entry-1",
          userMainPartId: "part-1",
          beforeText: "Before",
          afterText: "After",
          committedAt: "2026-03-06T18:00:00.000Z",
        },
      ],
    });

    expect(payload.estimator).toBe("chars_div4");
    expect(payload.prompt.messages).toHaveLength(3);
    expect(payload.prompt.approxTokens.total).toBeGreaterThan(0);
    expect(payload.worldInfo.activatedCount).toBe(1);
    expect(payload.operations.turnUserCanonicalization).toHaveLength(1);
  });

  test("normalizePromptDiagnosticsDebugJson sanitizes malformed nested values", () => {
    const normalized = normalizePromptDiagnosticsDebugJson({
      prompt: {
        messages: [
          { role: "system", content: "sys" },
          { role: "user", content: "user" },
          { role: "bad", content: "ignored" },
          { role: "assistant", content: 42 },
        ],
        approxTokens: {
          total: 12.9,
          byRole: {
            system: 4.7,
            user: -1,
            assistant: "bad",
          },
          sections: {
            systemInstruction: 5.2,
            chatHistory: "bad",
            worldInfoBefore: 2.8,
            worldInfoAfter: null,
            worldInfoDepth: 1.2,
            worldInfoOutlets: 7.9,
            worldInfoAN: -2,
            worldInfoEM: 3,
          },
        },
      },
      worldInfo: {
        activatedCount: 3.6,
        warnings: ["warn-1", 2],
        entries: [
          {
            hash: "hash-1",
            bookId: "book-1",
            bookName: "Book",
            uid: 9.9,
            comment: "Comment",
            content: "Content",
            matchedKeys: ["a", 1],
            reasons: ["b", false],
          },
          {
            hash: 1,
            bookId: "bad",
          },
        ],
      },
      operations: {
        turnUserCanonicalization: [
          {
            hook: "after_main_llm",
            opId: "op-1",
            userEntryId: "entry-1",
            userMainPartId: "part-1",
            beforeText: "before",
            afterText: "after",
            committedAt: "2026-03-06T18:00:00.000Z",
            replacedPartId: "part-old",
          },
          {
            hook: "unknown",
            opId: "op-2",
          },
        ],
      },
    });

    expect(normalized).not.toBeNull();
    expect(normalized?.prompt.messages).toEqual([
      { role: "system", content: "sys" },
      { role: "user", content: "user" },
    ]);
    expect(normalized?.prompt.approxTokens).toEqual({
      total: 12,
      byRole: {
        system: 4,
        user: 0,
        assistant: 0,
      },
      sections: {
        systemInstruction: 5,
        chatHistory: 0,
        worldInfoBefore: 2,
        worldInfoAfter: 0,
        worldInfoDepth: 1,
        worldInfoOutlets: 7,
        worldInfoAN: 0,
        worldInfoEM: 3,
      },
    });
    expect(normalized?.worldInfo).toEqual({
      activatedCount: 3,
      warnings: ["warn-1"],
      entries: [
        {
          hash: "hash-1",
          bookId: "book-1",
          bookName: "Book",
          uid: 9,
          comment: "Comment",
          content: "Content",
          matchedKeys: ["a"],
          reasons: ["b"],
        },
      ],
    });
    expect(normalized?.operations.turnUserCanonicalization).toEqual([
      {
        hook: "after_main_llm",
        opId: "op-1",
        userEntryId: "entry-1",
        userMainPartId: "part-1",
        beforeText: "before",
        afterText: "after",
        committedAt: "2026-03-06T18:00:00.000Z",
        replacedPartId: "part-old",
      },
    ]);
  });

  test("normalizePromptDiagnosticsDebugJson returns null for non-diagnostic payloads", () => {
    expect(normalizePromptDiagnosticsDebugJson(null)).toBeNull();
    expect(normalizePromptDiagnosticsDebugJson({ prompt: {} })).toBeNull();
    expect(normalizePromptDiagnosticsDebugJson({ worldInfo: {} })).toBeNull();
  });
});
