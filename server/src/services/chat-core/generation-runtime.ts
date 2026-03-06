type RuntimeEntry = {
  abortController: AbortController;
  createdAtMs: number;
};

const active = new Map<string, RuntimeEntry>();

function nowMs(): number {
  return Date.now();
}

export function registerGenerationAbortController(
  generationId: string,
  abortController: AbortController
): void {
  active.set(generationId, { abortController, createdAtMs: nowMs() });
}

export function unregisterGenerationAbortController(generationId: string): void {
  active.delete(generationId);
}

export function abortRegisteredGeneration(generationId: string): boolean {
  const entry = active.get(generationId);
  if (!entry) return false;
  entry.abortController.abort();
  return true;
}

export function registerGeneration(generationId: string, abortController: AbortController): void {
  registerGenerationAbortController(generationId, abortController);
}

export function unregisterGeneration(generationId: string): void {
  unregisterGenerationAbortController(generationId);
}

export function abortGeneration(generationId: string): boolean {
  return abortRegisteredGeneration(generationId);
}

