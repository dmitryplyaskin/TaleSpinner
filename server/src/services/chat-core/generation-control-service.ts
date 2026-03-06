import {
  abortRegisteredGeneration,
  registerGenerationAbortController,
  unregisterGenerationAbortController,
} from "./generation-runtime";
import {
  clearGenerationControlLease,
  getGenerationControlByGenerationId,
  heartbeatGenerationControlLease,
  markGenerationAbortRequested,
  upsertGenerationControlLease,
} from "./generation-control-repository";
import { structuredLogger } from "../../core/logging/structured-logger";

import type { RunResult } from "../chat-generation-v3/contracts";

const DEFAULT_LEASE_MS = 15_000;
const DEFAULT_POLL_MS = 1_000;

function computeLeaseExpiresAt(now: Date, leaseMs: number): Date {
  return new Date(now.getTime() + leaseMs);
}

function isLeaseExpired(leaseExpiresAt: Date, now: Date): boolean {
  return leaseExpiresAt.getTime() <= now.getTime();
}

export type GenerationControlLease = {
  heartbeat: () => Promise<void>;
  release: (params: { status: RunResult["status"] | null }) => Promise<void>;
};

export class GenerationControlService {
  static async acquire(params: {
    generationId: string;
    runInstanceId: string;
    abortController: AbortController;
    leaseMs?: number;
    pollMs?: number;
  }): Promise<GenerationControlLease> {
    const leaseMs = params.leaseMs ?? DEFAULT_LEASE_MS;
    const pollMs = params.pollMs ?? DEFAULT_POLL_MS;
    const writeHeartbeat = async (): Promise<void> => {
      const now = new Date();
      const current = await getGenerationControlByGenerationId(params.generationId);
      if (!current || current.runInstanceId !== params.runInstanceId) {
        params.abortController.abort();
        return;
      }
      if (current.abortRequestedAt) {
        params.abortController.abort();
      }
      await heartbeatGenerationControlLease({
        generationId: params.generationId,
        runInstanceId: params.runInstanceId,
        heartbeatAt: now,
        leaseExpiresAt: computeLeaseExpiresAt(now, leaseMs),
      });
    };

    const now = new Date();
    await upsertGenerationControlLease({
      generationId: params.generationId,
      runInstanceId: params.runInstanceId,
      heartbeatAt: now,
      leaseExpiresAt: computeLeaseExpiresAt(now, leaseMs),
    });
    registerGenerationAbortController(params.generationId, params.abortController);

    let released = false;
    const timer = setInterval(() => {
      void writeHeartbeat().catch(() => undefined);
    }, pollMs);
    timer.unref?.();

    return {
      heartbeat: writeHeartbeat,
      release: async () => {
        if (released) return;
        released = true;
        clearInterval(timer);
        unregisterGenerationAbortController(params.generationId);
        await clearGenerationControlLease({ generationId: params.generationId });
      },
    };
  }

  static async requestAbort(generationId: string): Promise<boolean> {
    const current = await getGenerationControlByGenerationId(generationId);
    const now = new Date();
    if (!current) return false;
    if (isLeaseExpired(current.leaseExpiresAt, now)) {
      await clearGenerationControlLease({ generationId });
      structuredLogger.warn("generation.abort.missed_expired", {
        event: "generation.abort.missed_expired",
        generationId,
      });
      return false;
    }

    await markGenerationAbortRequested({
      generationId,
      requestedAt: now,
    });
    abortRegisteredGeneration(generationId);
    structuredLogger.info("generation.abort.requested", {
      event: "generation.abort.requested",
      generationId,
      runId: current.runInstanceId,
    });
    return true;
  }
}
