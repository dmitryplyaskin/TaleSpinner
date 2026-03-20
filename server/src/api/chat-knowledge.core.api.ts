import {
  knowledgeAccessModes,
  knowledgeExportModes,
  knowledgeLayers,
  knowledgeOrigins,
  knowledgeRecordStatuses,
  knowledgeScopes,
  type KnowledgeCollectionExportPayload,
  type KnowledgeGatePolicy,
} from "@shared/types/chat-knowledge";
import express, { type Request } from "express";
import { z } from "zod";

import { asyncHandler } from "@core/middleware/async-handler";
import { HttpError } from "@core/middleware/error-handler";
import { validate } from "@core/middleware/validate";

import { idSchema, ownerIdSchema } from "../chat-core/schemas";
import { getRequestOwnerId } from "../core/request-context/request-context";
import {
  createKnowledgeCollection,
  exportKnowledgeCollection,
  getKnowledgeCollectionById,
  importKnowledgeCollection,
  listKnowledgeCollections,
} from "../services/chat-knowledge/knowledge-collections-repository";
import {
  createKnowledgeRecordLinksBulk,
  listKnowledgeRecordLinks,
} from "../services/chat-knowledge/knowledge-links-repository";
import {
  getKnowledgeRecordById,
  listKnowledgeRecords,
  upsertKnowledgeRecord,
} from "../services/chat-knowledge/knowledge-records-repository";
import { revealKnowledgeRecords } from "../services/chat-knowledge/knowledge-reveal-service";
import { searchKnowledgeRecords } from "../services/chat-knowledge/knowledge-search-service";

const router = express.Router();

const branchIdSchema = idSchema.nullable().optional();
const knowledgeScopeSchema = z.enum(knowledgeScopes);
const knowledgeOriginSchema = z.enum(knowledgeOrigins);
const knowledgeLayerSchema = z.enum(knowledgeLayers);
const knowledgeAccessModeSchema = z.enum(knowledgeAccessModes);
const knowledgeStatusSchema = z.enum(knowledgeRecordStatuses);
const knowledgeExportModeSchema = z.enum(knowledgeExportModes);

const collectionCreateSchema = z.object({
  ownerId: ownerIdSchema.optional(),
  chatId: idSchema,
  branchId: branchIdSchema,
  scope: knowledgeScopeSchema,
  name: z.string().min(1),
  kind: z.string().min(1).nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["active", "archived", "deleted"]).optional(),
  origin: knowledgeOriginSchema,
  layer: knowledgeLayerSchema,
  meta: z.unknown().optional(),
});

const collectionListQuerySchema = z.object({
  ownerId: ownerIdSchema.optional(),
  chatId: idSchema,
  branchId: branchIdSchema,
});

const collectionExportQuerySchema = z.object({
  ownerId: ownerIdSchema.optional(),
  chatId: idSchema,
  branchId: branchIdSchema,
  mode: knowledgeExportModeSchema,
});

const collectionImportSchema = z.object({
  ownerId: ownerIdSchema.optional(),
  chatId: idSchema,
  branchId: branchIdSchema,
  payload: z.unknown(),
});

const recordUpsertSchema = z.object({
  ownerId: ownerIdSchema.optional(),
  chatId: idSchema,
  branchId: branchIdSchema,
  collectionId: idSchema,
  recordType: z.string().min(1),
  key: z.string().min(1),
  title: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  summary: z.string().nullable().optional(),
  content: z.unknown(),
  accessMode: knowledgeAccessModeSchema,
  origin: knowledgeOriginSchema,
  layer: knowledgeLayerSchema,
  derivedFromRecordId: idSchema.nullable().optional(),
  sourceMessageId: idSchema.nullable().optional(),
  sourceOperationId: z.string().nullable().optional(),
  status: knowledgeStatusSchema.optional(),
  gatePolicy: z.unknown().nullable().optional(),
  meta: z.unknown().optional(),
});

