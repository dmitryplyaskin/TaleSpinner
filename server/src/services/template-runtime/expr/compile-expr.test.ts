import { describe, expect, test } from "vitest";

import { compileExpr, validateExpr, type RuntimeError } from "../index";

describe("template-runtime/compileExpr", () => {
  test("parses literals, paths, arrays, and objects", () => {
    expect(compileExpr("null")).toMatchObject({ kind: "literal", value: null });
    expect(compileExpr("true")).toMatchObject({ kind: "literal", value: true });
    expect(compileExpr("42")).toMatchObject({ kind: "literal", value: 42 });
    expect(compileExpr('"hello"')).toMatchObject({ kind: "literal", value: "hello" });
    expect(compileExpr("char.name")).toMatchObject({
      kind: "path",
      segments: ["char", "name"],
    });
    expect(compileExpr("[1, 2, 3]")).toMatchObject({
      kind: "array",
      items: [{ kind: "literal", value: 1 }, { kind: "literal", value: 2 }, { kind: "literal", value: 3 }],
    });
    expect(compileExpr('{ uwu: true, "ara": false }')).toMatchObject({
      kind: "object",
      entries: [
        { key: "uwu", value: { kind: "literal", value: true } },
        { key: "ara", value: { kind: "literal", value: false } },
      ],
    });
  });

  test("preserves precedence and associativity", () => {
    expect(compileExpr("not a and b or c")).toMatchObject({
      kind: "binary",
      op: "or",
      left: {
        kind: "binary",
        op: "and",
        left: {
          kind: "unary",
          op: "not",
          value: { kind: "path", segments: ["a"] },
        },
        right: { kind: "path", segments: ["b"] },
      },
      right: { kind: "path", segments: ["c"] },
    });
  });

  test("parses function calls and nested expressions", () => {
    expect(compileExpr('contains(lastUserMessage, "uwu", "i")')).toMatchObject({
      kind: "call",
      name: "contains",
      args: [
        { kind: "path", segments: ["lastUserMessage"] },
        { kind: "literal", value: "uwu" },
        { kind: "literal", value: "i" },
      ],
    });
  });

  test("validateExpr accepts valid sources and rejects invalid ones", () => {
    expect(() => validateExpr('{ uwu: contains(lastUserMessage, "uwu", "i") }')).not.toThrow();
    expect(() => validateExpr("char.name == ")).toThrow();
  });

  test("throws typed parse errors", () => {
    try {
      compileExpr("[1,");
      throw new Error("expected parse error");
    } catch (error) {
      const runtimeError = error as RuntimeError;
      expect(runtimeError.code).toBe("EXPR_PARSE_ERROR");
      expect(runtimeError.message).toContain("Expected");
    }
  });
});
