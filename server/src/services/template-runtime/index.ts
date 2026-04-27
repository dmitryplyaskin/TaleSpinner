import { evaluateExprNode } from "./expr/evaluator";
import { parseExpr } from "./expr/parser";
import { createMacroRegistry, validateMacro } from "./macros/registry";
import { assertNodeLimit, createExecutionState } from "./runtime/state";
import { lowerTemplate, parseTemplate } from "./template/compiler";
import { renderTemplateAst } from "./template/renderer";
import { countExprNodes, countTemplateNodes } from "./types";

import type {
  ExprAst,
  InstructionRenderContext,
  MacroRegistry,
  RuntimeOptions,
  RuntimeState,
  TemplateAst,
} from "./types";

export type {
  DebugTrace,
  ExprAst,
  ExprNode,
  InstructionRenderContext,
  MacroDefinition,
  MacroRegistry,
  RuntimeError,
  RuntimeOptions,
  RuntimeState,
  TemplateAst,
  TemplateNode,
} from "./types";

export function compileExpr(source: string): ExprAst {
  return parseExpr(source);
}

export function validateExpr(source: string): void {
  compileExpr(source);
}

export function evaluateExpr(params: {
  source?: string;
  ast?: ExprAst;
  context: InstructionRenderContext;
  state?: RuntimeState;
  macros?: MacroRegistry;
  options?: RuntimeOptions;
}): unknown {
  const ast = params.ast ?? compileExpr(params.source ?? "");
  const executionState = createExecutionState({
    state: params.state,
    options: params.options,
    macros: params.macros,
  });
  assertNodeLimit(countExprNodes(ast), executionState, "expr");
  return evaluateExprNode({
    ast,
    context: params.context,
    state: executionState,
    macros: params.macros,
  });
}

export function compileTemplate(source: string): TemplateAst {
  return lowerTemplate(parseTemplate(source));
}

export function validateTemplate(source: string): void {
  compileTemplate(source);
}

export function renderTemplate(params: {
  source?: string;
  ast?: TemplateAst;
  context: InstructionRenderContext;
  state?: RuntimeState;
  macros?: MacroRegistry;
  options?: RuntimeOptions;
}): string {
  const ast = params.ast ?? compileTemplate(params.source ?? "");
  const executionState = createExecutionState({
    state: params.state,
    options: params.options,
    macros: params.macros,
  });
  assertNodeLimit(countTemplateNodes(ast.nodes), executionState, "template");
  return renderTemplateAst({
    ast,
    context: params.context,
    state: executionState,
    macros: params.macros,
  });
}

export { createMacroRegistry, validateMacro };
