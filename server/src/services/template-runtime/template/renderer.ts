import { evaluateExprNode } from "../expr/evaluator";
import { parseExpr } from "../expr/parser";
import { runtimeError } from "../runtime/errors";
import { popLocalScope, popMacro, pushLocalScope, pushMacro, step, TRIM_SENTINEL, unsetScopedValue, writeScopedValue } from "../runtime/state";

import type { ExecutionState } from "../runtime/state";
import type { CompiledMacroDefinition, InstructionRenderContext, MacroRegistry, TemplateAst, TemplateNode } from "../types";

function stringifyOutput(value: unknown): string {
  if (value === null || typeof value === "undefined") return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function toArgRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function bindMacroParams(
  macro: CompiledMacroDefinition,
  providedArgs: Record<string, unknown>,
  context: InstructionRenderContext,
  state: ExecutionState,
  macros?: MacroRegistry
): Record<string, unknown> {
  const bound: Record<string, unknown> = {};

  for (const param of macro.params) {
    if (param.name in providedArgs) {
      bound[param.name] = providedArgs[param.name];
      continue;
    }

    if (param.defaultExpr) {
      bound[param.name] = evaluateExprNode({
        ast: parseExpr(param.defaultExpr),
        context,
        state,
        macros,
      });
      continue;
    }

    if (param.required) {
      throw runtimeError("INVALID_MACRO", `Missing required macro param: ${param.name}`, {
        macro: macro.name,
        param: param.name,
      });
    }

    bound[param.name] = null;
  }

  return bound;
}

export function renderTemplateAst(params: {
  ast: TemplateAst;
  context: InstructionRenderContext;
  state: ExecutionState;
  macros?: MacroRegistry;
}): string {
  const output = renderNodes(params.ast.nodes, params.context, params.state, params.macros).join("");
  if (output.length > params.state.options.maxOutputChars) {
    throw runtimeError("LIMIT_EXCEEDED", "runtime exceeded maxOutputChars", {
      maxOutputChars: params.state.options.maxOutputChars,
    });
  }
  return params.state.trimSentinelUsed ? stripTrimSentinel(output) : output;
}

function renderNodes(
  nodes: TemplateNode[],
  context: InstructionRenderContext,
  state: ExecutionState,
  macros?: MacroRegistry
): string[] {
  const chunks: string[] = [];

  for (const node of nodes) {
    step(state, `template:${node.kind}`);
    if (node.kind === "text") {
      chunks.push(node.value);
      continue;
    }
    if (node.kind === "output") {
      chunks.push(renderOutput(node, context, state, macros));
      continue;
    }
    if (node.kind === "statement") {
      const chunk = executeStatement(node, context, state, macros);
      if (chunk.length > 0) chunks.push(chunk);
      continue;
    }
    if (node.kind === "if") {
      const condition = evaluateExprNode({
        ast: node.condition,
        context,
        state,
        macros,
      });
      chunks.push(...renderNodes(condition ? node.then : node.else, context, state, macros));
      continue;
    }

    const iterable = evaluateExprNode({
      ast: node.source,
      context,
      state,
      macros,
    });
    if (!Array.isArray(iterable)) continue;
    for (const item of iterable) {
      pushLocalScope(state, { [node.itemName]: item });
      chunks.push(...renderNodes(node.body, context, state, macros));
      popLocalScope(state);
    }
  }

  return chunks;
}

function renderOutput(
  node: Extract<TemplateNode, { kind: "output" }>,
  context: InstructionRenderContext,
  state: ExecutionState,
  macros?: MacroRegistry
): string {
  if (node.expr.kind === "call" && node.expr.name === "use") {
    const args = node.expr.args.map((arg) =>
      evaluateExprNode({
        ast: arg,
        context,
        state,
        macros,
      })
    );
    const macroName = typeof args[0] === "string" ? args[0] : "";
    const macro = macros?.getCompiled(macroName);
    if (!macro || macro.kind !== "template") {
      throw runtimeError("UNKNOWN_MACRO", `Unknown template macro: ${macroName}`, { macroName });
    }
    pushMacro(state, macroName);
    try {
      pushLocalScope(state, bindMacroParams(macro, toArgRecord(args[1]), context, state, macros));
      const rendered = renderTemplateAst({
        ast: macro.body,
        context,
        state,
        macros,
      });
      popLocalScope(state);
      return rendered;
    } finally {
      popMacro(state);
    }
  }

  return stringifyOutput(
    evaluateExprNode({
      ast: node.expr,
      context,
      state,
      macros,
    })
  );
}

function executeStatement(
  node: Extract<TemplateNode, { kind: "statement" }>,
  context: InstructionRenderContext,
  state: ExecutionState,
  macros?: MacroRegistry
): string {
  if (node.statement.kind === "trim") {
    state.trimSentinelUsed = true;
    return TRIM_SENTINEL;
  }

  if (node.statement.kind === "set") {
    writeScopedValue(
      state,
      node.statement.scope,
      node.statement.name,
      evaluateExprNode({
        ast: node.statement.value,
        context,
        state,
        macros,
      })
    );
    return "";
  }

  unsetScopedValue(state, node.statement.scope, node.statement.name);
  return "";
}

function isBlankLine(line: string): boolean {
  return line.trim().length === 0;
}

function stripTrimSentinel(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const out: string[] = [];
  let skipLeadingBlankLines = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === TRIM_SENTINEL) {
      while (out.length > 0 && isBlankLine(out[out.length - 1] ?? "")) out.pop();
      skipLeadingBlankLines = true;
      continue;
    }

    if (line.includes(TRIM_SENTINEL)) {
      const replaced = line.split(TRIM_SENTINEL).join("");
      if (!(skipLeadingBlankLines && isBlankLine(replaced))) {
        out.push(replaced);
      }
      if (!isBlankLine(replaced)) skipLeadingBlankLines = false;
      continue;
    }

    if (skipLeadingBlankLines && isBlankLine(line)) continue;
    out.push(line);
    if (!isBlankLine(line)) skipLeadingBlankLines = false;
  }

  return out.join("\n");
}