const recordListQuerySchema = z.object({
  ownerId: ownerIdSchema.optional(),
  chatId: idSchema,
  branchId: branchIdSchema,
  collectionId: idSchema.optional(),
  includeArchived: z.coerce.boolean().optional(),
});

const searchSchema = z.object({
  ownerId: ownerIdSchema.optional(),
  chatId: idSchema,
  branchId: branchIdSchema,
  request: z.object({
    textQuery: z.string().optional(),
    keys: z.array(z.string()).optional(),
    titles: z.array(z.string()).optional(),
    aliases: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    recordTypes: z.array(z.string()).optional(),
    collectionIds: z.array(idSchema).optional(),
    includeHiddenCandidates: z.boolean().optional(),
    limit: z.number().int().min(1).max(200).optional(),
    minScore: z.number().finite().optional(),
    minimumShouldMatch: z.number().int().min(0).optional(),
    context: z
      .object({
        flags: z.record(z.string(), z.unknown()).optional(),
        counters: z.record(z.string(), z.number()).optional(),
        manualUnlock: z.boolean().optional(),
      })
      .optional(),
  }),
});

const linksCreateSchema = z.object({
  ownerId: ownerIdSchema.optional(),
  chatId: idSchema,
  branchId: branchIdSchema,
  items: z
    .array(
      z.object({
        fromRecordId: idSchema,
        relationType: z.string().min(1),
        toRecordId: idSchema,
        meta: z.unknown().optional(),
      })
    )
    .min(1)
    .max(500),
});

const linksListQuerySchema = z.object({
  ownerId: ownerIdSchema.optional(),
  chatId: idSchema,
  branchId: branchIdSchema,
});

const revealSchema = z.object({
  ownerId: ownerIdSchema.optional(),
  chatId: idSchema,
  branchId: branchIdSchema,
  request: z.object({
    recordIds: z.array(idSchema).optional(),
    recordKeys: z.array(z.string()).optional(),
    reason: z.string().optional(),
    revealedBy: z.enum(["system", "user", "llm", "import"]).optional(),
    context: z
      .object({
        flags: z.record(z.string(), z.unknown()).optional(),
        counters: z.record(z.string(), z.number()).optional(),
        manualUnlock: z.boolean().optional(),
      })
      .optional(),
  }),
});

router.get(
  "/chat-knowledge/collections",
  validate({ query: collectionListQuerySchema }),
  asyncHandler(async (req: Request) => {
    const query = collectionListQuerySchema.parse(req.query);
    return {
      data: await listKnowledgeCollections({
        ...query,
        branchId: query.branchId ?? null,
      }),
    };
  })
);

router.post(
  "/chat-knowledge/collections",
  validate({ body: collectionCreateSchema }),
  asyncHandler(async (req: Request) => {
    const body = collectionCreateSchema.parse(req.body);
    return {
      data: await createKnowledgeCollection({
        ...body,
        ownerId: getRequestOwnerId(req, body.ownerId),
        branchId: body.branchId ?? null,
      }),
    };
  })
);

router.get(
  "/chat-knowledge/collections/:id",
  validate({ params: z.object({ id: idSchema }) }),
  asyncHandler(async (req: Request) => {
    const collection = await getKnowledgeCollectionById(String(req.params.id));
    if (!collection) throw new HttpError(404, "Knowledge collection not found", "NOT_FOUND");
    return { data: collection };
  })
);

router.get(
  "/chat-knowledge/collections/:id/export",
  validate({
    params: z.object({ id: idSchema }),
    query: collectionExportQuerySchema,
  }),
  asyncHandler(async (req: Request) => {
    const query = collectionExportQuerySchema.parse(req.query);
    return {
      data: await exportKnowledgeCollection({
        ownerId: getRequestOwnerId(req, query.ownerId),
        chatId: query.chatId,
        branchId: query.branchId ?? null,
        collectionId: String(req.params.id),
        mode: query.mode,
      }),
    };
  })
);

