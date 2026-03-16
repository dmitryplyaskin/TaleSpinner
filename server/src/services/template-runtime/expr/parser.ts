import { runtimeError } from "../runtime/errors";

import parser from "./expr-parser";

import type { ExprAst } from "../types";

export function parseExpr(source: string): ExprAst {
  try {
    return parser.parse(source) as ExprAst;
  } catch (error) {
    throw runtimeError(
      "EXPR_PARSE_ERROR",
      error instanceof Error ? error.message : String(error),
      { source }
    );
  }
}
