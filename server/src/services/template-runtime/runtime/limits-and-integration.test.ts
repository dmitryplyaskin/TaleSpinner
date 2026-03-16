import { describe, expect, test } from "vitest";

import { createMacroRegistry, evaluateExpr, renderTemplate, type InstructionRenderContext, type RuntimeError } from "../index";

function makeContext(): InstructionRenderContext {
  return {
    char: { name: "Alice", title: "Captain" },
    user: { name: "User" },
    chat: { title: "Chat" },
    messages: [
      { role: "assistant", content: "A1" },
      { role: "user", content: "U1 uwu" },
      { role: "assistant", content: "A2 ara" },
      { role: "user", content: "U2 uwu ara" },
    ],
    rag: {},
    art: {
      note: { value: "NOTE", history: ["NOTE"] },
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

describe("template-runtime/limits-and-integration", () => {
  test("builds deterministic flags object from lastUserMessage", () => {
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

  test("renders prompt-like output with current prompt fields", () => {
    expect(
      renderTemplate({
        source: "System={{promptSystem}}\nCharacter={{char.name}}\nLastUser={{lastUserMessage}}\nArtifact={{art.note.value}}",
        context: makeContext(),
      })
    ).toBe("System=SYS\nCharacter=Alice\nLastUser=U2 uwu ara\nArtifact=NOTE");
  });

  test("supports ST-heavy templates and baseline helper semantics", () => {
    expect(
      renderTemplate({
        source:
          "U={{lastUserMessage}}\nA={{lastAssistantMessage}}\nO={{outlet::default}}\n{{trim}}\n{{recentMessagesText(2)}}",
        context: makeContext(),
      })
    ).toBe(
      "U=U2 uwu ara\nA=A2 ara\nO=OUTLET_TEXT\nassistant: A2 ara\nuser: U2 uwu ara"
    );
  });

  test("enforces max output chars and max macro depth", () => {
    expect(() =>
      renderTemplate({
        source: "abcdef",
        context: makeContext(),
        options: {
          maxOutputChars: 3,
        },
      })
    ).toThrow();

    const macros = createMacroRegistry([
      {
        name: "depth1",
        kind: "template",
        params: [],
        body: '{{ use("depth2", {}) }}',
      },
      {
        name: "depth2",
        kind: "template",
        params: [],
        body: '{{ use("depth3", {}) }}',
      },
      {
        name: "depth3",
        kind: "template",
        params: [],
        body: "ok",
      },
    ]);

    expect(() =>
      renderTemplate({
        source: '{{ use("depth1", {}) }}',
        context: makeContext(),
        macros,
        options: {
          maxMacroDepth: 1,
        },
      })
    ).toThrow();
  });

  test("enforces execution-step limits and helper validation errors", () => {
    expect(() =>
      renderTemplate({
        source: "{{#each [1,2,3,4] as item}}[{{item}}]{{/each}}",
        context: makeContext(),
        options: {
          maxExecutionSteps: 3,
        },
      })
    ).toThrow();

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
