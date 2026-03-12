import { HttpError } from "@core/middleware/error-handler";

import { renderLiquidTemplate } from "../../services/chat-core/prompt-template-renderer";
import { getUiProjection } from "../../services/chat-entry-parts/projection";
import { normalizePromptDiagnosticsDebugJson } from "../../services/chat-generation-v3/prompt/generation-debug-payload";

import type { GenerationWithDebugDto } from "../../services/chat-core/generations-repository";
import type { InstructionRenderContext } from "../../services/chat-core/prompt-template-renderer";
import type {
  Entry,
  Part,
  PartChannel,
  PartPayloadFormat,
  PartVisibility,
  Variant,
} from "@shared/types/chat-entry-parts";

export type UserPersonaSnapshot = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export type UserEntryMeta = {
  requestId: string | null;
  personaSnapshot?: UserPersonaSnapshot;
  templateRender?: {
    engine: "liquidjs";
    rawContent: string;
    renderedContent: string;
    changed: boolean;
    renderedAt: string;
    source?: "entry_create" | "manual_edit";
  };
};

export type SelectedUserLike = {
  id: string;
  name: string;
  avatarUrl?: string;
} | null;

const TEMPLATE_MAX_PASSES = 3;
const PROMPT_USAGE_HISTORY_LIMIT = 50;

export type PromptDiagnosticsRole = "system" | "user" | "assistant";
type PromptUsageEstimator = "chars_div4";

export type EntryPromptUsage = {
  estimator: PromptUsageEstimator;
  included: boolean;
  approxTokens: number;
};

type PromptDiagnosticsSectionTokens = {
  systemInstruction: number;
  chatHistory: number;
  worldInfoBefore: number;
  worldInfoAfter: number;
  worldInfoDepth: number;
  worldInfoOutlets: number;
  worldInfoAN: number;
  worldInfoEM: number;
};

export type PromptDiagnosticsResponse = {
  generationId: string;
  entryId: string;
  variantId: string;
  startedAt: string;
  status: "streaming" | "done" | "aborted" | "error";
  estimator: "chars_div4";
  prompt: {
    messages: Array<{ role: PromptDiagnosticsRole; content: string }>;
    approxTokens: {
      total: number;
      byRole: { system: number; user: number; assistant: number };
      sections: PromptDiagnosticsSectionTokens;
    };
  };
  turnCanonicalizations: Array<{
    hook: "before_main_llm" | "after_main_llm";
    opId: string;
    userEntryId: string;
    userMainPartId: string;
    replacedPartId?: string;
    canonicalPartId?: string;
    beforeText: string;
    afterText: string;
    committedAt: string;
  }>;
};

export type LatestWorldInfoActivationsResponse = {
  generationId: string | null;
  startedAt: string | null;
  status: "streaming" | "done" | "aborted" | "error" | null;
  activatedCount: number;
  warnings: string[];
  entries: Array<{
    hash: string;
    bookId: string;
    bookName: string;
    uid: number;
    comment: string;
    content: string;
    matchedKeys: string[];
    reasons: string[];
  }>;
};

export type BatchUpdateEntryPartPayload = string | object | number | boolean | null;

export type BatchUpdateEntryPartPatch = {
  partId: string;
  deleted: boolean;
  visibility: {
    ui: "always" | "never";
    prompt: boolean;
  };
  payload: BatchUpdateEntryPartPayload;
};

export type BatchUpdateEntryPartsBody = {
  variantId: string;
  mainPartId: string;
  orderedPartIds: string[];
  parts: BatchUpdateEntryPartPatch[];
};

type PlannedBatchPartState = {
  partId: string;
  channel: PartChannel;
  order: number;
  payload: BatchUpdateEntryPartPayload;
  payloadFormat: PartPayloadFormat;
  schemaId?: string;
  label?: string;
  visibility: PartVisibility;
  replacesPartId: string | null;
  deleted: boolean;
};

