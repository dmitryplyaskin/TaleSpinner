import { describe, expect, test } from "vitest";

import { extractEmbeddings } from "./rag-embeddings-normalizer";

describe("rag-embeddings-normalizer", () => {
  test("extracts embeddings from ollama-like response", () => {
    const vectors = extractEmbeddings({
      embeddings: [
        [0.1, 0.2, 0.3],
        [1.1, 1.2, 1.3],
      ],
    });

    expect(vectors).toEqual([
      [0.1, 0.2, 0.3],
      [1.1, 1.2, 1.3],
    ]);
  });

  test("extracts embeddings from openai/openrouter-like response", () => {
    const vectors = extractEmbeddings({
      data: [{ embedding: [10, 20, 30] }, { embedding: [11, 22, 33] }],
    });

    expect(vectors).toEqual([
      [10, 20, 30],
      [11, 22, 33],
    ]);
  });

  test("throws on unsupported shape", () => {
    expect(() => extractEmbeddings({ foo: "bar" })).toThrow(
      "Embedding response does not contain supported embeddings format"
    );
  });

  test("throws on invalid numeric content", () => {
    expect(() =>
      extractEmbeddings({
        embeddings: [[0.1, "x", 0.3]],
      })
    ).toThrow("Embedding response does not contain supported embeddings format");
  });

  test("throws when expected count mismatches actual vector count", () => {
    expect(() =>
      extractEmbeddings(
        {
          embeddings: [[0.1], [0.2]],
        },
        { expectedCount: 3 }
      )
    ).toThrow("Embedding count mismatch: expected 3, received 2");
  });
});
