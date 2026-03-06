function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function assertVectors(input: unknown): number[][] | null {
  if (!Array.isArray(input)) return null;
  if (input.length === 0) return [];

  const vectors: number[][] = [];
  for (const item of input) {
    if (!Array.isArray(item)) return null;
    const vector: number[] = [];
    for (const dim of item) {
      if (!isFiniteNumber(dim)) return null;
      vector.push(dim);
    }
    vectors.push(vector);
  }
  return vectors;
}

export function extractEmbeddings(
  raw: unknown,
  options?: { expectedCount?: number }
): number[][] {
  let vectors: number[][] | null = null;

  if (isRecord(raw)) {
    vectors = assertVectors(raw.embeddings);

    if (!vectors && Array.isArray(raw.data)) {
      const mapped: number[][] = [];
      for (const item of raw.data) {
        if (!isRecord(item)) {
          throw new Error("Embedding response contains malformed data item");
        }
        const vector = assertVectors([item.embedding]);
        if (!vector || !vector[0]) {
          throw new Error("Embedding response item is missing numeric embedding");
        }
        mapped.push(vector[0]);
      }
      vectors = mapped;
    }
  }

  if (!vectors) {
    throw new Error("Embedding response does not contain supported embeddings format");
  }

  if (vectors.length === 0) {
    throw new Error("Embedding response returned empty embeddings");
  }

  if (
    typeof options?.expectedCount === "number" &&
    options.expectedCount > 0 &&
    vectors.length !== options.expectedCount
  ) {
    throw new Error(
      `Embedding count mismatch: expected ${options.expectedCount}, received ${vectors.length}`
    );
  }

  return vectors;
}