type BatchUpdatePartPlan = {
  mainPartId: string;
  updatedPartIds: string[];
  deletedPartIds: string[];
  patches: Array<{
    partId: string;
    channel: PartChannel;
    order: number;
    payload: BatchUpdateEntryPartPayload;
    payloadFormat: PartPayloadFormat;
    schemaId?: string;
    label?: string;
    visibility: PartVisibility;
    replacesPartId: string | null;
    softDeleted: boolean;
    softDeletedAt: number | null;
    softDeletedBy: "user" | "agent" | null;
  }>;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function approxTokensByChars(chars: number): number {
  if (!Number.isFinite(chars)) return 0;
  const normalized = Math.max(0, Math.floor(chars));
  if (normalized === 0) return 0;
  return Math.ceil(normalized / 4);
}

function approxTokensByText(text: string): number {
  return approxTokensByChars(String(text ?? "").length);
}

export function buildPromptApproxTokensByEntryId(
  projectedMessages: Array<{ entryId: string; content: string }>
): Map<string, number> {
  const out = new Map<string, number>();
  for (const item of projectedMessages) {
    out.set(item.entryId, approxTokensByText(item.content));
  }
  return out;
}

export function buildEntryPromptUsage(params: {
  entryId: string;
  approxTokensByEntryId: ReadonlyMap<string, number>;
}): EntryPromptUsage {
  const approxTokens = params.approxTokensByEntryId.get(params.entryId);
  const normalizedApproxTokens =
    typeof approxTokens === "number" && Number.isFinite(approxTokens)
      ? Math.max(0, Math.floor(approxTokens))
      : 0;
  const included = normalizedApproxTokens > 0;

  return {
    estimator: "chars_div4",
    included,
    approxTokens: normalizedApproxTokens,
  };
}

function normalizePromptRole(value: unknown): PromptDiagnosticsRole | null {
  return value === "system" || value === "user" || value === "assistant" ? value : null;
}

function normalizePromptMessages(
  value: unknown
): Array<{ role: PromptDiagnosticsRole; content: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const role = normalizePromptRole(item.role);
      if (!role) return null;
      return {
        role,
        content: typeof item.content === "string" ? item.content : "",
      };
    })
    .filter((item): item is { role: PromptDiagnosticsRole; content: string } => Boolean(item));
}

function normalizeTurnCanonicalizationHistory(
  value: unknown
): PromptDiagnosticsResponse["turnCanonicalizations"] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const hook =
        item.hook === "before_main_llm" || item.hook === "after_main_llm" ? item.hook : null;
      const opId = typeof item.opId === "string" ? item.opId : null;
      const userEntryId = typeof item.userEntryId === "string" ? item.userEntryId : null;
      const userMainPartId = typeof item.userMainPartId === "string" ? item.userMainPartId : null;
      const beforeText = typeof item.beforeText === "string" ? item.beforeText : null;
      const afterText = typeof item.afterText === "string" ? item.afterText : null;
      const committedAt = typeof item.committedAt === "string" ? item.committedAt : null;
      if (!hook || !opId || !userEntryId || !userMainPartId || beforeText === null || afterText === null || !committedAt) {
        return null;
      }
      return {
        hook,
        opId,
        userEntryId,
        userMainPartId,
        ...(typeof item.replacedPartId === "string" ? { replacedPartId: item.replacedPartId } : {}),
        ...(typeof item.canonicalPartId === "string" ? { canonicalPartId: item.canonicalPartId } : {}),
        beforeText,
        afterText,
        committedAt,
      };
    })
    .filter(
      (
        item
      ): item is PromptDiagnosticsResponse["turnCanonicalizations"][number] => Boolean(item)
    );
}

function sumRoleTokens(
  messages: Array<{ role: PromptDiagnosticsRole; content: string }>,
  role: PromptDiagnosticsRole
): number {
  return messages
    .filter((message) => message.role === role)
    .reduce((sum, message) => sum + approxTokensByText(message.content), 0);
}

