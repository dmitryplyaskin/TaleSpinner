import { describe, expect, test } from "vitest";

import {
  createMacroRegistry,
  evaluateExpr,
  renderTemplate,
  type InstructionRenderContext,
  type RuntimeError,
} from "../index";

function makeContext(): InstructionRenderContext {
  return {
    char: { name: "Alice" },
    user: { name: "User" },
    chat: { title: "Chat" },
    messages: [{ role: "user", content: "uwu ara" }],
    rag: {},
    art: {},
    lastUserMessage: "uwu ara",
    now: new Date("2026-03-16T00:00:00.000Z").toISOString(),
  };
}

describe("template-runtime/macros", () => {
  test("invokes value and template macros with named params", () => {
    const macros = createMacroRegistry([
      {
        name: "detectFlags",
        kind: "value",
        params: [{ name: "text", required: true }],
        body: '{ uwu: contains(text, "uwu", "i"), ara: contains(text, "ara", "i") }',
      },
      {
        name: "sceneHeader",
        kind: "template",
        params: [
          { name: "char", required: true },
          { name: "user", required: true },
        ],
        body: "Character={{char.name}}|User={{user.name}}",
      },
    ]);

    expect(
      evaluateExpr({
        source: 'call("detectFlags", { text: lastUserMessage })',
        context: makeContext(),
        macros,
      })
    ).toEqual({
      uwu: true,
      ara: true,
    });

    expect(
      renderTemplate({
        source: '{{ use("sceneHeader", { char: char, user: user }) }}',
        context: makeContext(),
        macros,
      })
    ).toBe("Character=Alice|User=User");
  });

  test("supports required and default params", () => {
    const macros = createMacroRegistry([
      {
        name: "greeting",
        kind: "template",
        params: [
          { name: "name", required: false, defaultExpr: '"Guest"' },
        ],
        body: "Hello {{name}}",
      },
    ]);

    expect(
      renderTemplate({
        source: '{{ use("greeting", {}) }}',
        context: makeContext(),
        macros,
      })
    ).toBe("Hello Guest");

    expect(() =>
      renderTemplate({
        source: '{{ use("missingMacro", {}) }}',
        context: makeContext(),
        macros,
      })
    ).toThrow();
  });

  test("creates fresh local scopes and allows nested macro calls", () => {
    const macros = createMacroRegistry([
      {
        name: "inner",
        kind: "template",
        params: [{ name: "name", required: true }],
        body: '{{set("name", "Inner", "local")}}<{{name}}>',
      },
      {
        name: "outer",
        kind: "template",
        params: [{ name: "name", required: true }],
        body: '{{name}}-{{ use("inner", { name: name }) }}-{{name}}',
      },
    ]);

    expect(
      renderTemplate({
        source: '{{ use("outer", { name: "Outer" }) }}',
        context: makeContext(),
        macros,
      })
    ).toBe("Outer-<Inner>-Outer");
  });

  test("detects direct and indirect cycles", () => {
    const direct = createMacroRegistry([
      {
        name: "loop",
        kind: "template",
        params: [],
        body: '{{ use("loop", {}) }}',
      },
    ]);

    expect(() =>
      renderTemplate({
        source: '{{ use("loop", {}) }}',
        context: makeContext(),
        macros: direct,
      })
    ).toThrow();

    const indirect = createMacroRegistry([
      {
        name: "a",
        kind: "template",
        params: [],
        body: '{{ use("b", {}) }}',
      },
      {
        name: "b",
        kind: "template",
        params: [],
        body: '{{ use("a", {}) }}',
      },
    ]);

    try {
      renderTemplate({
        source: '{{ use("a", {}) }}',
        context: makeContext(),
        macros: indirect,
      });
      throw new Error("expected cycle error");
    } catch (error) {
      const runtimeError = error as RuntimeError;
      expect(runtimeError.code).toBe("MACRO_CYCLE");
    }
  });
});
