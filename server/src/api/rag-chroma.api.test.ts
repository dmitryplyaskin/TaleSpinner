import { describe, expect, test } from "vitest";

import {
  chromaCollectionCreateBodySchema,
  chromaCollectionParamsSchema,
  chromaCollectionPeekQuerySchema,
  chromaDocumentsDeleteBodySchema,
  chromaDocumentsUpsertBodySchema,
  chromaQueryBodySchema,
  chromaWorldInfoReindexBodySchema,
} from "./rag-chroma.api";

describe("rag-chroma route schemas", () => {
  test("validates collection params/create payload", () => {
    expect(chromaCollectionParamsSchema.safeParse({ name: "world-info" }).success).toBe(
      true
    );
    expect(
      chromaCollectionCreateBodySchema.safeParse({
        name: "world-info",
        metadata: { source: "manual", enabled: true, score: 1, note: null },
      }).success
    ).toBe(true);
    expect(chromaCollectionCreateBodySchema.safeParse({ name: "" }).success).toBe(false);
  });

  test("peek query schema applies default and rejects invalid limit", () => {
    const parsed = chromaCollectionPeekQuerySchema.parse({});
    expect(parsed.limit).toBe(10);
    expect(chromaCollectionPeekQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
  });

  test("upsert body requires non-empty items with id/document", () => {
    expect(
      chromaDocumentsUpsertBodySchema.safeParse({
        collectionName: "world-info",
        items: [{ id: "1", document: "text", metadata: { source: "x" } }],
      }).success
    ).toBe(true);
    expect(chromaDocumentsUpsertBodySchema.safeParse({ items: [] }).success).toBe(false);
    expect(
      chromaDocumentsUpsertBodySchema.safeParse({
        items: [{ id: "", document: "x" }],
      }).success
    ).toBe(false);
  });

  test("delete body requires ids or where", () => {
    expect(
      chromaDocumentsDeleteBodySchema.safeParse({
        collectionName: "world-info",
        ids: ["a", "b"],
      }).success
    ).toBe(true);
    expect(
      chromaDocumentsDeleteBodySchema.safeParse({
        collectionName: "world-info",
        where: { source: "world_info" },
      }).success
    ).toBe(true);
    expect(
      chromaDocumentsDeleteBodySchema.safeParse({
        collectionName: "world-info",
      }).success
    ).toBe(false);
  });

  test("query schema validates required query and limit range", () => {
    expect(
      chromaQueryBodySchema.safeParse({
        query: "dragon lore",
        limit: 5,
      }).success
    ).toBe(true);
    expect(chromaQueryBodySchema.safeParse({ query: "" }).success).toBe(false);
    expect(chromaQueryBodySchema.safeParse({ query: "x", limit: 0 }).success).toBe(false);
  });

  test("world-info reindex schema accepts optional owner/collection", () => {
    expect(chromaWorldInfoReindexBodySchema.safeParse({}).success).toBe(true);
    expect(
      chromaWorldInfoReindexBodySchema.safeParse({
        ownerId: "global",
        collectionName: "world-info",
      }).success
    ).toBe(true);
    expect(chromaWorldInfoReindexBodySchema.safeParse({ ownerId: "" }).success).toBe(false);
  });
});