export function buildPromptDiagnosticsFromDebug(params: {
  generation: GenerationWithDebugDto;
  entryId: string;
  variantId: string;
}): PromptDiagnosticsResponse | null {
  const debug = normalizePromptDiagnosticsDebugJson(params.generation.debug);
  if (!debug || !isRecord(debug.prompt)) return null;

  const messages = normalizePromptMessages(debug.prompt.messages);
  if (messages.length === 0) return null;

  const approxTokensRaw = isRecord(debug.prompt.approxTokens)
    ? debug.prompt.approxTokens
    : ({} as Record<string, unknown>);
  const byRoleRaw = isRecord(approxTokensRaw.byRole)
    ? approxTokensRaw.byRole
    : ({} as Record<string, unknown>);
  const sectionsRaw = isRecord(approxTokensRaw.sections)
    ? approxTokensRaw.sections
    : ({} as Record<string, unknown>);
  const turnCanonicalizations = normalizeTurnCanonicalizationHistory(
    debug.operations?.turnUserCanonicalization
  );

  return {
    generationId: params.generation.id,
    entryId: params.entryId,
    variantId: params.variantId,
    startedAt: params.generation.startedAt.toISOString(),
    status: params.generation.status,
    estimator: "chars_div4",
    prompt: {
      messages,
      approxTokens: {
        total:
          typeof approxTokensRaw.total === "number"
            ? Math.max(0, Math.floor(approxTokensRaw.total))
            : messages.reduce((sum, message) => sum + approxTokensByText(message.content), 0),
        byRole: {
          system:
            typeof byRoleRaw.system === "number"
              ? Math.max(0, Math.floor(byRoleRaw.system))
              : sumRoleTokens(messages, "system"),
          user:
            typeof byRoleRaw.user === "number"
              ? Math.max(0, Math.floor(byRoleRaw.user))
              : sumRoleTokens(messages, "user"),
          assistant:
            typeof byRoleRaw.assistant === "number"
              ? Math.max(0, Math.floor(byRoleRaw.assistant))
              : sumRoleTokens(messages, "assistant"),
        },
        sections: {
          systemInstruction:
            typeof sectionsRaw.systemInstruction === "number"
              ? Math.max(0, Math.floor(sectionsRaw.systemInstruction))
              : 0,
          chatHistory:
            typeof sectionsRaw.chatHistory === "number"
              ? Math.max(0, Math.floor(sectionsRaw.chatHistory))
              : 0,
          worldInfoBefore:
            typeof sectionsRaw.worldInfoBefore === "number"
              ? Math.max(0, Math.floor(sectionsRaw.worldInfoBefore))
              : 0,
          worldInfoAfter:
            typeof sectionsRaw.worldInfoAfter === "number"
              ? Math.max(0, Math.floor(sectionsRaw.worldInfoAfter))
              : 0,
          worldInfoDepth:
            typeof sectionsRaw.worldInfoDepth === "number"
              ? Math.max(0, Math.floor(sectionsRaw.worldInfoDepth))
              : 0,
          worldInfoOutlets:
            typeof sectionsRaw.worldInfoOutlets === "number"
              ? Math.max(0, Math.floor(sectionsRaw.worldInfoOutlets))
              : 0,
          worldInfoAN:
            typeof sectionsRaw.worldInfoAN === "number"
              ? Math.max(0, Math.floor(sectionsRaw.worldInfoAN))
              : 0,
          worldInfoEM:
            typeof sectionsRaw.worldInfoEM === "number"
              ? Math.max(0, Math.floor(sectionsRaw.worldInfoEM))
              : 0,
        },
      },
    },
    turnCanonicalizations,
  };
}

