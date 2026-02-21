import type { OperationActivationConfig } from "@shared/types/operation-profiles";

export type OperationActivationState = {
  turnsCounter: number;
  tokensCounter: number;
};

export type OperationActivationSkipSnapshot = {
  everyNTurns?: number;
  everyNContextTokens?: number;
  turnsCounter: number;
  tokensCounter: number;
};

export type RunActivationSource = "user_message" | "continue" | "regenerate" | "system_message";

export type ResolveActivationResult = {
  hasActivation: boolean;
  shouldRunNow: boolean;
  nextState: OperationActivationState;
  skipSnapshot?: OperationActivationSkipSnapshot;
};

export const INITIAL_OPERATION_ACTIVATION_STATE: OperationActivationState = {
  turnsCounter: 0,
  tokensCounter: 0,
};

function toNonNegativeInt(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function normalizeState(state: OperationActivationState | undefined): OperationActivationState {
  if (!state) return { ...INITIAL_OPERATION_ACTIVATION_STATE };
  return {
    turnsCounter: toNonNegativeInt(state.turnsCounter),
    tokensCounter: toNonNegativeInt(state.tokensCounter),
  };
}

export function normalizeOperationActivationConfig(
  activation: OperationActivationConfig | undefined
): { everyNTurns?: number; everyNContextTokens?: number } | null {
  if (!activation) return null;
  const everyNTurns = toNonNegativeInt(activation.everyNTurns);
  const everyNContextTokens = toNonNegativeInt(activation.everyNContextTokens);
  if (everyNTurns < 1 && everyNContextTokens < 1) return null;
  return {
    everyNTurns: everyNTurns >= 1 ? everyNTurns : undefined,
    everyNContextTokens: everyNContextTokens >= 1 ? everyNContextTokens : undefined,
  };
}

export function resolveOperationActivationState(params: {
  activation: OperationActivationConfig | undefined;
  previous: OperationActivationState | undefined;
  source: RunActivationSource;
  currentContextTokens: number;
  supportsCurrentTrigger: boolean;
}): ResolveActivationResult {
  const normalizedActivation = normalizeOperationActivationConfig(params.activation);
  const currentContextTokens = toNonNegativeInt(params.currentContextTokens);
  const previous = normalizeState(params.previous);
  if (!normalizedActivation) {
    return {
      hasActivation: false,
      shouldRunNow: true,
      nextState: previous,
    };
  }

  const next: OperationActivationState = { ...previous };
  if (params.source === "user_message") {
    next.turnsCounter += 1;
    next.tokensCounter += currentContextTokens;
  }

  const turnsReached =
    typeof normalizedActivation.everyNTurns === "number" &&
    next.turnsCounter >= normalizedActivation.everyNTurns;
  const tokensReached =
    typeof normalizedActivation.everyNContextTokens === "number" &&
    next.tokensCounter >= normalizedActivation.everyNContextTokens;
  const shouldRunNow = params.supportsCurrentTrigger && (turnsReached || tokensReached);

  if (shouldRunNow) {
    next.turnsCounter = 0;
    next.tokensCounter = 0;
  }

  const skipSnapshot =
    !shouldRunNow
      ? {
          everyNTurns: normalizedActivation.everyNTurns,
          everyNContextTokens: normalizedActivation.everyNContextTokens,
          turnsCounter: next.turnsCounter,
          tokensCounter: next.tokensCounter,
        }
      : undefined;

  return {
    hasActivation: true,
    shouldRunNow,
    nextState: next,
    skipSnapshot,
  };
}
