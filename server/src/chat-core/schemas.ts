import { z } from "zod";

// ---- Common helpers

export const idSchema = z.string().min(1);

export const ownerIdSchema = z.string().min(1).default("global");

export const jsonValueSchema: z.ZodType<unknown> = z.unknown();
export const jsonRecordSchema = z.record(z.string(), z.unknown());

export const messageRoleSchema = z.enum(["user", "assistant", "system"]);

export const messageVariantKindSchema = z.enum([
  "generation",
  "manual_edit",
  "import",
]);

export const chatStatusSchema = z.enum(["active", "archived", "deleted"]);

// ---- Blocks (v1: keep as JSON)

export const messageBlockSchema = z.object({
  id: z.string().min(1).optional(),
  type: z.string().min(1),
  format: z.string().min(1).optional(),
  content: z.unknown(),
  visibility: z.enum(["ui_only", "prompt_only", "both"]).optional(),
  order: z.number().optional(),
});

export const blocksSchema = z.array(messageBlockSchema).default([]);

// ---- EntityProfiles

export const createEntityProfileBodySchema = z.object({
  ownerId: ownerIdSchema.optional(),
  name: z.string().min(1),
  kind: z.literal("CharSpec").optional().default("CharSpec"),
  spec: jsonValueSchema,
  meta: jsonValueSchema.optional(),
  isFavorite: z.boolean().optional(),
  avatarAssetId: z.string().min(1).optional(),
});

export const updateEntityProfileBodySchema = z.object({
  id: idSchema,
  name: z.string().min(1).optional(),
  // v1 is fixed, but allow explicit value for idempotency
  kind: z.literal("CharSpec").optional(),
  spec: jsonValueSchema.optional(),
  meta: jsonValueSchema.optional(),
  isFavorite: z.boolean().optional(),
  avatarAssetId: z.string().min(1).nullable().optional(),
});

// ---- Chats

export const createChatForEntityProfileParamsSchema = z.object({
  id: idSchema, // entityProfileId
});

export const createChatBodySchema = z.object({
  ownerId: ownerIdSchema.optional(),
  title: z.string().min(1).default("New chat"),
  meta: jsonValueSchema.optional(),
});

export const chatIdParamsSchema = z.object({
  id: idSchema, // chatId
});

export const branchIdParamsSchema = z.object({
  id: idSchema, // chatId
  branchId: idSchema,
});

// ---- Branches

export const createBranchBodySchema = z.object({
  ownerId: ownerIdSchema.optional(),
  title: z.string().min(1).optional(),
  parentBranchId: idSchema.optional(),
  meta: jsonValueSchema.optional(),
});

// ---- Messages

export const listMessagesQuerySchema = z.object({
  branchId: idSchema.optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  before: z.coerce.number().int().positive().optional(), // createdAt (ms) cursor
});

export const createMessageBodySchema = z.object({
  ownerId: ownerIdSchema.optional(),
  branchId: idSchema.optional(),
  role: messageRoleSchema,
  promptText: z.string().default(""),
  format: z.string().min(1).optional(),
  blocks: blocksSchema.optional(),
  meta: jsonValueSchema.optional(),
});

// ---- Instructions

export const listInstructionsQuerySchema = z.object({
  ownerId: ownerIdSchema.optional(),
});

const stBasePromptRoleSchema = z.enum(["system", "user", "assistant"]);

const stBasePromptSchema = z.object({
  identifier: z.string().min(1),
  name: z.string().min(1).optional(),
  role: stBasePromptRoleSchema.optional(),
  content: z.string().optional(),
  system_prompt: z.boolean().optional(),
  marker: z.boolean().optional(),
  injection_position: z.union([z.literal(0), z.literal(1)]).optional(),
  injection_depth: z.number().int().min(0).optional(),
  injection_order: z.number().int().min(0).optional(),
}).strict();

const stBasePromptOrderEntrySchema = z.object({
  identifier: z.string().min(1),
  enabled: z.boolean(),
}).strict();

const stBasePromptOrderSchema = z.object({
  character_id: z.number().int(),
  order: z.array(stBasePromptOrderEntrySchema),
}).strict();