export function buildPromptDiagnosticsFromSnapshot(params: {
  generation: GenerationWithDebugDto;
  entryId: string;
  variantId: string;
}): PromptDiagnosticsResponse | null {
  const snapshot = isRecord(params.generation.promptSnapshot)
    ? params.generation.promptSnapshot
    : null;
  if (!snapshot) return null;

  const messages = normalizePromptMessages(snapshot.messages);
  if (messages.length === 0) return null;

  const meta = isRecord(snapshot.meta) ? snapshot.meta : {};
  const worldInfo = isRecord(meta.worldInfo) ? meta.worldInfo : {};
  const beforeChars =
    typeof worldInfo.beforeChars === "number" ? Math.max(0, Math.floor(worldInfo.beforeChars)) : 0;
  const afterChars =
    typeof worldInfo.afterChars === "number" ? Math.max(0, Math.floor(worldInfo.afterChars)) : 0;

  return {
    generationId: params.generation.id,
    entryId: params.entryId,
    variantId: params.variantId,
    startedAt: params.generation.startedAt.toISOString(),
    status: params.generation.status,
    estimator: "chars_div4",
    prompt: {
      messages,
      approxTokens: {
        total: messages.reduce((sum, message) => sum + approxTokensByText(message.content), 0),
        byRole: {
          system: sumRoleTokens(messages, "system"),
          user: sumRoleTokens(messages, "user"),
          assistant: sumRoleTokens(messages, "assistant"),
        },
        sections: {
          systemInstruction: sumRoleTokens(messages, "system"),
          chatHistory:
            messages
              .filter((message) => message.role !== "system")
              .reduce((sum, message) => sum + approxTokensByText(message.content), 0) -
            approxTokensByChars(afterChars),
          worldInfoBefore: approxTokensByChars(beforeChars),
          worldInfoAfter: approxTokensByChars(afterChars),
          worldInfoDepth: 0,
          worldInfoOutlets: 0,
          worldInfoAN: 0,
          worldInfoEM: 0,
        },
      },
    },
    turnCanonicalizations: [],
  };
}

export function emptyLatestWorldInfoActivationsResponse(): LatestWorldInfoActivationsResponse {
  return {
    generationId: null,
    startedAt: null,
    status: null,
    activatedCount: 0,
    warnings: [],
    entries: [],
  };
}

export function buildLatestWorldInfoActivationsFromGeneration(
  generation: GenerationWithDebugDto
): LatestWorldInfoActivationsResponse | null {
  const debug = normalizePromptDiagnosticsDebugJson(generation.debug);
  const worldInfo = debug && isRecord(debug.worldInfo) ? debug.worldInfo : null;
  if (!worldInfo) return null;

  const entries = Array.isArray(worldInfo.entries)
    ? worldInfo.entries
        .map((entry) => {
          if (!isRecord(entry)) return null;
          const hash = typeof entry.hash === "string" ? entry.hash : null;
          const bookId = typeof entry.bookId === "string" ? entry.bookId : null;
          const bookName = typeof entry.bookName === "string" ? entry.bookName : "";
          const uid = typeof entry.uid === "number" ? Math.floor(entry.uid) : 0;
          const comment = typeof entry.comment === "string" ? entry.comment : "";
          const content = typeof entry.content === "string" ? entry.content : "";
          if (!hash || !bookId) return null;
          return {
            hash,
            bookId,
            bookName,
            uid,
            comment,
            content,
            matchedKeys: asStringArray(entry.matchedKeys),
            reasons: asStringArray(entry.reasons),
          };
        })
        .filter(
          (
            entry
          ): entry is LatestWorldInfoActivationsResponse["entries"][number] => Boolean(entry)
        )
    : [];

  const activatedCountRaw =
    typeof worldInfo.activatedCount === "number" ? Math.floor(worldInfo.activatedCount) : entries.length;

  return {
    generationId: generation.id,
    startedAt: generation.startedAt.toISOString(),
    status: generation.status,
    activatedCount: Math.max(0, activatedCountRaw),
    warnings: asStringArray(worldInfo.warnings),
    entries,
  };
}

export function buildUserEntryMeta(params: {
  requestId?: string;
  selectedUser: SelectedUserLike;
  templateRender?: UserEntryMeta["templateRender"];
}): UserEntryMeta {
  const meta: UserEntryMeta = {
    requestId: params.requestId ?? null,
  };

  if (params.templateRender) {
    meta.templateRender = params.templateRender;
  }

  if (!params.selectedUser) return meta;

  meta.personaSnapshot = {
    id: params.selectedUser.id,
    name: params.selectedUser.name,
    avatarUrl: params.selectedUser.avatarUrl,
  };

  return meta;
}

