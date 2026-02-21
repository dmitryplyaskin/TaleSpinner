import express, { type Request, type Response } from "express";
import { z } from "zod";

import { asyncHandler } from "@core/middleware/async-handler";
import { HttpError } from "@core/middleware/error-handler";
import { validate } from "@core/middleware/validate";
import { initSse, type SseWriter } from "@core/sse/sse";

import { chatIdParamsSchema } from "../chat-core/schemas";
import { getChatById } from "../services/chat-core/chats-repository";
import { abortGeneration } from "../services/chat-core/generation-runtime";
import {
  getGenerationByIdWithDebug,
  getLatestGenerationByChatBranchWithDebug,
} from "../services/chat-core/generations-repository";
import { rerenderGreetingTemplatesIfPreplay } from "../services/chat-core/greeting-template-rerender";
import {
  buildInstructionRenderContext,
  resolveAndApplyWorldInfoToTemplateContext,
} from "../services/chat-core/prompt-template-context";
import { renderLiquidTemplate } from "../services/chat-core/prompt-template-renderer";
import { getSelectedUserPerson } from "../services/chat-core/user-persons-repository";
import { getBranchCurrentTurn, incrementBranchTurn } from "../services/chat-entry-parts/branch-turn-repository";
import {
  createEntryWithVariant,
  getActiveVariantWithParts,
  getEntryById,
  listEntries,
  listEntriesWithActiveVariantsPage,
  softDeleteEntry,
  softDeleteEntries,
  updateEntryMeta,
} from "../services/chat-entry-parts/entries-repository";
import {
  applyPartMutableBatchPatches,
  applyManualEditToPart,
  createPart,
  getPartWithVariantContextById,
  softDeletePart,
} from "../services/chat-entry-parts/parts-repository";
import { getUiProjection } from "../services/chat-entry-parts/projection";
import {
  createVariant,
  deleteVariant,
  getVariantById,
  listEntryVariants,
  selectActiveVariant,
  updateVariantDerived,
} from "../services/chat-entry-parts/variants-repository";
import { runChatGenerationV3 } from "../services/chat-generation-v3/run-chat-generation-v3";
import { normalizeOperationActivationConfig } from "../services/chat-generation-v3/operations/operation-activation-intervals";
import { loadOrBootstrapRuntimeState } from "../services/chat-generation-v3/runtime/operation-runtime-state";
import { resolveCompiledOperationProfile } from "../services/operations/operation-profile-resolver";
import { getOperationProfileSettings } from "../services/operations/operation-profile-settings-repository";
import { getOperationProfileById } from "../services/operations/operation-profiles-repository";

import type { InstructionRenderContext } from "../services/chat-core/prompt-template-renderer";
import type { RunEvent } from "../services/chat-generation-v3/contracts";
import type { ChatOperationRuntimeStateDto } from "@shared/types/chat-runtime-state";
import type {
  Entry,
  Part,
  PartChannel,
  PartPayloadFormat,
  PartVisibility,
  Variant,
} from "@shared/types/chat-entry-parts";

const router = express.Router();

type UserPersonaSnapshot = {
  id: string;
  name: string;
  avatarUrl?: string;
};

