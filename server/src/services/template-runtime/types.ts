import type { InstructionRenderContext as BaseInstructionRenderContext } from "../chat-core/prompt-template-renderer";

export type InstructionRenderContext = BaseInstructionRenderContext;

export type RuntimeErrorCode =
  | "EXPR_PARSE_ERROR"
  | "TEMPLATE_PARSE_ERROR"
  | "UNKNOWN_ST_ALIAS"
  | "UNKNOWN_HELPER"
  | "UNKNOWN_MACRO"
  | "HELPER_ERROR"
  | "MISSING_VARIABLE"
  | "INVALID_SCOPE"
  | "MACRO_CYCLE"
  | "LIMIT_EXCEEDED"
  | "INVALID_MACRO";

export class RuntimeError extends Error {
  code: RuntimeErrorCode;
  details?: Record<string, unknown>;

  constructor(code: RuntimeErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "RuntimeError";
    this.code = code;
    this.details = details;
  }
}

export type DebugTrace = {
  parser?: unknown;
  loweredAst?: unknown;
  execution?: string[];
};

export type RuntimeOptions = {
  strictVariables?: boolean;
  rng?: () => number;
  maxMacroDepth?: number;
  maxExecutionSteps?: number;
  maxOutputChars?: number;
  maxObjectNesting?: number;
  maxAstNodes?: number;
  debugTrace?: DebugTrace;
};

export type RuntimeState = {
  scopes: {
    local: Record<string, unknown>;
    render: Record<string, unknown>;
    turn: Record<string, unknown>;
    session?: Record<string, unknown>;
  };
};

export type ExprNode =
  | { kind: "literal"; value: null | boolean | number | string }
  | { kind: "path"; segments: string[] }
  | { kind: "call"; name: string; args: ExprNode[] }
  | { kind: "array"; items: ExprNode[] }
  | { kind: "object"; entries: Array<{ key: string; value: ExprNode }> }
  | { kind: "unary"; op: "not"; value: ExprNode }
  | {
      kind: "binary";
      op: "and" | "or" | "eq" | "neq";
      left: ExprNode;
      right: ExprNode;
    };

export type ExprAst = ExprNode;

export type StatementScope = "local" | "render" | "turn" | "session";

export type StatementNode =
  | { kind: "trim" }
  | { kind: "set"; scope: StatementScope; name: string; value: ExprNode }
  | { kind: "unset"; scope: StatementScope; name: string };

export type TemplateNode =
  | { kind: "text"; value: string }
  | { kind: "output"; expr: ExprNode }
  | { kind: "if"; condition: ExprNode; then: TemplateNode[]; else: TemplateNode[] }
  | { kind: "each"; source: ExprNode; itemName: string; body: TemplateNode[] }
  | { kind: "statement"; statement: StatementNode };

export type TemplateAst = {
  kind: "template";
  nodes: TemplateNode[];
};

export type MacroParamDefinition = {
  name: string;
  required: boolean;
  defaultExpr?: string;
};

export type MacroDefinition = {
  id?: string;
  ownerId?: string;
  name: string;
  kind: "value" | "template";
  description?: string;
  engine?: "native_v1";
  params: MacroParamDefinition[];
  body: string;
};

export type CompiledMacroDefinition =
  | {
      name: string;
      kind: "value";
      params: MacroParamDefinition[];
      body: ExprAst;
    }
  | {
      name: string;
      kind: "template";
      params: MacroParamDefinition[];
      body: TemplateAst;
    };

export type MacroRegistry = {
  definitions: ReadonlyMap<string, MacroDefinition>;
  get(name: string): MacroDefinition | undefined;
  getCompiled(name: string): CompiledMacroDefinition | undefined;
};

export type HelperInvocation = {
  args: unknown[];
  context: InstructionRenderContext;
  state: RuntimeState;
  options: Required<
    Pick<
      RuntimeOptions,
      | "strictVariables"
      | "maxMacroDepth"
      | "maxExecutionSteps"
      | "maxOutputChars"
      | "maxObjectNesting"
      | "maxAstNodes"
    >
  > & {
    rng: () => number;
    debugTrace?: DebugTrace;
  };
};

export type HelperDefinition = (input: HelperInvocation) => unknown;

export type RawTemplateNode =
  | { kind: "text"; value: string }
  | { kind: "raw_output"; source: string }
  | { kind: "raw_if"; condition: string; then: RawTemplateNode[]; else: RawTemplateNode[] }
  | { kind: "raw_each"; source: string; body: RawTemplateNode[] };

export type RawTemplateAst = {
  kind: "template_raw";
  nodes: RawTemplateNode[];
};

export function countExprNodes(node: ExprNode): number {
  switch (node.kind) {
    case "literal":
    case "path":
      return 1;
    case "call":
      return 1 + node.args.reduce((sum, arg) => sum + countExprNodes(arg), 0);
    case "array":
      return 1 + node.items.reduce((sum, item) => sum + countExprNodes(item), 0);
    case "object":
      return 1 + node.entries.reduce((sum, entry) => sum + countExprNodes(entry.value), 0);
    case "unary":
      return 1 + countExprNodes(node.value);
    case "binary":
      return 1 + countExprNodes(node.left) + countExprNodes(node.right);
  }
}

export function countTemplateNodes(nodes: TemplateNode[]): number {
  return nodes.reduce((sum, node) => sum + countTemplateNode(node), 0);
}

function countTemplateNode(node: TemplateNode): number {
  switch (node.kind) {
    case "text":
      return 1;
    case "output":
      return 1 + countExprNodes(node.expr);
    case "statement":
      return 1 + ("value" in node.statement ? countExprNodes(node.statement.value) : 0);
    case "if":
      return (
        1 +
        countExprNodes(node.condition) +
        countTemplateNodes(node.then) +
        countTemplateNodes(node.else)
      );
    case "each":
      return 1 + countExprNodes(node.source) + countTemplateNodes(node.body);
  }
}
