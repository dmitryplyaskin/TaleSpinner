import { describe, expect, test } from "vitest";

import { compileTemplate, validateTemplate, type RuntimeError } from "../index";

describe("template-runtime/compileTemplate", () => {
  test("parses text, output, if, and each blocks", () => {
    expect(compileTemplate("Hello {{ char.name }}")).toMatchObject({
      kind: "template",
      nodes: [
        { kind: "text", value: "Hello " },
        { kind: "output", expr: { kind: "path", segments: ["char", "name"] } },
      ],
    });

    expect(
      compileTemplate(
        "{{#if contains(lastUserMessage, \"uwu\", \"i\")}}UWU{{else}}NONE{{/if}}{{#each messages as msg}}[{{msg.role}}]{{/each}}"
      )
    ).toMatchObject({
      kind: "template",
      nodes: [
        {
          kind: "if",
          then: [{ kind: "text", value: "UWU" }],
          else: [{ kind: "text", value: "NONE" }],
        },
        {
          kind: "each",
          itemName: "msg",
        },
      ],
    });
  });

  test("lowers ST aliases into canonical nodes", () => {
    const ast = compileTemplate("A{{trim}}B{{outlet::default}}{{random::A::B}}{{setvar::mood::angry}}");

    expect(ast).toMatchObject({
      kind: "template",
      nodes: [
        { kind: "text", value: "A" },
        { kind: "statement", statement: { kind: "trim" } },
        { kind: "text", value: "B" },
        { kind: "output", expr: { kind: "call", name: "outlet" } },
        { kind: "output", expr: { kind: "call", name: "pickRandom" } },
        {
          kind: "statement",
          statement: {
            kind: "set",
            scope: "render",
            name: "mood",
            value: { kind: "literal", value: "angry" },
          },
        },
      ],
    });
  });

  test("validateTemplate accepts valid templates and rejects invalid ones", () => {
    expect(() => validateTemplate("Hello {{ char.name }}")).not.toThrow();
    expect(() => validateTemplate("{{#if true}}ok{{/if}}")).not.toThrow();
    expect(() => validateTemplate("{{#if true}}")).toThrow();
  });

  test("rejects unknown ST alias syntax", () => {
    try {
      compileTemplate("{{unknown::value}}");
      throw new Error("expected alias error");
    } catch (error) {
      const runtimeError = error as RuntimeError;
      expect(runtimeError.code).toBe("UNKNOWN_ST_ALIAS");
    }
  });
});
