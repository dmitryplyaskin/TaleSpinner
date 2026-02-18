import { describe, expect, test } from "vitest";

import {
  INITIAL_OPERATION_ACTIVATION_STATE,
  resolveOperationActivationState,
} from "./operation-activation-intervals";

describe("operation activation intervals", () => {
  test("counts turns only on user_message and triggers on threshold", () => {
    let state = { ...INITIAL_OPERATION_ACTIVATION_STATE };

    for (let idx = 1; idx <= 4; idx += 1) {
      const out = resolveOperationActivationState({
        activation: { everyNTurns: 5 },
        previous: state,
        source: "user_message",
        currentContextTokens: idx * 100,
        supportsCurrentTrigger: true,
      });
      expect(out.shouldRunNow).toBe(false);
      state = out.nextState;
    }

    const fifth = resolveOperationActivationState({
      activation: { everyNTurns: 5 },
      previous: state,
      source: "user_message",
      currentContextTokens: 500,
      supportsCurrentTrigger: true,
    });
    expect(fifth.shouldRunNow).toBe(true);
    expect(fifth.nextState.turnsCounter).toBe(0);
    expect(fifth.nextState.tokensCounter).toBe(0);

    const regen = resolveOperationActivationState({
      activation: { everyNTurns: 5 },
      previous: fifth.nextState,
      source: "regenerate",
      currentContextTokens: 700,
      supportsCurrentTrigger: true,
    });
    expect(regen.shouldRunNow).toBe(false);
    expect(regen.nextState.turnsCounter).toBe(0);
  });

  test("counts token deltas and does not decrement when context shrinks", () => {
    const first = resolveOperationActivationState({
      activation: { everyNContextTokens: 4000 },
      previous: INITIAL_OPERATION_ACTIVATION_STATE,
      source: "user_message",
      currentContextTokens: 2500,
      supportsCurrentTrigger: true,
    });
    expect(first.shouldRunNow).toBe(false);
    expect(first.nextState.tokensCounter).toBe(2500);

    const shrunk = resolveOperationActivationState({
      activation: { everyNContextTokens: 4000 },
      previous: first.nextState,
      source: "user_message",
      currentContextTokens: 2000,
      supportsCurrentTrigger: true,
    });
    expect(shrunk.shouldRunNow).toBe(false);
    expect(shrunk.nextState.tokensCounter).toBe(2500);

    const reached = resolveOperationActivationState({
      activation: { everyNContextTokens: 4000 },
      previous: shrunk.nextState,
      source: "user_message",
      currentContextTokens: 4200,
      supportsCurrentTrigger: true,
    });
    expect(reached.shouldRunNow).toBe(true);
    expect(reached.nextState.tokensCounter).toBe(0);
  });

  test("uses OR logic and resets both counters when one threshold is reached", () => {
    const out = resolveOperationActivationState({
      activation: { everyNTurns: 10, everyNContextTokens: 1000 },
      previous: {
        turnsCounter: 8,
        tokensCounter: 950,
        lastContextTokens: 1000,
      },
      source: "user_message",
      currentContextTokens: 1100,
      supportsCurrentTrigger: true,
    });
    expect(out.shouldRunNow).toBe(true);
    expect(out.nextState.turnsCounter).toBe(0);
    expect(out.nextState.tokensCounter).toBe(0);
    expect(out.nextState.lastContextTokens).toBe(1100);
  });

  test("keeps reached state when trigger is not supported and runs later", () => {
    const reachedButBlocked = resolveOperationActivationState({
      activation: { everyNTurns: 2 },
      previous: {
        turnsCounter: 1,
        tokensCounter: 0,
        lastContextTokens: 120,
      },
      source: "user_message",
      currentContextTokens: 240,
      supportsCurrentTrigger: false,
    });
    expect(reachedButBlocked.shouldRunNow).toBe(false);
    expect(reachedButBlocked.nextState.turnsCounter).toBe(2);

    const laterRun = resolveOperationActivationState({
      activation: { everyNTurns: 2 },
      previous: reachedButBlocked.nextState,
      source: "regenerate",
      currentContextTokens: 240,
      supportsCurrentTrigger: true,
    });
    expect(laterRun.shouldRunNow).toBe(true);
    expect(laterRun.nextState.turnsCounter).toBe(0);
  });
});