type UserEntryMeta = {
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

type SelectedUserLike = {
  id: string;
  name: string;
  avatarUrl?: string;
} | null;

const TEMPLATE_MAX_PASSES = 3;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function isActivationReached(params: {
  everyNTurns?: number;
  everyNContextTokens?: number;
  turnsCounter: number;
  tokensCounter: number;
}): boolean {
  const turnsReached =
    typeof params.everyNTurns === "number" && params.turnsCounter >= params.everyNTurns;
  const tokensReached =
    typeof params.everyNContextTokens === "number" &&
    params.tokensCounter >= params.everyNContextTokens;
  return turnsReached || tokensReached;
}

type PromptDiagnosticsRole = "system" | "user" | "assistant";

type PromptDiagnosticsResponse = {
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
      sections: {
        systemInstruction: number;
        chatHistory: number;
        worldInfoBefore: number;
        worldInfoAfter: number;
        worldInfoDepth: number;
        worldInfoOutlets: number;
        worldInfoAN: number;
        worldInfoEM: number;
      };
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

type LatestWorldInfoActivationsResponse = {
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

function approxTokensByChars(chars: number): number {
  if (!Number.isFinite(chars)) return 0;
  const normalized = Math.max(0, Math.floor(chars));
  if (normalized === 0) return 0;
  return Math.ceil(normalized / 4);
}

function approxTokensByText(text: string): number {
  return approxTokensByChars(String(text ?? "").length);
}

function normalizePromptRole(value: unknown): PromptDiagnosticsRole | null {
  if (value === "system" || value === "user" || value === "assistant") return value;
  return null;
}

function normalizePromptMessages(
  value: unknown
): Array<{ role: PromptDiagnosticsRole; content: string }> {
  if (!Array.isArray(value)) return [];
  const out: Array<{ role: PromptDiagnosticsRole; content: string }> = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const role = normalizePromptRole(item.role);
    if (!role) continue;
    if (typeof item.content !== "string") continue;
    out.push({ role, content: item.content });
  }
  return out;
}

function normalizeTurnCanonicalizationHistory(
  value: unknown
): PromptDiagnosticsResponse["turnCanonicalizations"] {
  if (!Array.isArray(value)) return [];
  const out: PromptDiagnosticsResponse["turnCanonicalizations"] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const hook =
      item.hook === "before_main_llm" || item.hook === "after_main_llm"
        ? item.hook
        : null;
    if (!hook) continue;
    if (typeof item.opId !== "string") continue;
    if (typeof item.userEntryId !== "string") continue;
    if (typeof item.userMainPartId !== "string") continue;
    const replacedPartId =
      typeof item.replacedPartId === "string" && item.replacedPartId.length > 0
        ? item.replacedPartId
        : undefined;
    const canonicalPartId =
      typeof item.canonicalPartId === "string" && item.canonicalPartId.length > 0
        ? item.canonicalPartId
        : undefined;
    if (typeof item.beforeText !== "string") continue;
    if (typeof item.afterText !== "string") continue;
    if (typeof item.committedAt !== "string") continue;
    out.push({
      hook,
      opId: item.opId,
      userEntryId: item.userEntryId,
      userMainPartId: item.userMainPartId,
      replacedPartId,
      canonicalPartId,
      beforeText: item.beforeText,
      afterText: item.afterText,
      committedAt: item.committedAt,
    });
  }
  return out;
}

function computeApproxByRole(messages: Array<{ role: PromptDiagnosticsRole; content: string }>): {
  total: number;
  byRole: { system: number; user: number; assistant: number };
} {
  const byRole = { system: 0, user: 0, assistant: 0 };
  for (const message of messages) {
    byRole[message.role] += approxTokensByText(message.content);
  }
  return {
    total: byRole.system + byRole.user + byRole.assistant,
    byRole,
  };
}

export function buildPromptDiagnosticsFromDebug(params: {
  generation: Awaited<ReturnType<typeof getGenerationByIdWithDebug>>;
  entryId: string;
  variantId: string;
}): PromptDiagnosticsResponse | null {
  const generation = params.generation;
  if (!generation || !isRecord(generation.debug)) return null;
  const debug = generation.debug;
  if (!isRecord(debug.prompt)) return null;
  const prompt = debug.prompt;
  const messages = normalizePromptMessages(prompt.messages);
  const approx = computeApproxByRole(messages);
  const operations = isRecord(debug.operations) ? debug.operations : {};
  const turnCanonicalizations = normalizeTurnCanonicalizationHistory(
    operations.turnUserCanonicalization
  );

  const approxTokensRaw = isRecord(prompt.approxTokens) ? prompt.approxTokens : {};
  const byRoleRaw = isRecord(approxTokensRaw.byRole) ? approxTokensRaw.byRole : {};
  const sectionsRaw = isRecord(approxTokensRaw.sections) ? approxTokensRaw.sections : {};

  const byRole = {
    system:
      typeof byRoleRaw.system === "number"
        ? Math.max(0, Math.floor(byRoleRaw.system))
        : approx.byRole.system,
    user:
      typeof byRoleRaw.user === "number"
        ? Math.max(0, Math.floor(byRoleRaw.user))
        : approx.byRole.user,
    assistant:
      typeof byRoleRaw.assistant === "number"
        ? Math.max(0, Math.floor(byRoleRaw.assistant))
        : approx.byRole.assistant,
  };
  const total =
    typeof approxTokensRaw.total === "number"
      ? Math.max(0, Math.floor(approxTokensRaw.total))
      : byRole.system + byRole.user + byRole.assistant;

  const sections = {
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
  };

  return {
    generationId: generation.id,
    entryId: params.entryId,
    variantId: params.variantId,
    startedAt: generation.startedAt.toISOString(),
    status: generation.status,
    estimator: "chars_div4",
    prompt: {
      messages,
      approxTokens: {
        total,
        byRole,
        sections,
      },
    },
    turnCanonicalizations,
  };
}

export function buildPromptDiagnosticsFromSnapshot(params: {
  generation: Awaited<ReturnType<typeof getGenerationByIdWithDebug>>;
  entryId: string;
  variantId: string;
}): PromptDiagnosticsResponse | null {
  const generation = params.generation;
  if (!generation || !isRecord(generation.promptSnapshot)) return null;
  const snapshot = generation.promptSnapshot;
  const messages = normalizePromptMessages(snapshot.messages);
  if (messages.length === 0) return null;

  const approx = computeApproxByRole(messages);
  const firstSystemMessage = messages.find((message) => message.role === "system");
  const systemInstruction = firstSystemMessage
    ? approxTokensByText(firstSystemMessage.content)
    : 0;
  const chatHistory = Math.max(0, approx.total - systemInstruction);

  const worldInfoMeta =
    isRecord(snapshot.meta) && isRecord(snapshot.meta.worldInfo)
      ? snapshot.meta.worldInfo
      : null;
  const worldInfoBeforeChars =
    worldInfoMeta && typeof worldInfoMeta.beforeChars === "number"
      ? worldInfoMeta.beforeChars
      : 0;
  const worldInfoAfterChars =
    worldInfoMeta && typeof worldInfoMeta.afterChars === "number"
      ? worldInfoMeta.afterChars
      : 0;

  return {
    generationId: generation.id,
    entryId: params.entryId,
    variantId: params.variantId,
    startedAt: generation.startedAt.toISOString(),
    status: generation.status,
    estimator: "chars_div4",
    prompt: {
      messages,
      approxTokens: {
        total: approx.total,
        byRole: approx.byRole,
        sections: {
          systemInstruction,
          chatHistory,
          worldInfoBefore: approxTokensByChars(worldInfoBeforeChars),
          worldInfoAfter: approxTokensByChars(worldInfoAfterChars),
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
  generation: Awaited<ReturnType<typeof getLatestGenerationByChatBranchWithDebug>>
): LatestWorldInfoActivationsResponse | null {
  if (!generation || !isRecord(generation.debug)) return null;
  const debug = generation.debug;
  if (!isRecord(debug.worldInfo)) return null;
  const worldInfo = debug.worldInfo;
  const entriesRaw = Array.isArray(worldInfo.entries) ? worldInfo.entries : [];

  const entries: LatestWorldInfoActivationsResponse["entries"] = entriesRaw
    .map((raw) => {
      if (!isRecord(raw)) return null;
      if (
        typeof raw.hash !== "string" ||
        typeof raw.bookId !== "string" ||
        typeof raw.bookName !== "string" ||
        typeof raw.uid !== "number" ||
        typeof raw.comment !== "string" ||
        typeof raw.content !== "string"
      ) {
        return null;
      }
      return {
        hash: raw.hash,
        bookId: raw.bookId,
        bookName: raw.bookName,
        uid: Math.floor(raw.uid),
        comment: raw.comment,
        content: raw.content,
        matchedKeys: asStringArray(raw.matchedKeys),
        reasons: asStringArray(raw.reasons),
      };
    })
    .filter((item): item is LatestWorldInfoActivationsResponse["entries"][number] => Boolean(item));

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

async function linkVariantToGeneration(params: {
  variantId: string;
  generationId: string;
}): Promise<void> {
  const variant = await getVariantById({ variantId: params.variantId });
  if (!variant) return;

  const derived = isRecord(variant.derived) ? { ...variant.derived } : {};
  derived.generationId = params.generationId;

  const generation = await getGenerationByIdWithDebug(params.generationId);
  if (generation?.promptHash) {
    derived.promptHash = generation.promptHash;
  }

  await updateVariantDerived({
    variantId: params.variantId,
    derived,
  });
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
  const nextMeta = isRecord(params.existingMeta) ? { ...params.existingMeta } : {};
  if (params.includeInPrompt) {
    delete nextMeta.excludedFromPrompt;
  } else {
    nextMeta.excludedFromPrompt = true;
  }
  return Object.keys(nextMeta).length > 0 ? nextMeta : null;
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

function ensureSseRequested(req: Request): void {
  const accept = String(req.headers.accept ?? "");
  if (!accept.includes("text/event-stream")) {
    throw new HttpError(406, "Нужен Accept: text/event-stream", "NOT_ACCEPTABLE");
  }
}

function mapRunStatusToStreamDoneStatus(status: "done" | "failed" | "aborted" | "error"): "done" | "aborted" | "error" {
  if (status === "done") return "done";
  if (status === "aborted") return "aborted";
  return "error";
}

type RunProxySummary = {
  runStatus: "done" | "failed" | "aborted" | "error" | null;
  sawTextDelta: boolean;
};

async function proxyRunEventsToSse(params: {
  sse: SseWriter;
  events: AsyncGenerator<RunEvent>;
  envBase: Record<string, unknown>;
  reqClosed: () => boolean;
  abortController: AbortController;
  onGenerationId: (generationId: string) => void;
}): Promise<RunProxySummary> {
  let generationId: string | null = null;
  const summary: RunProxySummary = {
    runStatus: null,
    sawTextDelta: false,
  };

  for await (const evt of params.events) {
    if (evt.type === "run.started") {
      generationId = evt.data.generationId;
      params.onGenerationId(generationId);
      if (params.reqClosed()) {
        params.abortController.abort();
        abortGeneration(generationId);
      }
      params.sse.send("llm.stream.meta", { ...params.envBase, generationId });
    }

    const eventGenerationId =
      generationId ?? (evt.type === "run.started" ? evt.data.generationId : null);
    const eventEnvelope = {
      ...params.envBase,
      generationId: eventGenerationId,
      runId: evt.runId,
      seq: evt.seq,
      ...evt.data,
    };
    params.sse.send(evt.type, eventEnvelope);

    if (evt.type === "main_llm.delta") {
      if (evt.data.content.length > 0) summary.sawTextDelta = true;
      params.sse.send("llm.stream.delta", {
        ...params.envBase,
        generationId: eventGenerationId,
        content: evt.data.content,
      });
      continue;
    }

    if (evt.type === "main_llm.reasoning_delta") {
      if (evt.data.content.length > 0) summary.sawTextDelta = true;
      params.sse.send("llm.stream.reasoning_delta", {
        ...params.envBase,
        generationId: eventGenerationId,
        content: evt.data.content,
      });
      continue;
    }

    if (evt.type === "main_llm.finished" && evt.data.status === "error") {
      params.sse.send("llm.stream.error", {
        ...params.envBase,
        generationId: eventGenerationId,
        code: "generation_error",
        message: evt.data.message ?? "generation_error",
      });
      continue;
    }

    if (evt.type === "run.finished") {
      summary.runStatus = evt.data.status;
      params.sse.send("llm.stream.done", {
        ...params.envBase,
        generationId: eventGenerationId,
        status: mapRunStatusToStreamDoneStatus(evt.data.status),
      });
      if (evt.data.status !== "done" && evt.data.message) {
        params.sse.send("llm.stream.error", {
          ...params.envBase,
          generationId: eventGenerationId,
          code: "generation_error",
          message: evt.data.message,
        });
      }
      break;
    }
  }

  return summary;
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
  const editableMainParts = visible
    .filter(isEditableMainPart)
    .sort(sortPartsStable);
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

async function resolveRegenerateUserTurnTarget(params: {
  chatId: string;
  branchId: string;
  assistantEntry: Entry;
  currentTurn: number;
}): Promise<{ mode: "entry_parts"; userEntryId: string; userMainPartId: string } | undefined> {
  const PAGE_LIMIT = 200;
  let before = params.assistantEntry.createdAt + 1;

  while (true) {
    const entries = await listEntries({
      chatId: params.chatId,
      branchId: params.branchId,
      limit: PAGE_LIMIT,
      before,
    });
    if (entries.length === 0) return undefined;

    const userCandidates = pickPreviousUserEntries({
      entries,
      anchorEntryId: params.assistantEntry.entryId,
    });
    for (const candidate of userCandidates) {
      const candidateVariant = await getActiveVariantWithParts({ entry: candidate });
      try {
        const target = resolveContinueUserTurnTarget({
          lastEntry: candidate,
          lastVariant: candidateVariant,
          currentTurn: params.currentTurn,
        });
        return {
          mode: "entry_parts",
          userEntryId: target.userEntryId,
          userMainPartId: target.userMainPartId,
        };
      } catch {
        // Try the next older user entry candidate.
      }
    }

    const oldestEntry = entries[0];
    if (!oldestEntry) return undefined;
    before = oldestEntry.createdAt;
  }
}

async function createAssistantReasoningPart(params: {
  ownerId: string;
  variantId: string;
  createdTurn: number;
  requestId?: string;
}): Promise<Part> {
  return createPart({
    ownerId: params.ownerId,
    variantId: params.variantId,
    channel: "reasoning",
    order: -1,
    payload: "",
    payloadFormat: "markdown",
    visibility: { ui: "always", prompt: false },
    ui: { rendererId: "markdown" },
    prompt: { serializerId: "asText" },
    lifespan: "infinite",
    createdTurn: params.createdTurn,
    source: "llm",
    requestId: params.requestId,
  });
}

function isVariantTextuallyEmpty(variant: Variant): boolean {
  const parts = (variant.parts ?? []).filter((part) => !part.softDeleted);
  if (parts.length === 0) return true;

  return parts.every((part) => {
    if (typeof part.payload !== "string") return false;
    return part.payload.trim().length === 0;
  });
}

async function cleanupEmptyGenerationVariants(entryId: string): Promise<void> {
  let variants = await listEntryVariants({ entryId });
  for (const variant of variants) {
    if (variants.length <= 1) break;
    if (variant.kind !== "generation") continue;
    if (!isVariantTextuallyEmpty(variant)) continue;
    try {
      await deleteVariant({ entryId, variantId: variant.variantId });
    } catch {
      // best-effort cleanup; ignore failures for this variant
    }
    variants = variants.filter((v) => v.variantId !== variant.variantId);
  }
}

const listEntriesQuerySchema = z
  .object({
    branchId: z.string().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional().default(50),
    before: z.coerce.number().int().positive().optional(), // backward-compatible createdAt cursor
    cursorCreatedAt: z.coerce.number().int().positive().optional(),
    cursorEntryId: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    const hasCreatedAt = typeof value.cursorCreatedAt === "number";
    const hasEntryId = typeof value.cursorEntryId === "string" && value.cursorEntryId.length > 0;
    if (hasCreatedAt !== hasEntryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "cursorCreatedAt и cursorEntryId должны передаваться вместе",
      });
    }
  });

router.get(
  "/chats/:id/entries",
  validate({ params: chatIdParamsSchema, query: listEntriesQuerySchema }),
  asyncHandler(async (req: Request) => {
    const params = req.params as unknown as { id: string };
    const query = listEntriesQuerySchema.parse(req.query);

    const chat = await getChatById(params.id);
    if (!chat) throw new HttpError(404, "Chat не найден", "NOT_FOUND");

    const branchId = query.branchId || chat.activeBranchId;
    if (!branchId) {
      throw new HttpError(400, "branchId обязателен (нет activeBranchId)", "VALIDATION_ERROR");
    }

    try {
      await rerenderGreetingTemplatesIfPreplay({
        ownerId: chat.ownerId,
        chatId: params.id,
        branchId,
        entityProfileId: chat.entityProfileId,
      });
    } catch {
      // best-effort rerender; never fail the entries listing
    }

    const page = await listEntriesWithActiveVariantsPage({
      chatId: params.id,
      branchId,
      limit: query.limit,
      before: query.before,
      cursorCreatedAt: query.cursorCreatedAt,
      cursorEntryId: query.cursorEntryId,
    });

    const currentTurn = await getBranchCurrentTurn({ branchId });
    return {
      data: {
        branchId,
        currentTurn,
        entries: page.entries,
        pageInfo: page.pageInfo,
      },
    };
  })
);

const createEntryBodySchema = z.object({
  ownerId: z.string().min(1).optional(),
  branchId: z.string().min(1).optional(),
  role: z.enum(["user", "system"]),
  content: z.string().default(""),
  settings: z.record(z.string(), z.unknown()).optional().default({}),
  requestId: z.string().min(1).optional(),
});

router.post(
  "/chats/:id/entries",
  validate({ params: chatIdParamsSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const params = req.params as unknown as { id: string };
    const chat = await getChatById(params.id);
    if (!chat) throw new HttpError(404, "Chat не найден", "NOT_FOUND");

    ensureSseRequested(req);

    const body = createEntryBodySchema.parse(req.body);
    const ownerId = body.ownerId ?? "global";
    const branchId = body.branchId || chat.activeBranchId;
    if (!branchId) throw new HttpError(400, "branchId обязателен (нет activeBranchId)", "VALIDATION_ERROR");

    const templateContext = await buildInstructionRenderContext({
      ownerId,
      chatId: params.id,
      branchId,
      entityProfileId: chat.entityProfileId,
      historyLimit: 50,
    });
    await resolveAndApplyWorldInfoToTemplateContext({
      context: templateContext,
      ownerId,
      chatId: params.id,
      branchId,
      entityProfileId: chat.entityProfileId,
      trigger: "generate",
      dryRun: true,
    });
    const { renderedContent, changed } = await renderUserInputWithLiquid({
      content: body.content ?? "",
      context: templateContext,
    });

    const sse = initSse({ res });

    let generationId: string | null = null;
    const runAbortController = new AbortController();
    let shouldAbortOnClose = false;
    let reqClosed = false;
    req.on("close", () => {
      reqClosed = true;
      if (shouldAbortOnClose) {
        runAbortController.abort();
        if (generationId) abortGeneration(generationId);
      }
      sse.close();
    });

    try {
      const currentTurn = await getBranchCurrentTurn({ branchId });
      const selectedUser = await getSelectedUserPerson({ ownerId });
      const userEntryMeta = buildUserEntryMeta({
        requestId: body.requestId,
        selectedUser,
        templateRender: {
          engine: "liquidjs",
          rawContent: body.content ?? "",
          renderedContent,
          changed,
          renderedAt: new Date().toISOString(),
          source: "entry_create",
        },
      });

      const user = await createEntryWithVariant({
        ownerId,
        chatId: params.id,
        branchId,
        role: body.role,
        variantKind: "manual_edit",
        meta: userEntryMeta,
      });

      const userMainPart = await createPart({
        ownerId,
        variantId: user.variant.variantId,
        channel: "main",
        order: 0,
        payload: renderedContent,
        payloadFormat: "markdown",
        visibility: { ui: "always", prompt: true },
        ui: { rendererId: "markdown" },
        prompt: { serializerId: "asText" },
        lifespan: "infinite",
        createdTurn: currentTurn,
        source: "user",
        requestId: body.requestId,
      });

      const newTurn = await incrementBranchTurn({ branchId });

      const assistant = await createEntryWithVariant({
        ownerId,
        chatId: params.id,
        branchId,
        role: "assistant",
        variantKind: "generation",
      });

      const assistantMainPart = await createPart({
        ownerId,
        variantId: assistant.variant.variantId,
        channel: "main",
        order: 0,
        payload: "",
        payloadFormat: "markdown",
        visibility: { ui: "always", prompt: true },
        ui: { rendererId: "markdown" },
        prompt: { serializerId: "asText" },
        lifespan: "infinite",
        createdTurn: newTurn,
        source: "llm",
      });
      const assistantReasoningPart = await createAssistantReasoningPart({
        ownerId,
        variantId: assistant.variant.variantId,
        createdTurn: newTurn,
        requestId: body.requestId,
      });

      shouldAbortOnClose = true;
      if (reqClosed) {
        runAbortController.abort();
        if (generationId) abortGeneration(generationId);
      }

      const envBase = {
        chatId: params.id,
        branchId,
        userEntryId: user.entry.entryId,
        userMainPartId: userMainPart.partId,
        userRenderedContent: renderedContent,
        assistantEntryId: assistant.entry.entryId,
        assistantVariantId: assistant.variant.variantId,
        assistantMainPartId: assistantMainPart.partId,
        assistantReasoningPartId: assistantReasoningPart.partId,
      };
      await proxyRunEventsToSse({
        sse,
        envBase,
        reqClosed: () => reqClosed,
        abortController: runAbortController,
        onGenerationId: (id) => {
          generationId = id;
        },
        events: runChatGenerationV3({
          ownerId,
          chatId: params.id,
          branchId,
          entityProfileId: chat.entityProfileId,
          trigger: "generate",
          source: body.role === "user" ? "user_message" : "system_message",
          settings: body.settings,
          abortController: runAbortController,
          persistenceTarget: {
            mode: "entry_parts",
            assistantEntryId: assistant.entry.entryId,
            assistantMainPartId: assistantMainPart.partId,
            assistantReasoningPartId: assistantReasoningPart.partId,
          },
          userTurnTarget: {
            mode: "entry_parts",
            userEntryId: user.entry.entryId,
            userMainPartId: userMainPart.partId,
          },
        }),
      });
      if (generationId) {
        await linkVariantToGeneration({
          variantId: assistant.variant.variantId,
          generationId,
        });
      }

    } finally {
      sse.close();
    }

    return;
  })
);

const continueEntryBodySchema = z.object({
  ownerId: z.string().min(1).optional(),
  branchId: z.string().min(1).optional(),
  settings: z.record(z.string(), z.unknown()).optional().default({}),
  requestId: z.string().min(1).optional(),
});

router.post(
  "/chats/:id/entries/continue",
  validate({ params: chatIdParamsSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const params = req.params as unknown as { id: string };
    const chat = await getChatById(params.id);
    if (!chat) throw new HttpError(404, "Chat не найден", "NOT_FOUND");
    ensureSseRequested(req);

    const body = continueEntryBodySchema.parse(req.body);
    const ownerId = body.ownerId ?? "global";
    const branchId = body.branchId || chat.activeBranchId;
    if (!branchId) throw new HttpError(400, "branchId обязателен (нет activeBranchId)", "VALIDATION_ERROR");

    const sse = initSse({ res });
    let generationId: string | null = null;
    const runAbortController = new AbortController();
    let shouldAbortOnClose = false;
    let reqClosed = false;
    req.on("close", () => {
      reqClosed = true;
      if (shouldAbortOnClose) {
        runAbortController.abort();
        if (generationId) abortGeneration(generationId);
      }
      sse.close();
    });

    try {
      const lastEntries = await listEntries({
        chatId: params.id,
        branchId,
        limit: 1,
      });
      const lastEntry = lastEntries.length > 0 ? lastEntries[lastEntries.length - 1] : null;
      const lastVariant = lastEntry ? await getActiveVariantWithParts({ entry: lastEntry }) : null;
      const currentTurn = await getBranchCurrentTurn({ branchId });
      const userTurnTarget = resolveContinueUserTurnTarget({
        lastEntry,
        lastVariant,
        currentTurn,
      });

      const newTurn = await incrementBranchTurn({ branchId });
      const assistant = await createEntryWithVariant({
        ownerId,
        chatId: params.id,
        branchId,
        role: "assistant",
        variantKind: "generation",
      });
      const assistantMainPart = await createPart({
        ownerId,
        variantId: assistant.variant.variantId,
        channel: "main",
        order: 0,
        payload: "",
        payloadFormat: "markdown",
        visibility: { ui: "always", prompt: true },
        ui: { rendererId: "markdown" },
        prompt: { serializerId: "asText" },
        lifespan: "infinite",
        createdTurn: newTurn,
        source: "llm",
        requestId: body.requestId,
      });
      const assistantReasoningPart = await createAssistantReasoningPart({
        ownerId,
        variantId: assistant.variant.variantId,
        createdTurn: newTurn,
        requestId: body.requestId,
      });

      shouldAbortOnClose = true;
      if (reqClosed) {
        runAbortController.abort();
        if (generationId) abortGeneration(generationId);
      }

      const envBase = {
        chatId: params.id,
        branchId,
        userEntryId: userTurnTarget.userEntryId,
        assistantEntryId: assistant.entry.entryId,
        assistantVariantId: assistant.variant.variantId,
        assistantMainPartId: assistantMainPart.partId,
        assistantReasoningPartId: assistantReasoningPart.partId,
      };

      await proxyRunEventsToSse({
        sse,
        envBase,
        reqClosed: () => reqClosed,
        abortController: runAbortController,
        onGenerationId: (id) => {
          generationId = id;
        },
        events: runChatGenerationV3({
          ownerId,
          chatId: params.id,
          branchId,
          entityProfileId: chat.entityProfileId,
          trigger: "generate",
          source: "continue",
          settings: body.settings,
          abortController: runAbortController,
          persistenceTarget: {
            mode: "entry_parts",
            assistantEntryId: assistant.entry.entryId,
            assistantMainPartId: assistantMainPart.partId,
            assistantReasoningPartId: assistantReasoningPart.partId,
          },
          userTurnTarget: {
            mode: "entry_parts",
            userEntryId: userTurnTarget.userEntryId,
            userMainPartId: userTurnTarget.userMainPartId,
          },
        }),
      });
      if (generationId) {
        await linkVariantToGeneration({
          variantId: assistant.variant.variantId,
          generationId,
        });
      }

    } finally {
      sse.close();
    }

    return;
  })
);

const entryIdParamsSchema = z.object({ id: z.string().min(1) });
const regenerateBodySchema = z.object({
  ownerId: z.string().min(1).optional(),
  settings: z.record(z.string(), z.unknown()).optional().default({}),
  requestId: z.string().min(1).optional(),
});

router.post(
  "/entries/:id/regenerate",
  validate({ params: entryIdParamsSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const params = req.params as unknown as { id: string };
    ensureSseRequested(req);

    const body = regenerateBodySchema.parse(req.body);
    const ownerId = body.ownerId ?? "global";

    const entry = await getEntryById({ entryId: params.id });
    if (!entry) throw new HttpError(404, "Entry не найден", "NOT_FOUND");
    if (entry.role !== "assistant") {
      throw new HttpError(400, "regenerate поддерживается только для role=assistant", "VALIDATION_ERROR");
    }

    const chat = await getChatById(entry.chatId);
    if (!chat) throw new HttpError(404, "Chat не найден", "NOT_FOUND");

    const sse = initSse({ res });

    let generationId: string | null = null;
    const runAbortController = new AbortController();
    let shouldAbortOnClose = false;
    let reqClosed = false;
    req.on("close", () => {
      reqClosed = true;
      if (shouldAbortOnClose) {
        runAbortController.abort();
        if (generationId) abortGeneration(generationId);
      }
      sse.close();
    });

    try {
      const currentTurn = await getBranchCurrentTurn({ branchId: entry.branchId });
      const userTurnTarget = await resolveRegenerateUserTurnTarget({
        chatId: entry.chatId,
        branchId: entry.branchId,
        assistantEntry: entry,
        currentTurn,
      });

      const newTurn = await incrementBranchTurn({ branchId: entry.branchId });

      const newVariant = await createVariant({
        ownerId,
        entryId: entry.entryId,
        kind: "generation",
      });
      await selectActiveVariant({ entryId: entry.entryId, variantId: newVariant.variantId });

      const assistantMainPart = await createPart({
        ownerId,
        variantId: newVariant.variantId,
        channel: "main",
        order: 0,
        payload: "",
        payloadFormat: "markdown",
        visibility: { ui: "always", prompt: true },
        ui: { rendererId: "markdown" },
        prompt: { serializerId: "asText" },
        lifespan: "infinite",
        createdTurn: newTurn,
        source: "llm",
      });
      const assistantReasoningPart = await createAssistantReasoningPart({
        ownerId,
        variantId: newVariant.variantId,
        createdTurn: newTurn,
        requestId: body.requestId,
      });

      shouldAbortOnClose = true;
      if (reqClosed) {
        runAbortController.abort();
        if (generationId) abortGeneration(generationId);
      }

      const envBase = {
        chatId: entry.chatId,
        branchId: entry.branchId,
        ...(userTurnTarget
          ? {
              userEntryId: userTurnTarget.userEntryId,
              userMainPartId: userTurnTarget.userMainPartId,
            }
          : {}),
        assistantEntryId: entry.entryId,
        assistantVariantId: newVariant.variantId,
        assistantMainPartId: assistantMainPart.partId,
        assistantReasoningPartId: assistantReasoningPart.partId,
      };
      await proxyRunEventsToSse({
        sse,
        envBase,
        reqClosed: () => reqClosed,
        abortController: runAbortController,
        onGenerationId: (id) => {
          generationId = id;
        },
        events: runChatGenerationV3({
          ownerId,
          chatId: entry.chatId,
          branchId: entry.branchId,
          entityProfileId: chat.entityProfileId,
          trigger: "regenerate",
          source: "regenerate",
          settings: body.settings,
          abortController: runAbortController,
          persistenceTarget: {
            mode: "entry_parts",
            assistantEntryId: entry.entryId,
            assistantMainPartId: assistantMainPart.partId,
            assistantReasoningPartId: assistantReasoningPart.partId,
          },
          userTurnTarget,
        }),
      });
      if (generationId) {
        await linkVariantToGeneration({
          variantId: newVariant.variantId,
          generationId,
        });
      }

      // Always run best-effort cleanup for empty generation variants.
      // This removes both the current aborted-empty variant and older empty leftovers.
      await cleanupEmptyGenerationVariants(entry.entryId);
    } finally {
      sse.close();
    }

    return;
  })
);

const promptDiagnosticsQuerySchema = z.object({
  variantId: z.string().min(1).optional(),
});

router.get(
  "/entries/:id/prompt-diagnostics",
  validate({ params: entryIdParamsSchema, query: promptDiagnosticsQuerySchema }),
  asyncHandler(async (req: Request) => {
    const params = req.params as unknown as { id: string };
    const query = promptDiagnosticsQuerySchema.parse(req.query);

    const entry = await getEntryById({ entryId: params.id });
    if (!entry) throw new HttpError(404, "Entry не найден", "NOT_FOUND");
    if (entry.role !== "assistant") {
      throw new HttpError(400, "Prompt diagnostics доступны только для assistant entry", "VALIDATION_ERROR");
    }

    const variantId = query.variantId ?? entry.activeVariantId;
    const variant = await getVariantById({ variantId });
    if (!variant || variant.entryId !== entry.entryId) {
      throw new HttpError(404, "Variant не найден", "NOT_FOUND");
    }

    const derived = isRecord(variant.derived) ? variant.derived : {};
    const generationId =
      typeof derived.generationId === "string" ? derived.generationId : null;
    if (!generationId) {
      throw new HttpError(404, "Prompt diagnostics не найдены для варианта", "NOT_FOUND");
    }

    const generation = await getGenerationByIdWithDebug(generationId);
    if (!generation) {
      throw new HttpError(404, "Generation не найдена", "NOT_FOUND");
    }

    const fromDebug = buildPromptDiagnosticsFromDebug({
      generation,
      entryId: entry.entryId,
      variantId: variant.variantId,
    });
    if (fromDebug) return { data: fromDebug };

    const fromSnapshot = buildPromptDiagnosticsFromSnapshot({
      generation,
      entryId: entry.entryId,
      variantId: variant.variantId,
    });
    if (fromSnapshot) return { data: fromSnapshot };

    throw new HttpError(404, "Prompt diagnostics недоступны", "NOT_FOUND");
  })
);

const latestWorldInfoActivationsQuerySchema = z.object({
  branchId: z.string().min(1).optional(),
});
const operationRuntimeStateQuerySchema = z.object({
  branchId: z.string().min(1).optional(),
});

router.get(
  "/chats/:id/operation-runtime-state",
  validate({ params: chatIdParamsSchema, query: operationRuntimeStateQuerySchema }),
  asyncHandler(async (req: Request) => {
    const params = req.params as unknown as { id: string };
    const query = operationRuntimeStateQuerySchema.parse(req.query);

    const chat = await getChatById(params.id);
    if (!chat) throw new HttpError(404, "Chat не найден", "NOT_FOUND");

    const branchId = query.branchId ?? chat.activeBranchId;
    if (!branchId) {
      throw new HttpError(400, "branchId обязателен (нет activeBranchId)", "VALIDATION_ERROR");
    }

    const empty: ChatOperationRuntimeStateDto = {
      chatId: chat.id,
      branchId,
      profileId: null,
      operationProfileSessionId: null,
      updatedAt: null,
      operations: [],
    };

    const settings = await getOperationProfileSettings();
    if (!settings.activeProfileId) return { data: empty };

    const profile = await getOperationProfileById(settings.activeProfileId);
    if (!profile || !profile.enabled) return { data: empty };

    const compiled = await resolveCompiledOperationProfile(profile);
    const runtime = await loadOrBootstrapRuntimeState({
      scope: {
        ownerId: chat.ownerId,
        chatId: chat.id,
        branchId,
        profileId: profile.profileId,
        operationProfileSessionId: profile.operationProfileSessionId,
      },
      operations: compiled.operations,
      source: "system_message",
    });

    const data: ChatOperationRuntimeStateDto = {
      chatId: chat.id,
      branchId,
      profileId: profile.profileId,
      operationProfileSessionId: profile.operationProfileSessionId,
      updatedAt: runtime.updatedAt.toISOString(),
      operations: compiled.operations.map((op) => {
        const normalized = normalizeOperationActivationConfig(op.config.activation);
        const state = runtime.payload.activationByOpId[op.opId] ?? {
          turnsCounter: 0,
          tokensCounter: 0,
        };
        return {
          opId: op.opId,
          everyNTurns: normalized?.everyNTurns,
          everyNContextTokens: normalized?.everyNContextTokens,
          turnsCounter: state.turnsCounter,
          tokensCounter: state.tokensCounter,
          isReachedNow: isActivationReached({
            everyNTurns: normalized?.everyNTurns,
            everyNContextTokens: normalized?.everyNContextTokens,
            turnsCounter: state.turnsCounter,
            tokensCounter: state.tokensCounter,
          }),
        };
      }),
    };

    return { data };
  })
);

router.get(
  "/chats/:id/world-info/latest-activations",
  validate({ params: chatIdParamsSchema, query: latestWorldInfoActivationsQuerySchema }),
  asyncHandler(async (req: Request) => {
    const params = req.params as unknown as { id: string };
    const query = latestWorldInfoActivationsQuerySchema.parse(req.query);

    const chat = await getChatById(params.id);
    if (!chat) throw new HttpError(404, "Chat не найден", "NOT_FOUND");

    const branchId = query.branchId ?? chat.activeBranchId;
    if (!branchId) {
      return { data: emptyLatestWorldInfoActivationsResponse() };
    }

    const generation = await getLatestGenerationByChatBranchWithDebug({
      chatId: chat.id,
      branchId,
    });
    const response = buildLatestWorldInfoActivationsFromGeneration(generation);
    return { data: response ?? emptyLatestWorldInfoActivationsResponse() };
  })
);

router.get(
  "/entries/:id/variants",
  validate({ params: entryIdParamsSchema }),
  asyncHandler(async (req: Request) => {
    const params = req.params as unknown as { id: string };
    const entry = await getEntryById({ entryId: params.id });
    if (!entry) throw new HttpError(404, "Entry не найден", "NOT_FOUND");
    const variants = await listEntryVariants({ entryId: entry.entryId });
    return { data: variants };
  })
);

const selectVariantParamsSchema = z.object({
  id: z.string().min(1), // entryId
  variantId: z.string().min(1),
});

router.post(
  "/entries/:id/variants/:variantId/select",
  validate({ params: selectVariantParamsSchema }),
  asyncHandler(async (req: Request) => {
    const params = req.params as unknown as { id: string; variantId: string };
    const entry = await getEntryById({ entryId: params.id });
    if (!entry) throw new HttpError(404, "Entry не найден", "NOT_FOUND");

    const variant = await getVariantById({ variantId: params.variantId });
    if (!variant || variant.entryId !== entry.entryId) {
      throw new HttpError(404, "Variant не найден", "NOT_FOUND");
    }

    await selectActiveVariant({ entryId: entry.entryId, variantId: params.variantId });

    return { data: { entryId: entry.entryId, activeVariantId: params.variantId } };
  })
);

const manualEditBodySchema = z.object({
  ownerId: z.string().min(1).optional(),
  partId: z.string().min(1).optional(),
  content: z.string(),
  requestId: z.string().min(1).optional(),
});

function sortPartsStable(a: Part, b: Part): number {
  if (a.order !== b.order) return a.order - b.order;
  if (a.partId < b.partId) return -1;
  if (a.partId > b.partId) return 1;
  return 0;
}

function isEditableMainPart(part: Part): boolean {
  if (part.channel !== "main") return false;
  return isEditablePart(part);
}

function isEditablePart(part: Part): boolean {
  return (
    !part.softDeleted &&
    typeof part.payload === "string" &&
    (part.payloadFormat === "text" || part.payloadFormat === "markdown")
  );
}

type BatchUpdateEntryPartPayload = string | object | number | boolean | null;

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

const batchUpdateEntryPartSchema = z.object({
  partId: z.string().min(1),
  deleted: z.boolean(),
  visibility: z.object({
    ui: z.enum(["always", "never"]),
    prompt: z.boolean(),
  }),
  payload: z.unknown(),
});

const batchUpdateEntryPartsBodySchema = z.object({
  variantId: z.string().min(1),
  mainPartId: z.string().min(1),
  orderedPartIds: z.array(z.string().min(1)).min(1),
  parts: z.array(batchUpdateEntryPartSchema).min(1),
});

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

    if (!activeById.has(patch.partId)) {
      throw new HttpError(404, "Part not found in active variant", "NOT_FOUND", {
        partId: patch.partId,
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

router.post(
  "/entries/:id/manual-edit",
  validate({ params: entryIdParamsSchema, body: manualEditBodySchema }),
  asyncHandler(async (req: Request) => {
    const params = req.params as unknown as { id: string };
    const body = manualEditBodySchema.parse(req.body);

    const entry = await getEntryById({ entryId: params.id });
    if (!entry) throw new HttpError(404, "Entry не найден", "NOT_FOUND");

    const activeVariant = await getActiveVariantWithParts({ entry });
    if (!activeVariant) {
      throw new HttpError(400, "Active variant не найден", "VALIDATION_ERROR");
    }

    const currentTurn = await getBranchCurrentTurn({ branchId: entry.branchId });
    const sourceParts = (activeVariant.parts ?? []).filter((p) => !p.softDeleted).sort(sortPartsStable);

    if (sourceParts.length === 0) {
      throw new HttpError(400, "В активном варианте нет частей для редактирования", "VALIDATION_ERROR");
    }

    let targetPartId: string | null = null;
    if (body.partId) {
      const target = sourceParts.find((p) => p.partId === body.partId) ?? null;
      if (!target || !isEditablePart(target)) {
        throw new HttpError(400, "partId не найден или не поддерживает редактирование", "VALIDATION_ERROR");
      }
      targetPartId = target.partId;
    } else {
      const visible = getUiProjection(entry, activeVariant, currentTurn, { debugEnabled: false });
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

    const targetPart = sourceParts.find((p) => p.partId === targetPartId) ?? null;
    if (!targetPart) {
      throw new HttpError(400, "partId не найден в активном варианте", "VALIDATION_ERROR");
    }

    const ownerId = body.ownerId ?? "global";
    const chat = await getChatById(entry.chatId);
    const templateContext = await buildInstructionRenderContext({
      ownerId,
      chatId: entry.chatId,
      branchId: entry.branchId,
      entityProfileId: chat?.entityProfileId ?? undefined,
      historyLimit: 50,
    });
    await resolveAndApplyWorldInfoToTemplateContext({
      context: templateContext,
      ownerId,
      chatId: entry.chatId,
      branchId: entry.branchId,
      entityProfileId: chat?.entityProfileId ?? undefined,
      trigger: "generate",
      dryRun: true,
    });
    const { renderedContent, changed } = await renderUserInputWithLiquid({
      content: body.content,
      context: templateContext,
      options: { allowEmptyResult: true },
    });

    await applyManualEditToPart({
      partId: targetPart.partId,
      payloadText: renderedContent,
      payloadFormat: targetPart.payloadFormat,
      requestId: body.requestId,
    });

    const nextMeta = {
      ...(isRecord(entry.meta) ? entry.meta : {}),
      templateRender: {
        engine: "liquidjs",
        rawContent: body.content,
        renderedContent,
        changed,
        renderedAt: new Date().toISOString(),
        source: "manual_edit",
      },
    };
    await updateEntryMeta({
      entryId: entry.entryId,
      meta: nextMeta,
    });

    return {
      data: {
        entryId: entry.entryId,
        activeVariantId: activeVariant.variantId,
      },
    };
  })
);

router.post(
  "/entries/:id/parts/batch-update",
  validate({ params: entryIdParamsSchema, body: batchUpdateEntryPartsBodySchema }),
  asyncHandler(async (req: Request) => {
    const params = req.params as unknown as { id: string };
    const body = batchUpdateEntryPartsBodySchema.parse(req.body) as BatchUpdateEntryPartsBody;

    const entry = await getEntryById({ entryId: params.id });
    if (!entry) throw new HttpError(404, "Entry не найден", "NOT_FOUND");

    assertBatchUpdateVariantIsActive({
      entry,
      requestedVariantId: body.variantId,
    });

    const activeVariant = await getActiveVariantWithParts({ entry });
    if (!activeVariant) {
      throw new HttpError(404, "Active variant не найден", "NOT_FOUND");
    }

    const plan = buildBatchUpdatePartPlan({
      variantParts: activeVariant.parts ?? [],
      body,
      nowMs: Date.now(),
    });

    await applyPartMutableBatchPatches({
      variantId: activeVariant.variantId,
      patches: plan.patches,
    });

    return {
      data: {
        entryId: entry.entryId,
        variantId: activeVariant.variantId,
        mainPartId: plan.mainPartId,
        updatedPartIds: plan.updatedPartIds,
        deletedPartIds: plan.deletedPartIds,
      },
    };
  })
);

router.post(
  "/entries/:id/variants/:variantId/soft-delete",
  validate({ params: selectVariantParamsSchema }),
  asyncHandler(async (req: Request) => {
    const params = req.params as unknown as { id: string; variantId: string };
    const entry = await getEntryById({ entryId: params.id });
    if (!entry) throw new HttpError(404, "Entry не найден", "NOT_FOUND");

    const variant = await getVariantById({ variantId: params.variantId });
    if (!variant || variant.entryId !== entry.entryId) {
      throw new HttpError(404, "Variant не найден", "NOT_FOUND");
    }

    const variants = await listEntryVariants({ entryId: entry.entryId });
    if (variants.length <= 1) {
      throw new HttpError(400, "Нельзя удалить последний вариант", "VALIDATION_ERROR");
    }

    const deleted = await deleteVariant({
      entryId: entry.entryId,
      variantId: params.variantId,
    });

    return { data: deleted };
  })
);

const softDeleteEntryBodySchema = z.object({
  by: z.enum(["user", "agent"]).optional().default("user"),
});

const softDeleteEntriesBulkBodySchema = z.object({
  entryIds: z.array(z.string().min(1)).min(1),
  by: z.enum(["user", "agent"]).optional().default("user"),
});

const entryPromptVisibilityBodySchema = z.object({
  includeInPrompt: z.boolean(),
});

router.post(
  "/entries/soft-delete-bulk",
  validate({ body: softDeleteEntriesBulkBodySchema }),
  asyncHandler(async (req: Request) => {
    const body = softDeleteEntriesBulkBodySchema.parse(req.body);
    const ids = await softDeleteEntries({
      entryIds: body.entryIds,
      by: body.by,
    });
    return { data: { ids } };
  })
);

router.post(
  "/entries/:id/soft-delete",
  validate({ params: entryIdParamsSchema, body: softDeleteEntryBodySchema }),
  asyncHandler(async (req: Request) => {
    const params = req.params as unknown as { id: string };
    const body = softDeleteEntryBodySchema.parse(req.body);
    const entry = await getEntryById({ entryId: params.id });
    if (!entry) throw new HttpError(404, "Entry не найден", "NOT_FOUND");

    await softDeleteEntry({ entryId: entry.entryId, by: body.by });
    return { data: { id: entry.entryId } };
  })
);

router.post(
  "/entries/:id/prompt-visibility",
  validate({ params: entryIdParamsSchema, body: entryPromptVisibilityBodySchema }),
  asyncHandler(async (req: Request) => {
    const params = req.params as unknown as { id: string };
    const body = entryPromptVisibilityBodySchema.parse(req.body);
    const entry = await getEntryById({ entryId: params.id });
    if (!entry) throw new HttpError(404, "Entry не найден", "NOT_FOUND");

    const nextMeta = mergeEntryPromptVisibilityMeta({
      existingMeta: entry.meta,
      includeInPrompt: body.includeInPrompt,
    });

    await updateEntryMeta({
      entryId: entry.entryId,
      meta: nextMeta,
    });

    return {
      data: {
        id: entry.entryId,
        includeInPrompt: body.includeInPrompt,
      },
    };
  })
);

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

const partIdParamsSchema = z.object({ id: z.string().min(1) });
const softDeletePartBodySchema = z.object({
  by: z.enum(["user", "agent"]).optional().default("user"),
});
const canonicalizationUndoBodySchema = z.object({
  by: z.enum(["user", "agent"]).optional().default("user"),
});

router.post(
  "/parts/:id/canonicalization-undo",
  validate({ params: partIdParamsSchema, body: canonicalizationUndoBodySchema }),
  asyncHandler(async (req: Request) => {
    const params = req.params as unknown as { id: string };
    const body = canonicalizationUndoBodySchema.parse(req.body);

    const context = await getPartWithVariantContextById({ partId: params.id });
    if (!context) throw new HttpError(404, "Part не найден", "NOT_FOUND");
    if (context.part.softDeleted) {
      throw new HttpError(400, "Part уже удалён", "VALIDATION_ERROR");
    }
    if (!isCanonicalizationPart(context.part)) {
      throw new HttpError(400, "Part не является canonicalization replacement", "VALIDATION_ERROR");
    }

    const variants = await listEntryVariants({ entryId: context.entryId });
    const variant = variants.find((item) => item.variantId === context.variantId) ?? null;
    if (!variant) {
      throw new HttpError(404, "Variant не найден", "NOT_FOUND");
    }

    const undonePartIds = resolveActiveUndoCascade({
      startPartId: context.part.partId,
      parts: variant.parts ?? [],
    });
    if (!undonePartIds.includes(context.part.partId)) {
      throw new HttpError(400, "Не удалось построить цепочку отката", "VALIDATION_ERROR");
    }

    for (const partId of undonePartIds) {
      await softDeletePart({ partId, by: body.by });
    }

    const restoredPartId = resolveRestoredPartId({
      startReplacesPartId: context.part.replacesPartId,
      parts: variant.parts ?? [],
      undonePartIds,
    });

    return {
      data: {
        undonePartIds,
        restoredPartId,
        entryId: context.entryId,
      },
    };
  })
);

router.post(
  "/parts/:id/soft-delete",
  validate({ params: partIdParamsSchema, body: softDeletePartBodySchema }),
  asyncHandler(async (req: Request) => {
    const params = req.params as unknown as { id: string };
    const body = softDeletePartBodySchema.parse(req.body);
    await softDeletePart({ partId: params.id, by: body.by });
    return { data: { id: params.id } };
  })
);

export default router;