export function mergeEntryPromptVisibilityMeta(params: {
  existingMeta: unknown;
  includeInPrompt: boolean;
}): Record<string, unknown> | null {
  const existing = isRecord(params.existingMeta) ? { ...params.existingMeta } : {};

  if (!params.includeInPrompt) {
    existing.excludedFromPrompt = true;
    return existing;
  }

  delete existing.excludedFromPrompt;
  return Object.keys(existing).length > 0 ? existing : null;
}

export async function renderUserInputWithLiquid(params: {
  content: string;
  context: InstructionRenderContext;
  options?: {
    allowEmptyResult?: boolean;
  };
}): Promise<{ renderedContent: string; changed: boolean }> {
  let renderedContent = "";
  try {
    renderedContent = String(
      await renderLiquidTemplate({
        templateText: params.content,
        context: params.context,
        options: {
          strictVariables: false,
          maxPasses: TEMPLATE_MAX_PASSES,
        },
      })
    );
  } catch (error) {
    throw new HttpError(
      400,
      `User input template render error: ${error instanceof Error ? error.message : String(error)}`,
      "VALIDATION_ERROR"
    );
  }

  if (!params.options?.allowEmptyResult && renderedContent.trim().length === 0) {
    throw new HttpError(
      400,
      "User input became empty after Liquid rendering",
      "VALIDATION_ERROR"
    );
  }

  return {
    renderedContent,
    changed: renderedContent !== params.content,
  };
}

export function sortPartsStable(a: Part, b: Part): number {
  if (a.order !== b.order) return a.order - b.order;
  if (a.partId < b.partId) return -1;
  if (a.partId > b.partId) return 1;
  return 0;
}

export function isEditablePart(part: Part): boolean {
  return (
    !part.softDeleted &&
    typeof part.payload === "string" &&
    (part.payloadFormat === "text" || part.payloadFormat === "markdown")
  );
}

export function isEditableMainPart(part: Part): boolean {
  if (part.channel !== "main") return false;
  return isEditablePart(part);
}

export function resolveManualEditTargetPart(params: {
  entry: Entry;
  activeVariant: Variant;
  currentTurn: number;
  requestedPartId?: string;
}): Part {
  const sourceParts = (params.activeVariant.parts ?? [])
    .filter((part) => !part.softDeleted)
    .sort(sortPartsStable);

  if (sourceParts.length === 0) {
    throw new HttpError(400, "В активном варианте нет частей для редактирования", "VALIDATION_ERROR");
  }

  let targetPartId: string | null = null;
  if (params.requestedPartId) {
    const target = sourceParts.find((part) => part.partId === params.requestedPartId) ?? null;
    if (!target || !isEditablePart(target)) {
      throw new HttpError(
        400,
        "partId не найден или не поддерживает редактирование",
        "VALIDATION_ERROR"
      );
    }
    targetPartId = target.partId;
  } else {
    const visible = getUiProjection(params.entry, params.activeVariant, params.currentTurn, {
      debugEnabled: false,
    });
    const editableMainVisible = visible.filter(isEditableMainPart);
    const editableVisible = visible.filter(isEditablePart);
    const fallbackMain =
      editableMainVisible.length > 0 ? editableMainVisible[editableMainVisible.length - 1] : null;
    const fallback =
      fallbackMain ?? (editableVisible.length > 0 ? editableVisible[editableVisible.length - 1] : null);
    if (!fallback) {
      throw new HttpError(400, "Не найден editable part для редактирования", "VALIDATION_ERROR");
    }
    targetPartId = fallback.partId;
  }

  const targetPart = sourceParts.find((part) => part.partId === targetPartId) ?? null;
  if (!targetPart) {
    throw new HttpError(400, "partId не найден в активном варианте", "VALIDATION_ERROR");
  }

  return targetPart;
}

