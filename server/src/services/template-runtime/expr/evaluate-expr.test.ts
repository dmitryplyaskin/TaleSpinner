import { describe, expect, test } from "vitest";

import { evaluateExpr, type InstructionRenderContext, type RuntimeError } from "../index";

function makeContext(): InstructionRenderContext {
  return {
    char: { name: "Alice" },
    user: { name: "User" },
    chat: { title: "Chat" },
    messages: [
      { role: "system", content: "S0" },
      { role: "assistant", content: "A1" },
      { role: "user", content: "U1 uwu" },
      { role: "assistant", content: "A2 ara" },
      { role: "user", content: "U2 uwu ara" },
    ],
    rag: {},
    art: {
      note: { value: "memo", history: ["memo"] },
    },
    promptSystem: "SYS",
    outlet: {
      default: "OUTLET_TEXT",
    },
    lastUserMessage: "U2 uwu ara",
    lastAssistantMessage: "A2 ara",
    now: new Date("2026-03-16T00:00:00.000Z").toISOString(),
  };
}

describe("template-runtime/evaluateExpr", () => {
  test("resolves paths and missing values in non-strict mode", () => {
    expect(
      evaluateExpr({
        source: "char.name",
        context: makeContext(),
      })
    ).toBe("Alice");

    expect(
      evaluateExpr({
        source: "missing.value",
        context: makeContext(),
      })
    ).toBeNull();
  });

  test("throws on missing values in strict mode", () => {
    expect(() =>
      evaluateExpr({
        source: "missing.value",
        context: makeContext(),
        options: {
          strictVariables: true,
        },
      })
    ).toThrow();
  });

  test("evaluates booleans, equality, arrays, and objects", () => {
    expect(
      evaluateExpr({
        source: 'contains(lastUserMessage, "uwu", "i") and char.name == "Alice"',
        context: makeContext(),
      })
    ).toBe(true);

    expect(
      evaluateExpr({
        source: '{ uwu: contains(lastUserMessage, "uwu", "i"), ara: contains(lastUserMessage, "ara", "i") }',
        context: makeContext(),
      })
    ).toEqual({
      uwu: true,
      ara: true,
    });
  });

  test("supports helper registry semantics", () => {
    expect(
      evaluateExpr({
        source: "size(recentMessages(2))",
        context: makeContext(),
      })
    ).toBe(2);

    expect(
      evaluateExpr({
        source: 'recentMessagesText(2)',
        context: makeContext(),
      })
    ).toBe("assistant: A2 ara\nuser: U2 uwu ara");

    expect(
      evaluateExpr({
        source: "outlet('default')",
        context: makeContext(),
      })
    ).toBe("OUTLET_TEXT");
  });

  test("uses deterministic rng for pickRandom", () => {
    expect(
      evaluateExpr({
        source: 'pickRandom("A", "B", "C")',
        context: makeContext(),
        options: {
          rng: () => 0,
        },
      })
    ).toBe("A");

    expect(
      evaluateExpr({
        source: 'pickRandom("A", "B", "C")',
        context: makeContext(),
        options: {
          rng: () => 0.999999,
        },
      })
    ).toBe("C");
  });

  test("reads variables from render and turn scopes", () => {
    expect(
      evaluateExpr({
        source: "flag",
        context: makeContext(),
        state: {
          scopes: {
            local: {},
            render: { flag: "render-flag" },
            turn: { flag: "turn-flag" },
          },
        },
      })
    ).toBe("render-flag");

    expect(
      evaluateExpr({
        source: "turnOnly",
        context: makeContext(),
        state: {
          scopes: {
            local: {},
            render: {},
            turn: { turnOnly: 7 },
          },
        },
      })
    ).toBe(7);
  });

  test("throws typed helper errors", () => {
    try {
      evaluateExpr({
        source: 'match(lastUserMessage, "[", "i")',
        context: makeContext(),
      });
      throw new Error("expected helper error");
    } catch (error) {
      const runtimeError = error as RuntimeError;
      expect(runtimeError.code).toBe("HELPER_ERROR");
    }
  });
});
