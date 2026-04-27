import { parseExpr } from "../expr/parser";
import { runtimeError } from "../runtime/errors";

import parser from "./template-parser";

import type {
  ExprNode,
  RawTemplateAst,
  RawTemplateNode,
  StatementScope,
  TemplateAst,
  TemplateNode,
} from "../types";

const ST_ALIAS_PREFIX_RE = /^[a-zA-Z_][a-zA-Z0-9_]*::/;
const EACH_SOURCE_RE = /^(.*)\bas\s+([a-zA-Z_][a-zA-Z0-9_]*)$/s;

export function parseTemplate(source: string): RawTemplateAst {
  try {
    return parser.parse(source) as RawTemplateAst;
  } catch (error) {
    throw runtimeError(
      "TEMPLATE_PARSE_ERROR",
      error instanceof Error ? error.message : String(error),
      { source }
    );
  }
}

export function lowerTemplate(raw: RawTemplateAst): TemplateAst {
  return {
    kind: "template",
    nodes: raw.nodes.map(lowerNode),
  };
}

function lowerNode(node: RawTemplateNode): TemplateNode {
  switch (node.kind) {
    case "text":
      return node;
    case "raw_output":
      return lowerOutput(node.source);
    case "raw_if":
      return {
        kind: "if",
        condition: parseExpr(node.condition),
        then: node.then.map(lowerNode),
        else: node.else.map(lowerNode),
      };
    case "raw_each": {
      const match = node.source.match(EACH_SOURCE_RE);
      if (!match) {
        throw runtimeError("TEMPLATE_PARSE_ERROR", `Invalid each syntax: ${node.source}`);
      }
      const [, source, itemName] = match;
      return {
        kind: "each",
        source: parseExpr(source.trim()),
        itemName,
        body: node.body.map(lowerNode),
      };
    }
  }
}

function lowerOutput(source: string): TemplateNode {
  const trimmed = source.trim();
  if (trimmed === "trim") {
    return {
      kind: "statement",
      statement: { kind: "trim" },
    };
  }
  if (trimmed.startsWith("outlet::")) {
    return outputCall("outlet", [literal(trimmed.slice("outlet::".length))]);
  }
  if (trimmed.startsWith("random::")) {
    const values = trimmed
      .slice("random::".length)
      .split("::")
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .map(literal);
    return outputCall("pickRandom", values);
  }
  if (trimmed.startsWith("setvar::")) {
    const payload = trimmed.slice("setvar::".length).split("::");
    if (payload.length < 2) {
      throw runtimeError("UNKNOWN_ST_ALIAS", `Unsupported ST alias: ${trimmed}`);
    }
    const [name, ...rawValue] = payload;
    return {
      kind: "statement",
      statement: {
        kind: "set",
        scope: "render",
        name,
        value: literal(rawValue.join("::")),
      },
    };
  }
  if (ST_ALIAS_PREFIX_RE.test(trimmed)) {
    throw runtimeError("UNKNOWN_ST_ALIAS", `Unsupported ST alias: ${trimmed}`);
  }

  const expr = parseExpr(trimmed);
  return maybeLowerStatement(expr);
}

function maybeLowerStatement(expr: ExprNode): TemplateNode {
  if (expr.kind !== "call") return { kind: "output", expr };
  if (expr.name === "set") {
    const [nameNode, valueNode, scopeNode] = expr.args;
    return {
      kind: "statement",
      statement: {
        kind: "set",
        scope: resolveScope(scopeNode),
        name: readLiteralString(nameNode, "set"),
        value: valueNode ?? literal(null),
      },
    };
  }
  if (expr.name === "unset") {
    const [nameNode, scopeNode] = expr.args;
    return {
      kind: "statement",
      statement: {
        kind: "unset",
        scope: resolveScope(scopeNode),
        name: readLiteralString(nameNode, "unset"),
      },
    };
  }
  return { kind: "output", expr };
}

function resolveScope(node: ExprNode | undefined): StatementScope {
  if (!node) return "render";
  const scope = readLiteralString(node, "scope");
  if (scope === "local" || scope === "render" || scope === "turn" || scope === "session") {
    return scope;
  }
  throw runtimeError("INVALID_SCOPE", `Unsupported scope: ${scope}`, { scope });
}

function readLiteralString(node: ExprNode | undefined, label: string): string {
  if (!node || node.kind !== "literal" || typeof node.value !== "string") {
    throw runtimeError("TEMPLATE_PARSE_ERROR", `${label} requires string literal argument`);
  }
  return node.value;
}

function literal(value: null | boolean | number | string): ExprNode {
  return { kind: "literal", value };
}

function outputCall(name: string, args: ExprNode[]): TemplateNode {
  return {
    kind: "output",
    expr: {
      kind: "call",
      name,
      args,
    },
  };
}
