import { runtimeError } from "./errors";
import { readScopedValue } from "./state";

import type { ExecutionState } from "./state";
import type { InstructionRenderContext } from "../types";

function hasOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export function resolvePathValue(params: {
  segments: string[];
  context: InstructionRenderContext;
  state: ExecutionState;
}): unknown {
  const [head, ...tail] = params.segments;
  let current: unknown = readScopedValue(params.state, head);

  if (typeof current === "undefined") {
    current = (params.context as unknown as Record<string, unknown>)[head];
  }

  if (typeof current === "undefined") {
    if (params.state.options.strictVariables) {
      throw runtimeError("MISSING_VARIABLE", `Unknown variable: ${head}`, { path: params.segments });
    }
    return null;
  }

  for (const segment of tail) {
    if (current === null || typeof current !== "object" || !hasOwn(current, segment)) {
      if (params.state.options.strictVariables) {
        throw runtimeError("MISSING_VARIABLE", `Unknown path: ${params.segments.join(".")}`, {
          path: params.segments,
        });
      }
      return null;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === "undefined" ? null : current;
}
