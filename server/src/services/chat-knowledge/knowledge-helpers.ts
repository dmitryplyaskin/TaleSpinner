import { safeJsonParse, safeJsonStringify } from "../../chat-core/json";

import type {
  knowledgeCollections,
  knowledgeRecordAccessState,
  knowledgeRecordLinks,
  knowledgeRecords,
} from "../../db/schema";
import type {
  KnowledgeAccessMode,
  KnowledgeCollectionDto,
  KnowledgeGatePolicy,
  KnowledgeLayer,
  KnowledgeOrigin,
  KnowledgeRecordAccessStateDto,
  KnowledgeRecordDto,
  KnowledgeRecordLinkDto,
} from "@shared/types/chat-knowledge";

function normalizeStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return Array.from(
    new Set(
      input
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item) => item.length > 0)
    )
  );
}

function flattenContent(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "number" || typeof value === "boolean") return [String(value)];
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap((item) => flattenContent(item));
  return Object.values(value as Record<string, unknown>).flatMap((item) => flattenContent(item));
}

export function buildKnowledgeSearchText(params: {
  title: string;
  aliases: string[];
  tags: string[];
  summary?: string | null;
  content: unknown;
  accessMode: KnowledgeAccessMode;
}): string {
  const base = [params.title, ...params.aliases, ...params.tags, params.summary ?? ""];
  const contentText =
    params.accessMode === "public" ? flattenContent(params.content) : [];
  return [...base, ...contentText]
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .join(" ");
}

export function rowToKnowledgeCollectionDto(
  row: typeof knowledgeCollections.$inferSelect
): KnowledgeCollectionDto {
  return {
    id: row.id,
    ownerId: row.ownerId,
    chatId: row.chatId,
    branchId: row.branchId ?? null,
    scope: row.scope,
    name: row.name,
    kind: row.kind ?? null,
    description: row.description ?? null,
    status: row.status,
    origin: row.origin,
    layer: row.layer,
    meta: safeJsonParse(row.metaJson, null),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function rowToKnowledgeRecordDto(
  row: typeof knowledgeRecords.$inferSelect
): KnowledgeRecordDto {
  return {
    id: row.id,
    ownerId: row.ownerId,
    chatId: row.chatId,
    branchId: row.branchId ?? null,
    collectionId: row.collectionId,
    recordType: row.recordType,
    key: row.key,
    title: row.title,
    aliases: normalizeStringArray(safeJsonParse(row.aliasesJson, [])),
    tags: normalizeStringArray(safeJsonParse(row.tagsJson, [])),
    summary: row.summary ?? null,
    content: safeJsonParse(row.contentJson, null),
    searchText: row.searchText,
    accessMode: row.accessMode,
    origin: row.origin as KnowledgeOrigin,
    layer: row.layer as KnowledgeLayer,
    derivedFromRecordId: row.derivedFromRecordId ?? null,
    sourceMessageId: row.sourceMessageId ?? null,
    sourceOperationId: row.sourceOperationId ?? null,
    status: row.status,
    gatePolicy: safeJsonParse<KnowledgeGatePolicy | null>(row.gatePolicyJson, null),
    meta: safeJsonParse(row.metaJson, null),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function rowToKnowledgeRecordLinkDto(
  row: typeof knowledgeRecordLinks.$inferSelect
): KnowledgeRecordLinkDto {
  return {
    id: row.id,
    ownerId: row.ownerId,
    chatId: row.chatId,
    branchId: row.branchId ?? null,
    fromRecordId: row.fromRecordId,
    relationType: row.relationType,
    toRecordId: row.toRecordId,
    meta: safeJsonParse(row.metaJson, null),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function rowToKnowledgeRecordAccessStateDto(
  row: typeof knowledgeRecordAccessState.$inferSelect
): KnowledgeRecordAccessStateDto {
  return {
    id: row.id,
    ownerId: row.ownerId,
    chatId: row.chatId,
    branchId: row.branchId ?? null,
    recordId: row.recordId,
    discoverState: row.discoverState,
    readState: row.readState,
    promptState: row.promptState,
    revealState: row.revealState,
    revealedAt: row.revealedAt ?? null,
    revealedBy: row.revealedBy ?? null,
    revealReason: row.revealReason ?? null,
    flags: safeJsonParse<Record<string, unknown>>(row.flagsJson, {}),
    updatedAt: row.updatedAt,
  };
}

export function encodeJson(value: unknown, fallback: string): string {
  return safeJsonStringify(value, fallback);
}
