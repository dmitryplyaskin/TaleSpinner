import express, { type Request } from "express";
import { z } from "zod";

import { ownerIdSchema } from "../chat-core/schemas";
import { asyncHandler } from "../core/middleware/async-handler";
import { validate } from "../core/middleware/validate";
import { chromaRagService } from "../services/rag/chroma-rag.service";

const router = express.Router();

const metadataValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const metadataSchema = z.record(z.string(), metadataValueSchema);
const whereSchema = z.record(z.string(), z.unknown());

export const chromaCollectionNameSchema = z.string().min(1);
export const chromaCollectionParamsSchema = z.object({
  name: chromaCollectionNameSchema,
});

export const chromaCollectionCreateBodySchema = z.object({
  name: chromaCollectionNameSchema,
  metadata: metadataSchema.optional(),
});

export const chromaCollectionPeekQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(10),
});

export const chromaDocumentsUpsertBodySchema = z.object({
  collectionName: chromaCollectionNameSchema.optional(),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        document: z.string().min(1),
        metadata: metadataSchema.optional(),
      })
    )
    .min(1),
});

export const chromaDocumentsDeleteBodySchema = z
  .object({
    collectionName: chromaCollectionNameSchema.optional(),
    ids: z.array(z.string().min(1)).min(1).optional(),
    where: whereSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.ids && !value.where) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either ids or where is required",
        path: ["ids"],
      });
    }
  });

export const chromaQueryBodySchema = z.object({
  collectionName: chromaCollectionNameSchema.optional(),
  query: z.string().min(1),
  limit: z.number().int().min(1).max(200).optional().default(10),
  where: whereSchema.optional(),
});

export const chromaWorldInfoReindexBodySchema = z.object({
  ownerId: ownerIdSchema.optional(),
  collectionName: chromaCollectionNameSchema.optional(),
});

router.get(
  "/rag/chroma/health",
  asyncHandler(async () => {
    return { data: await chromaRagService.health() };
  })
);

router.get(
  "/rag/chroma/collections",
  asyncHandler(async () => {
    return { data: { collections: await chromaRagService.listCollections() } };
  })
);

router.post(
  "/rag/chroma/collections",
  validate({ body: chromaCollectionCreateBodySchema }),
  asyncHandler(async (req: Request) => {
    return {
      data: await chromaRagService.createCollection(
        req.body as z.infer<typeof chromaCollectionCreateBodySchema>
      ),
    };
  })
);

router.delete(
  "/rag/chroma/collections/:name",
  validate({ params: chromaCollectionParamsSchema }),
  asyncHandler(async (req: Request) => {
    return { data: await chromaRagService.deleteCollection(String(req.params.name)) };
  })
);

router.get(
  "/rag/chroma/collections/:name/peek",
  validate({
    params: chromaCollectionParamsSchema,
    query: chromaCollectionPeekQuerySchema,
  }),
  asyncHandler(async (req: Request) => {
    const query = chromaCollectionPeekQuerySchema.parse(req.query);
    return {
      data: await chromaRagService.peek({
        collectionName: String(req.params.name),
        limit: query.limit,
      }),
    };
  })
);

router.post(
  "/rag/chroma/documents/upsert",
  validate({ body: chromaDocumentsUpsertBodySchema }),
  asyncHandler(async (req: Request) => {
    return {
      data: await chromaRagService.upsertDocuments(
        req.body as z.infer<typeof chromaDocumentsUpsertBodySchema>
      ),
    };
  })
);

router.post(
  "/rag/chroma/documents/delete",
  validate({ body: chromaDocumentsDeleteBodySchema }),
  asyncHandler(async (req: Request) => {
    return {
      data: await chromaRagService.deleteDocuments(
        req.body as z.infer<typeof chromaDocumentsDeleteBodySchema>
      ),
    };
  })
);

router.post(
  "/rag/chroma/query",
  validate({ body: chromaQueryBodySchema }),
  asyncHandler(async (req: Request) => {
    const body = req.body as z.infer<typeof chromaQueryBodySchema>;
    return {
      data: await chromaRagService.query({
        collectionName: body.collectionName,
        query: body.query,
        limit: body.limit,
        where: body.where,
      }),
    };
  })
);

router.post(
  "/rag/chroma/world-info/reindex",
  validate({ body: chromaWorldInfoReindexBodySchema }),
  asyncHandler(async (req: Request) => {
    return {
      data: await chromaRagService.reindexWorldInfoFullReplace(
        req.body as z.infer<typeof chromaWorldInfoReindexBodySchema>
      ),
    };
  })
);

export default router;
