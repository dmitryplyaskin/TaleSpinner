type RuntimeEntry = {
  abortController: AbortController;
  createdAtMs: number;
};

const active = new Map<string, RuntimeEntry>();

function nowMs(): number {
  return Date.now();
}

export function registerGeneration(generationId: string, abortController: AbortController): void {
  active.set(generationId, { abortController, createdAtMs: nowMs() });
}

export function unregisterGeneration(generationId: string): void {
  active.delete(generationId);
}

export function abortGeneration(generationId: string): boolean {
  const entry = active.get(generationId);
  if (!entry) return false;
  entry.abortController.abort();
  return true;
}

