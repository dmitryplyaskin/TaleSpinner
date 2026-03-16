import { runtimeError } from "./errors";

import type { DebugTrace, MacroRegistry, RuntimeOptions, RuntimeState, StatementScope } from "../types";

const DEFAULT_OPTIONS = {
  strictVariables: false,
  maxMacroDepth: 8,
  maxExecutionSteps: 2_000,
  maxOutputChars: 200_000,
  maxObjectNesting: 16,
  maxAstNodes: 2_000,
} as const;

export type NormalizedRuntimeOptions = Required<
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

export type ExecutionState = {
  localScopes: Array<Record<string, unknown>>;
  renderScope: Record<string, unknown>;
  turnScope: Record<string, unknown>;
  sessionScope?: Record<string, unknown>;
  steps: number;
  macroStack: string[];
  trimSentinelUsed: boolean;
  macros?: MacroRegistry;
  options: NormalizedRuntimeOptions;
};

export const TRIM_SENTINEL = "__TS_NATIVE_TEMPLATE_TRIM__";

export function normalizeRuntimeOptions(options?: RuntimeOptions): NormalizedRuntimeOptions {
  return {
    ...DEFAULT_OPTIONS,
    ...options,
    rng: options?.rng ?? Math.random,
  };
}

export function createExecutionState(params: {
  state?: RuntimeState;
  options?: RuntimeOptions;
  macros?: MacroRegistry;
}): ExecutionState {
  return {
    localScopes: [structuredClone(params.state?.scopes.local ?? {})],
    renderScope: structuredClone(params.state?.scopes.render ?? {}),
    turnScope: structuredClone(params.state?.scopes.turn ?? {}),
    sessionScope: params.state?.scopes.session
      ? structuredClone(params.state.scopes.session)
      : undefined,
    steps: 0,
    macroStack: [],
    trimSentinelUsed: false,
    macros: params.macros,
    options: normalizeRuntimeOptions(params.options),
  };
}

export function snapshotRuntimeState(state: ExecutionState): RuntimeState {
  return {
    scopes: {
      local: structuredClone(state.localScopes[state.localScopes.length - 1] ?? {}),
      render: structuredClone(state.renderScope),
      turn: structuredClone(state.turnScope),
      ...(state.sessionScope ? { session: structuredClone(state.sessionScope) } : {}),
    },
  };
}

export function pushLocalScope(state: ExecutionState, values?: Record<string, unknown>): void {
  const next = {
    ...(state.localScopes[state.localScopes.length - 1] ?? {}),
    ...(values ?? {}),
  };
  state.localScopes.push(next);
}

export function popLocalScope(state: ExecutionState): void {
  if (state.localScopes.length > 1) state.localScopes.pop();
}

export function readScopedValue(state: ExecutionState, key: string): unknown {
  const local = state.localScopes[state.localScopes.length - 1];
  if (local && key in local) return local[key];
  if (key in state.renderScope) return state.renderScope[key];
  if (key in state.turnScope) return state.turnScope[key];
  if (state.sessionScope && key in state.sessionScope) return state.sessionScope[key];
  return undefined;
}

export function writeScopedValue(
  state: ExecutionState,
  scope: StatementScope,
  key: string,
  value: unknown
): void {
  if (scope === "session") {
    throw runtimeError("INVALID_SCOPE", "session scope is reserved and disabled in v1", {
      scope,
      key,
    });
  }

  if (scope === "local") {
    state.localScopes[state.localScopes.length - 1][key] = value;
    return;
  }
  if (scope === "render") {
    state.renderScope[key] = value;
    return;
  }
  state.turnScope[key] = value;
}

export function unsetScopedValue(state: ExecutionState, scope: StatementScope, key: string): void {
  if (scope === "session") {
    throw runtimeError("INVALID_SCOPE", "session scope is reserved and disabled in v1", {
      scope,
      key,
    });
  }

  if (scope === "local") {
    delete state.localScopes[state.localScopes.length - 1]?.[key];
    return;
  }
  if (scope === "render") {
    delete state.renderScope[key];
    return;
  }
  delete state.turnScope[key];
}

export function step(state: ExecutionState, label: string): void {
  state.steps += 1;
  state.options.debugTrace?.execution?.push(label);
  if (state.steps > state.options.maxExecutionSteps) {
    throw runtimeError("LIMIT_EXCEEDED", "runtime exceeded maxExecutionSteps", {
      maxExecutionSteps: state.options.maxExecutionSteps,
      label,
    });
  }
}

export function assertNodeLimit(count: number, state: ExecutionState, label: string): void {
  if (count > state.options.maxAstNodes) {
    throw runtimeError("LIMIT_EXCEEDED", `runtime exceeded maxAstNodes in ${label}`, {
      count,
      maxAstNodes: state.options.maxAstNodes,
    });
  }
}

export function pushMacro(state: ExecutionState, macroName: string): void {
  if (state.macroStack.includes(macroName)) {
    throw runtimeError("MACRO_CYCLE", `macro cycle detected for ${macroName}`, {
      macroName,
      stack: [...state.macroStack],
    });
  }
  if (state.macroStack.length >= state.options.maxMacroDepth) {
    throw runtimeError("LIMIT_EXCEEDED", "runtime exceeded maxMacroDepth", {
      maxMacroDepth: state.options.maxMacroDepth,
      macroName,
    });
  }
  state.macroStack.push(macroName);
}

export function popMacro(state: ExecutionState): void {
  state.macroStack.pop();
}