export function resolveContinueUserTurnTarget(params: {
  lastEntry: Entry | null;
  lastVariant: Variant | null;
  currentTurn?: number;
}): { userEntryId: string; userMainPartId: string } {
  if (!params.lastEntry || params.lastEntry.role !== "user") {
    throw new HttpError(
      409,
      "Продолжение доступно только когда последнее сообщение в ветке от пользователя",
      "CONTINUE_NOT_AVAILABLE"
    );
  }

  const variant = params.lastVariant;
  if (!variant) {
    throw new HttpError(
      409,
      "У последнего сообщения пользователя нет активного варианта",
      "CONTINUE_NOT_AVAILABLE"
    );
  }

  const currentTurn =
    typeof params.currentTurn === "number" && Number.isFinite(params.currentTurn)
      ? Math.max(0, Math.floor(params.currentTurn))
      : 0;
  const visible = getUiProjection(params.lastEntry, variant, currentTurn, { debugEnabled: false });
  const editableMainParts = visible.filter(isEditableMainPart).sort(sortPartsStable);
  const userMainPart =
    editableMainParts.length > 0
      ? editableMainParts[editableMainParts.length - 1]
      : null;

  if (!userMainPart) {
    throw new HttpError(
      409,
      "У последнего сообщения пользователя нет редактируемой основной части",
      "CONTINUE_NOT_AVAILABLE"
    );
  }

  return {
    userEntryId: params.lastEntry.entryId,
    userMainPartId: userMainPart.partId,
  };
}

export function pickPreviousUserEntries(params: {
  entries: Entry[];
  anchorEntryId: string;
}): Entry[] {
  const anchorIndex = params.entries.findIndex((entry) => entry.entryId === params.anchorEntryId);
  const startIdx = anchorIndex >= 0 ? anchorIndex - 1 : params.entries.length - 1;
  const result: Entry[] = [];

  for (let i = startIdx; i >= 0; i -= 1) {
    const entry = params.entries[i];
    if (!entry || entry.softDeleted) continue;
    if (entry.role !== "user") continue;
    result.push(entry);
  }

  return result;
}

function normalizeReplacesPartId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function assertUniquePartIds(ids: string[], label: string): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      throw new HttpError(400, `Duplicate ${label} item`, "VALIDATION_ERROR", {
        partId: id,
      });
    }
    seen.add(id);
  }
}

function normalizePayloadByFormat(params: {
  payloadFormat: PartPayloadFormat;
  payload: unknown;
  partId: string;
}): BatchUpdateEntryPartPayload {
  if (params.payloadFormat === "text" || params.payloadFormat === "markdown") {
    if (typeof params.payload !== "string") {
      throw new HttpError(400, "Text/markdown part payload must be a string", "VALIDATION_ERROR", {
        partId: params.partId,
      });
    }
    return params.payload;
  }

  if (params.payloadFormat === "json") {
    if (
      params.payload === null ||
      typeof params.payload === "string" ||
      typeof params.payload === "number" ||
      typeof params.payload === "boolean" ||
      typeof params.payload === "object"
    ) {
      return params.payload as BatchUpdateEntryPartPayload;
    }
  }

  throw new HttpError(400, "Unsupported payload type for part format", "VALIDATION_ERROR", {
    partId: params.partId,
    payloadFormat: params.payloadFormat,
  });
}

function isPartDependentOnTarget(params: {
  partId: string;
  targetPartId: string;
  byId: Map<string, PlannedBatchPartState>;
}): boolean {
  const visited = new Set<string>();
  let cursor = params.byId.get(params.partId)?.replacesPartId ?? null;
  while (cursor) {
    if (cursor === params.targetPartId) return true;
    if (visited.has(cursor)) break;
    visited.add(cursor);
    cursor = params.byId.get(cursor)?.replacesPartId ?? null;
  }
  return false;
}

function isStringMainPayloadFormat(format: PartPayloadFormat): boolean {
  return format === "text" || format === "markdown";
}