router.post(
  "/chat-knowledge/collections/import",
  validate({ body: collectionImportSchema }),
  asyncHandler(async (req: Request) => {
    const body = collectionImportSchema.parse(req.body);
    return {
      data: await importKnowledgeCollection({
        ownerId: getRequestOwnerId(req, body.ownerId),
        chatId: body.chatId,
        branchId: body.branchId ?? null,
        payload: body.payload as KnowledgeCollectionExportPayload,
      }),
    };
  })
);

router.get(
  "/chat-knowledge/records",
  validate({ query: recordListQuerySchema }),
  asyncHandler(async (req: Request) => {
    const query = recordListQuerySchema.parse(req.query);
    return {
      data: await listKnowledgeRecords({
        ownerId: getRequestOwnerId(req, query.ownerId),
        chatId: query.chatId,
        branchId: query.branchId ?? null,
        collectionId: query.collectionId,
        includeArchived: query.includeArchived,
      }),
    };
  })
);

router.post(
  "/chat-knowledge/records",
  validate({ body: recordUpsertSchema }),
  asyncHandler(async (req: Request) => {
    const body = recordUpsertSchema.parse(req.body);
    return {
      data: await upsertKnowledgeRecord({
        ownerId: getRequestOwnerId(req, body.ownerId),
        chatId: body.chatId,
        branchId: body.branchId ?? null,
        collectionId: body.collectionId,
        recordType: body.recordType,
        key: body.key,
        title: body.title,
        aliases: body.aliases,
        tags: body.tags,
        summary: body.summary,
        content: body.content,
        accessMode: body.accessMode,
        origin: body.origin,
        layer: body.layer,
        derivedFromRecordId: body.derivedFromRecordId,
        sourceMessageId: body.sourceMessageId,
        sourceOperationId: body.sourceOperationId,
        status: body.status,
        gatePolicy: body.gatePolicy as KnowledgeGatePolicy | null | undefined,
        meta: body.meta,
      }),
    };
  })
);

router.get(
  "/chat-knowledge/records/:id",
  validate({ params: z.object({ id: idSchema }) }),
  asyncHandler(async (req: Request) => {
    const record = await getKnowledgeRecordById(String(req.params.id));
    if (!record) throw new HttpError(404, "Knowledge record not found", "NOT_FOUND");
    return { data: record };
  })
);

router.post(
  "/chat-knowledge/records/search",
  validate({ body: searchSchema }),
  asyncHandler(async (req: Request) => {
    const body = searchSchema.parse(req.body);
    return {
      data: await searchKnowledgeRecords({
        ownerId: getRequestOwnerId(req, body.ownerId),
        chatId: body.chatId,
        branchId: body.branchId ?? null,
        request: body.request,
      }),
    };
  })
);

router.get(
  "/chat-knowledge/links",
  validate({ query: linksListQuerySchema }),
  asyncHandler(async (req: Request) => {
    const query = linksListQuerySchema.parse(req.query);
    return {
      data: await listKnowledgeRecordLinks({
        ownerId: getRequestOwnerId(req, query.ownerId),
        chatId: query.chatId,
        branchId: query.branchId ?? null,
      }),
    };
  })
);

router.post(
  "/chat-knowledge/links",
  validate({ body: linksCreateSchema }),
  asyncHandler(async (req: Request) => {
    const body = linksCreateSchema.parse(req.body);
    return {
      data: await createKnowledgeRecordLinksBulk({
        ownerId: getRequestOwnerId(req, body.ownerId),
        chatId: body.chatId,
        branchId: body.branchId ?? null,
        items: body.items,
      }),
    };
  })
);

router.post(
  "/chat-knowledge/reveal",
  validate({ body: revealSchema }),
  asyncHandler(async (req: Request) => {
    const body = revealSchema.parse(req.body);
    return {
      data: await revealKnowledgeRecords({
        ownerId: getRequestOwnerId(req, body.ownerId),
        chatId: body.chatId,
        branchId: body.branchId ?? null,
        request: body.request,
      }),
    };
  })
);

export default router;