const stBaseResponseConfigSchema = z.object({
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  top_k: z.number().optional(),
  top_a: z.number().optional(),
  min_p: z.number().optional(),
  repetition_penalty: z.number().optional(),
  frequency_penalty: z.number().optional(),
  presence_penalty: z.number().optional(),
  openai_max_tokens: z.number().int().positive().optional(),
  seed: z.number().optional(),
  n: z.number().int().positive().optional(),
  reasoning_effort: z.string().min(1).optional(),
  verbosity: z.string().min(1).optional(),
  enable_web_search: z.boolean().optional(),
  stream_openai: z.boolean().optional(),
}).strict();

export const stBaseConfigSchema = z.object({
  rawPreset: jsonRecordSchema,
  prompts: z.array(stBasePromptSchema),
  promptOrder: z.array(stBasePromptOrderSchema),
  responseConfig: stBaseResponseConfigSchema,
  importInfo: z.object({
    source: z.literal("sillytavern"),
    fileName: z.string().min(1),
    importedAt: z.string().min(1),
  }).strict(),
}).strict();

const createBasicInstructionBodySchema = z.object({
  ownerId: ownerIdSchema.optional(),
  name: z.string().min(1),
  kind: z.literal("basic"),
  engine: z.literal("liquidjs").optional().default("liquidjs"),
  templateText: z.string().min(1),
  meta: jsonRecordSchema.optional(),
}).strict();

const createStBaseInstructionBodySchema = z.object({
  ownerId: ownerIdSchema.optional(),
  name: z.string().min(1),
  kind: z.literal("st_base"),
  engine: z.literal("liquidjs").optional().default("liquidjs"),
  stBase: stBaseConfigSchema,
  meta: jsonRecordSchema.optional(),
}).strict();

export const createInstructionBodySchema = z.discriminatedUnion("kind", [
  createBasicInstructionBodySchema,
  createStBaseInstructionBodySchema,
]);

const updateBasicInstructionBodySchema = z.object({
  kind: z.literal("basic"),
  name: z.string().min(1).optional(),
  engine: z.literal("liquidjs").optional(),
  templateText: z.string().min(1).optional(),
  meta: jsonRecordSchema.optional(),
}).strict();

const updateStBaseInstructionBodySchema = z.object({
  kind: z.literal("st_base"),
  name: z.string().min(1).optional(),
  engine: z.literal("liquidjs").optional(),
  stBase: stBaseConfigSchema.optional(),
  meta: jsonRecordSchema.optional(),
}).strict();

export const updateInstructionBodySchema = z.discriminatedUnion("kind", [
  updateBasicInstructionBodySchema,
  updateStBaseInstructionBodySchema,
]);

// ---- Variants (minimal for v1 endpoints later)

export const messageIdParamsSchema = z.object({
  id: idSchema, // messageId
});

export const selectVariantParamsSchema = z.object({
  id: idSchema, // messageId
  variantId: idSchema,
});

// ---- Manual edit variant (v1)

export const createManualEditVariantBodySchema = z.object({
  ownerId: ownerIdSchema.optional(),
  promptText: z.string().default(""),
  blocks: blocksSchema.optional(),
  meta: jsonValueSchema.optional(),
});

// ---- User persons (global, v1)

export const userPersonTypeSchema = z.literal("default");

export const createUserPersonBodySchema = z.object({
  ownerId: ownerIdSchema.optional(),
  id: idSchema.optional(),
  name: z.string().min(1),
  prefix: z.string().optional(),
  avatarUrl: z.string().optional(),
  type: userPersonTypeSchema.optional().default("default"),
  contentTypeDefault: z.string().optional(),
  contentTypeExtended: jsonValueSchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const updateUserPersonBodySchema = z.object({
  name: z.string().min(1).optional(),
  prefix: z.string().optional(),
  avatarUrl: z.string().optional(),
  type: userPersonTypeSchema.optional(),
  contentTypeDefault: z.string().optional(),
  contentTypeExtended: jsonValueSchema.optional(),
  updatedAt: z.string().optional(),
});

export const updateUserPersonsSettingsBodySchema = z.object({
  ownerId: ownerIdSchema.optional(),
  selectedId: idSchema.nullable(),
  enabled: z.boolean(),
  pageSize: z.number().int().min(1).max(200).optional(),
  sortType: z.string().nullable().optional(),
});