export function assertBatchUpdateVariantIsActive(params: {
  entry: Entry;
  requestedVariantId: string;
}): void {
  if (params.entry.activeVariantId === params.requestedVariantId) return;
  throw new HttpError(409, "Variant mismatch: active variant has changed", "CONFLICT", {
    activeVariantId: params.entry.activeVariantId,
    requestedVariantId: params.requestedVariantId,
  });
}

export function buildBatchUpdatePartPlan(params: {
  variantParts: Part[];
  body: BatchUpdateEntryPartsBody;
  nowMs?: number;
}): BatchUpdatePartPlan {
  const activeParts = (params.variantParts ?? []).filter((part) => !part.softDeleted);
  if (activeParts.length === 0) {
    throw new HttpError(400, "No active parts in variant", "VALIDATION_ERROR");
  }

  const activeById = new Map(activeParts.map((part) => [part.partId, part] as const));
  const requestedPartIds = params.body.parts.map((item) => item.partId);
  assertUniquePartIds(requestedPartIds, "parts");

  for (const partId of requestedPartIds) {
    if (!activeById.has(partId)) {
      throw new HttpError(404, "Part не найден", "NOT_FOUND", { partId });
    }
  }
  if (requestedPartIds.length !== activeParts.length) {
    throw new HttpError(400, "Request must include all active variant parts", "VALIDATION_ERROR");
  }

  const requestPatchById = new Map(params.body.parts.map((item) => [item.partId, item] as const));
  const plannedById = new Map<string, PlannedBatchPartState>();

  for (const activePart of activeParts) {
    const patch = requestPatchById.get(activePart.partId);
    if (!patch) {
      throw new HttpError(400, "Missing part in batch update request", "VALIDATION_ERROR", {
        partId: activePart.partId,
      });
    }

    plannedById.set(activePart.partId, {
      partId: activePart.partId,
      channel: activePart.channel,
      order: activePart.order,
      payload: normalizePayloadByFormat({
        payloadFormat: activePart.payloadFormat,
        payload: patch.payload,
        partId: activePart.partId,
      }),
      payloadFormat: activePart.payloadFormat,
      schemaId: activePart.schemaId,
      label: activePart.label,
      visibility: {
        ui: patch.visibility.ui,
        prompt: patch.visibility.prompt,
      },
      replacesPartId: normalizeReplacesPartId(activePart.replacesPartId),
      deleted: patch.deleted,
    });
  }

  const nonDeletedPartIds = Array.from(plannedById.values())
    .filter((part) => !part.deleted)
    .map((part) => part.partId);
  if (nonDeletedPartIds.length === 0) {
    throw new HttpError(400, "At least one part must remain active", "VALIDATION_ERROR");
  }

  const mainPart = plannedById.get(params.body.mainPartId);
  if (!mainPart || mainPart.deleted) {
    throw new HttpError(400, "mainPartId must reference an active part", "VALIDATION_ERROR", {
      mainPartId: params.body.mainPartId,
    });
  }
  if (!isStringMainPayloadFormat(mainPart.payloadFormat) || typeof mainPart.payload !== "string") {
    throw new HttpError(400, "Main part must be text/markdown with string payload", "VALIDATION_ERROR", {
      mainPartId: params.body.mainPartId,
    });
  }

  assertUniquePartIds(params.body.orderedPartIds, "orderedPartIds");
  const orderedSet = new Set(params.body.orderedPartIds);
  const nonDeletedSet = new Set(nonDeletedPartIds);
  if (orderedSet.size !== nonDeletedSet.size) {
    throw new HttpError(
      400,
      "orderedPartIds must match the set of non-deleted parts",
      "VALIDATION_ERROR"
    );
  }
  for (const partId of orderedSet) {
    if (!nonDeletedSet.has(partId)) {
      throw new HttpError(
        400,
        "orderedPartIds must match the set of non-deleted parts",
        "VALIDATION_ERROR",
        { partId }
      );
    }
  }

  mainPart.channel = "main";
  mainPart.replacesPartId = null;

  for (const plannedPart of plannedById.values()) {
    if (plannedPart.deleted) continue;
    if (plannedPart.partId === params.body.mainPartId) continue;
    if (plannedPart.channel === "main") plannedPart.channel = "aux";
  }

  for (const plannedPart of plannedById.values()) {
    if (plannedPart.deleted) continue;
    if (plannedPart.partId === params.body.mainPartId) continue;
    if (
      isPartDependentOnTarget({
        partId: plannedPart.partId,
        targetPartId: params.body.mainPartId,
        byId: plannedById,
      })
    ) {
      plannedPart.replacesPartId = null;
    }
  }

  mainPart.order = 0;
  let nextOrder = 10;
  for (const partId of params.body.orderedPartIds) {
    if (partId === params.body.mainPartId) continue;
    const plannedPart = plannedById.get(partId);
    if (!plannedPart || plannedPart.deleted) continue;
    plannedPart.order = nextOrder;
    nextOrder += 10;
  }

  const nowMs =
    typeof params.nowMs === "number" && Number.isFinite(params.nowMs)
      ? Math.max(0, Math.floor(params.nowMs))
      : Date.now();

  const patches = Array.from(plannedById.values()).map((plannedPart) => ({
    partId: plannedPart.partId,
    channel: plannedPart.channel,
    order: plannedPart.order,
    payload: plannedPart.payload,
    payloadFormat: plannedPart.payloadFormat,
    schemaId: plannedPart.schemaId,
    label: plannedPart.label,
    visibility: plannedPart.visibility,
    replacesPartId: plannedPart.replacesPartId,
    softDeleted: plannedPart.deleted,
    softDeletedAt: plannedPart.deleted ? nowMs : null,
    softDeletedBy: plannedPart.deleted ? ("user" as const) : null,
  }));

  const deletedPartIds = patches.filter((item) => item.softDeleted).map((item) => item.partId);

  return {
    mainPartId: params.body.mainPartId,
    updatedPartIds: patches.map((item) => item.partId),
    deletedPartIds,
    patches,
  };
}

