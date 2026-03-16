import { runtimeError } from "../runtime/errors";
import { invokeHelper } from "../runtime/helpers";
import { resolvePathValue } from "../runtime/path";
import { popLocalScope, popMacro, pushLocalScope, pushMacro, snapshotRuntimeState, step } from "../runtime/state";

import { parseExpr } from "./parser";

import type { ExecutionState } from "../runtime/state";
import type { CompiledMacroDefinition, ExprAst, ExprNode, InstructionRenderContext, MacroRegistry } from "../types";

type EvaluateExprParams = {
  ast: ExprAst;
  context: InstructionRenderContext;
  state: ExecutionState;
  macros?: MacroRegistry;
  nesting?: number;
};

function assertNesting(state: ExecutionState, nesting: number): void {
  if (nesting > state.options.maxObjectNesting) {
    throw runtimeError("LIMIT_EXCEEDED", "runtime exceeded maxObjectNesting", {
      maxObjectNesting: state.options.maxObjectNesting,
      nesting,
    });
  }
}

function valuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function isTruthy(value: unknown): boolean {
  return value ? true : false;
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

export function evaluateExprNode(params: EvaluateExprParams): unknown {
  step(params.state, `expr:${params.ast.kind}`);
  const nesting = params.nesting ?? 0;
  assertNesting(params.state, nesting);

  switch (params.ast.kind) {
    case "literal":
      return params.ast.value;
    case "path":
      return resolvePathValue({
        segments: params.ast.segments,
        context: params.context,
        state: params.state,
      });
    case "array":
      return params.ast.items.map((item) =>
        evaluateExprNode({
          ast: item,
          context: params.context,
          state: params.state,
          macros: params.macros,
          nesting: nesting + 1,
        })
      );
    case "object":
      return Object.fromEntries(
        params.ast.entries.map((entry) => [
          entry.key,
          evaluateExprNode({
            ast: entry.value,
            context: params.context,
            state: params.state,
            macros: params.macros,
            nesting: nesting + 1,
          }),
        ])
      );
    case "unary":
      return !isTruthy(
        evaluateExprNode({
          ast: params.ast.value,
          context: params.context,
          state: params.state,
          macros: params.macros,
          nesting: nesting + 1,
        })
      );
    case "binary": {
      const left = evaluateExprNode({
        ast: params.ast.left,
        context: params.context,
        state: params.state,
        macros: params.macros,
        nesting: nesting + 1,
      });

      if (params.ast.op === "and") {
        return isTruthy(left)
          ? isTruthy(
              evaluateExprNode({
                ast: params.ast.right,
                context: params.context,
                state: params.state,
                macros: params.macros,
                nesting: nesting + 1,
              })
            )
          : false;
      }

      if (params.ast.op === "or") {
        return isTruthy(left)
          ? true
          : isTruthy(
              evaluateExprNode({
                ast: params.ast.right,
                context: params.context,
                state: params.state,
                macros: params.macros,
                nesting: nesting + 1,
              })
            );
      }

      const right = evaluateExprNode({
        ast: params.ast.right,
        context: params.context,
        state: params.state,
        macros: params.macros,
        nesting: nesting + 1,
      });

      return params.ast.op === "eq" ? valuesEqual(left, right) : !valuesEqual(left, right);
    }
    case "call":
      return evaluateCall(params.ast, params.context, params.state, params.macros, nesting + 1);
  }
}

function evaluateCall(
  node: Extract<ExprNode, { kind: "call" }>,
  context: InstructionRenderContext,
  state: ExecutionState,
  macros?: MacroRegistry,
  nesting = 0
): unknown {
  const args = node.args.map((arg) =>
    evaluateExprNode({
      ast: arg,
      context,
      state,
      macros,
      nesting,
    })
  );

  if (node.name === "call") {
    const macroName = typeof args[0] === "string" ? args[0] : "";
    const macro = macros?.getCompiled(macroName);
    if (!macro || macro.kind !== "value") {
      throw runtimeError("UNKNOWN_MACRO", `Unknown value macro: ${macroName}`, { macroName });
    }

    pushMacro(state, macroName);
    try {
      pushLocalScope(state, bindMacroParams(macro, toArgRecord(args[1]), context, state, macros));
      const result = evaluateExprNode({
        ast: macro.body,
        context,
        state,
        macros,
        nesting,
      });
      popLocalScope(state);
      return result;
    } finally {
      popMacro(state);
    }
  }

  if (node.name === "use") {
    throw runtimeError("INVALID_MACRO", "use() is not available in expr runtime");
  }

  return invokeHelper(node.name, {
    args,
    context,
    state: snapshotRuntimeState(state),
    options: state.options,
  });
}
