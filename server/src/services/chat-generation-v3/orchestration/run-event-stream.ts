import type { RunEvent } from "../contracts";

export type EmitRunEvent = (type: RunEvent["type"], data: unknown) => void;
export type StreamEventsWhile = <T>(work: Promise<T>) => AsyncGenerator<RunEvent, T>;

export class RunEventStream {
  private pendingEvents: RunEvent[] = [];

  private waiters: Array<() => void> = [];

  private seq = 0;

  private runId = "";

  setRunId(runId: string): void {
    this.runId = runId;
  }

  emit(type: RunEvent["type"], data: unknown): void {
    if (!this.runId) return;
    this.pendingEvents.push({
      runId: this.runId,
      seq: ++this.seq,
      type,
      data,
    } as RunEvent);
    this.notifyWaiters();
  }

  *flushEvents(): Generator<RunEvent> {
    while (this.pendingEvents.length > 0) {
      const evt = this.pendingEvents.shift();
      if (!evt) continue;
      yield evt;
    }
  }

  streamEventsWhile = async function* <T>(
    this: RunEventStream,
    work: Promise<T>
  ): AsyncGenerator<RunEvent, T> {
    let settled = false;
    let result: T | undefined;
    let failure: unknown;

    work.then(
      (value) => {
        result = value;
        settled = true;
        this.notifyWaiters();
      },
      (error) => {
        failure = error;
        settled = true;
        this.notifyWaiters();
      }
    );

    while (!settled || this.pendingEvents.length > 0) {
      if (this.pendingEvents.length > 0) {
        yield* this.flushEvents();
        continue;
      }
      await this.waitForSignal();
    }

    if (failure) throw failure;
    return result as T;
  };

  private notifyWaiters(): void {
    if (this.waiters.length === 0) return;
    const queued = this.waiters.splice(0, this.waiters.length);
    for (const wake of queued) wake();
  }

  private waitForSignal(): Promise<void> {
    return new Promise((resolve) => {
      this.waiters.push(resolve);
    });
  }
}