export function isCanonicalizationPart(part: Part): boolean {
  if (part.channel !== "main") return false;
  if (part.source !== "agent") return false;
  if (typeof part.replacesPartId !== "string" || part.replacesPartId.trim().length === 0) {
    return false;
  }
  return Array.isArray(part.tags) && part.tags.includes("canonicalization");
}

export function resolveActiveUndoCascade(params: {
  startPartId: string;
  parts: Part[];
}): string[] {
  const activeByOriginal = new Map<string, Part[]>();
  for (const part of params.parts) {
    if (part.softDeleted) continue;
    const originalId = typeof part.replacesPartId === "string" ? part.replacesPartId.trim() : "";
    if (!originalId) continue;
    const list = activeByOriginal.get(originalId);
    if (list) list.push(part);
    else activeByOriginal.set(originalId, [part]);
  }

  const queue = [params.startPartId];
  const visited = new Set<string>();
  const out: string[] = [];
  while (queue.length > 0) {
    const partId = queue.shift();
    if (!partId || visited.has(partId)) continue;
    visited.add(partId);
    out.push(partId);
    for (const child of activeByOriginal.get(partId) ?? []) {
      queue.push(child.partId);
    }
  }

  return out;
}

export function resolveRestoredPartId(params: {
  startReplacesPartId: string | undefined;
  parts: Part[];
  undonePartIds: string[];
}): string | null {
  const byId = new Map(params.parts.map((part) => [part.partId, part] as const));
  const undoneSet = new Set(params.undonePartIds);

  let cursor =
    typeof params.startReplacesPartId === "string" && params.startReplacesPartId.trim().length > 0
      ? params.startReplacesPartId
      : null;
  while (cursor) {
    const part = byId.get(cursor);
    if (!part) return cursor;
    if (!part.softDeleted && !undoneSet.has(cursor)) return cursor;
    cursor =
      typeof part.replacesPartId === "string" && part.replacesPartId.trim().length > 0
        ? part.replacesPartId
        : null;
  }
  return null;
}

export { PROMPT_USAGE_HISTORY_LIMIT };
