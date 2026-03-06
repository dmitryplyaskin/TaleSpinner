import crypto from "crypto";

import type {
  PromptDraftMessage,
  PromptSnapshotV1,
  TurnUserCanonicalizationRecord,
} from "../contracts";
import type { GenerateMessage } from "@shared/types/generate";

export type PromptDiagnosticsSectionTokens = {
  systemInstruction: number;
  chatHistory: number;
  worldInfoBefore: number;
  worldInfoAfter: number;
  worldInfoDepth: number;
  worldInfoOutlets: number;
  worldInfoAN: number;
  worldInfoEM: number;
};

export type PromptDiagnosticsDebugJson = {
  estimator: "chars_div4";
  prompt: {
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    approxTokens: {
      total: number;
      byRole: { system: number; user: number; assistant: number };
      sections: PromptDiagnosticsSectionTokens;
    };
  };
  worldInfo: {
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
  operations: {
    turnUserCanonicalization: TurnUserCanonicalizationRecord[];
  };
};

export type MessageNormalizationDebugFeature = {
  enabled: boolean;
  mergeSystem?: boolean;
  mergeConsecutiveAssistant?: boolean;
  separator?: string;
};

type PromptDiagnosticsWorldInfo = {
  worldInfoBefore: string;
  worldInfoAfter: string;
  depthEntries: Array<{ content: string }>;
  outletEntries: Record<string, string[]>;
  anTop: string[];
  anBottom: string[];
  emTop: string[];
  emBottom: string[];
  warnings: string[];
  activatedCount: number;
  activatedEntries: Array<{
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function draftToLlmMessages(draft: PromptDraftMessage[]): GenerateMessage[] {
  return draft
    .map((message) => ({
      role: message.role as GenerateMessage["role"],
      content: message.content.trim(),
    }))
    .filter((message) => message.content.length > 0);
}

export function hashPromptMessages(messages: GenerateMessage[]): string {
  return crypto.createHash("sha256").update(JSON.stringify(messages)).digest("hex");
}

export function approxTokensByChars(chars: number): number {
  if (!Number.isFinite(chars)) return 0;
  const normalized = Math.max(0, Math.floor(chars));
  if (normalized === 0) return 0;
  return Math.ceil(normalized / 4);
}

export function approxTokensByText(text: string): number {
  return approxTokensByChars(String(text ?? "").length);
}

function sumTextLengths(values: string[]): number {
  return values.reduce((acc, value) => acc + String(value ?? "").length, 0);
}

export function sumContextTokensByMessages(messages: PromptDraftMessage[]): number {
  const chars = messages.reduce((acc, message) => {
    if (message.role !== "user" && message.role !== "assistant") return acc;
    return acc + String(message.content ?? "").length;
  }, 0);
  return approxTokensByChars(chars);
}

export function buildRedactedSnapshot(
  messages: GenerateMessage[],
  params: {
    historyLimit: number;
    historyReturnedCount: number;
    worldInfoMeta?: PromptSnapshotV1["meta"]["worldInfo"];
  }
): PromptSnapshotV1 {
  const MAX_MSG_CHARS = 4_000;
  const MAX_TOTAL_CHARS = 50_000;
  let total = 0;
  let truncated = false;
  const snapshotMessages: PromptSnapshotV1["messages"] = [];

  for (const message of messages) {
    let content = message.content ?? "";
    if (content.length > MAX_MSG_CHARS) {
      content = `${content.slice(0, MAX_MSG_CHARS)}…`;
      truncated = true;
    }
    if (total + content.length > MAX_TOTAL_CHARS) {
      const remaining = Math.max(0, MAX_TOTAL_CHARS - total);
      content = remaining > 0 ? `${content.slice(0, remaining)}…` : "…";
      truncated = true;
    }
    total += content.length;
    snapshotMessages.push({ role: message.role, content });
    if (total >= MAX_TOTAL_CHARS) break;
  }

  return {
    v: 1,
    messages: snapshotMessages,
    truncated,
    meta: {
      historyLimit: params.historyLimit,
      historyReturnedCount: params.historyReturnedCount,
      worldInfo: params.worldInfoMeta,
    },
  };
}

function cloneLlmMessages(messages: GenerateMessage[]): GenerateMessage[] {
  return messages.map((message) => ({ role: message.role, content: message.content }));
}

function mergeContentsForDebug(items: string[], sep: string): string {
  return items.map((item) => String(item ?? "").trim()).filter(Boolean).join(sep);
}

function mergeSystemMessagesForDebug(messages: GenerateMessage[], sep: string): GenerateMessage[] {
  const systemParts: string[] = [];
  const rest: GenerateMessage[] = [];

  for (const message of messages) {
    if (message.role === "system") {
      systemParts.push(message.content);
      continue;
    }
    rest.push({ role: message.role, content: message.content });
  }

  const merged = mergeContentsForDebug(systemParts, sep);
  if (!merged) return rest;
  return [{ role: "system", content: merged }, ...rest];
}

function mergeConsecutiveAssistantForDebug(
  messages: GenerateMessage[],
  sep: string
): GenerateMessage[] {
  const out: GenerateMessage[] = [];

  for (const message of messages) {
    const prev = out[out.length - 1];
    if (prev && prev.role === "assistant" && message.role === "assistant") {
      out[out.length - 1] = {
        role: "assistant",
        content: mergeContentsForDebug([prev.content, message.content], sep),
      };
      continue;
    }
    out.push({ role: message.role, content: message.content });
  }

  return out;
}

export function normalizeLlmMessagesForDebug(
  messages: GenerateMessage[],
  feature: MessageNormalizationDebugFeature | undefined
): GenerateMessage[] {
  const enabled = feature?.enabled !== false;
  if (!enabled) return cloneLlmMessages(messages);

  const mergeSystem = feature?.mergeSystem ?? true;
  const mergeConsecutiveAssistant = feature?.mergeConsecutiveAssistant ?? false;
  const separator = feature?.separator ?? "\n\n";

  let normalized = cloneLlmMessages(messages);
  if (mergeSystem) {
    normalized = mergeSystemMessagesForDebug(normalized, separator);
  }
  if (mergeConsecutiveAssistant) {
    normalized = mergeConsecutiveAssistantForDebug(normalized, separator);
  }
  return normalized;
}

export function buildPromptDiagnosticsDebugJson(params: {
  llmMessages: GenerateMessage[];
  systemPrompt: string;
  templateHistoryMessages: Array<{ role: string; content: string }>;
  worldInfoDiagnostics: PromptDiagnosticsWorldInfo;
  turnUserCanonicalization: TurnUserCanonicalizationRecord[];
}): PromptDiagnosticsDebugJson {
  const byRole = params.llmMessages.reduce(
    (acc, message) => {
      const tokens = approxTokensByText(message.content);
      if (message.role === "system") acc.system += tokens;
      if (message.role === "user") acc.user += tokens;
      if (message.role === "assistant") acc.assistant += tokens;
      return acc;
    },
    { system: 0, user: 0, assistant: 0 }
  );
  const total = byRole.system + byRole.user + byRole.assistant;

  const worldInfoDepthChars = params.worldInfoDiagnostics.depthEntries.reduce(
    (acc, item) => acc + String(item.content ?? "").length,
    0
  );
  const worldInfoOutletChars = Object.values(params.worldInfoDiagnostics.outletEntries).reduce(
    (acc, entries) => acc + sumTextLengths(entries),
    0
  );
  const worldInfoAnChars =
    sumTextLengths(params.worldInfoDiagnostics.anTop) +
    sumTextLengths(params.worldInfoDiagnostics.anBottom);
  const worldInfoEmChars =
    sumTextLengths(params.worldInfoDiagnostics.emTop) +
    sumTextLengths(params.worldInfoDiagnostics.emBottom);
  const chatHistoryChars = params.templateHistoryMessages.reduce(
    (acc, item) => acc + String(item.content ?? "").length,
    0
  );

  const sections: PromptDiagnosticsSectionTokens = {
    systemInstruction: approxTokensByText(params.systemPrompt),
    chatHistory: approxTokensByChars(chatHistoryChars),
    worldInfoBefore: approxTokensByText(params.worldInfoDiagnostics.worldInfoBefore),
    worldInfoAfter: approxTokensByText(params.worldInfoDiagnostics.worldInfoAfter),
    worldInfoDepth: approxTokensByChars(worldInfoDepthChars),
    worldInfoOutlets: approxTokensByChars(worldInfoOutletChars),
    worldInfoAN: approxTokensByChars(worldInfoAnChars),
    worldInfoEM: approxTokensByChars(worldInfoEmChars),
  };

  return {
    estimator: "chars_div4",
    prompt: {
      messages: cloneLlmMessages(params.llmMessages),
      approxTokens: {
        total,
        byRole,
        sections,
      },
    },
    worldInfo: {
      activatedCount: params.worldInfoDiagnostics.activatedCount,
      warnings: [...params.worldInfoDiagnostics.warnings],
      entries: params.worldInfoDiagnostics.activatedEntries.map((entry) => ({
        hash: entry.hash,
        bookId: entry.bookId,
        bookName: entry.bookName,
        uid: entry.uid,
        comment: entry.comment,
        content: entry.content,
        matchedKeys: [...entry.matchedKeys],
        reasons: [...entry.reasons],
      })),
    },
    operations: {
      turnUserCanonicalization: params.turnUserCanonicalization.map((record) => ({ ...record })),
    },
  };
}

export function normalizePromptDiagnosticsDebugJson(
  value: unknown
): PromptDiagnosticsDebugJson | null {
  if (!isRecord(value)) return null;
  const prompt = isRecord(value.prompt) ? value.prompt : null;
  const approxTokens = prompt && isRecord(prompt.approxTokens) ? prompt.approxTokens : {};
  const byRole = isRecord(approxTokens.byRole) ? approxTokens.byRole : {};
  const sections = isRecord(approxTokens.sections) ? approxTokens.sections : {};

  const messages = (prompt && Array.isArray(prompt.messages) ? prompt.messages : [])
    .map((message) => {
      if (!isRecord(message)) return null;
      if (
        message.role !== "system" &&
        message.role !== "user" &&
        message.role !== "assistant"
      ) {
        return null;
      }
      if (typeof message.content !== "string") return null;
      return {
        role: message.role,
        content: message.content,
      };
    })
    .filter(
      (
        message
      ): message is PromptDiagnosticsDebugJson["prompt"]["messages"][number] => Boolean(message)
    );

  const worldInfoRaw: Record<string, unknown> | null =
    isRecord(value.worldInfo) &&
    (Array.isArray(value.worldInfo.entries) ||
      Array.isArray(value.worldInfo.warnings) ||
      typeof value.worldInfo.activatedCount === "number")
      ? value.worldInfo
      : null;
  const operationsRaw: { turnUserCanonicalization: unknown[] } | null =
    isRecord(value.operations) && Array.isArray(value.operations.turnUserCanonicalization)
      ? {
          turnUserCanonicalization: value.operations.turnUserCanonicalization,
        }
      : null;
  const hasPromptSignal = messages.length > 0;
  const worldInfoEntries = worldInfoRaw && Array.isArray(worldInfoRaw.entries) ? worldInfoRaw.entries : null;
  const worldInfoWarnings =
    worldInfoRaw && Array.isArray(worldInfoRaw.warnings) ? worldInfoRaw.warnings : null;
  const hasWorldInfoCount = worldInfoRaw && typeof worldInfoRaw.activatedCount === "number";
  const operationHistory = operationsRaw?.turnUserCanonicalization ?? null;
  const hasWorldInfoSignal =
    Boolean(worldInfoRaw) &&
    ((worldInfoEntries !== null && worldInfoEntries.length > 0) ||
      (worldInfoWarnings !== null && worldInfoWarnings.length > 0) ||
      hasWorldInfoCount);
  const hasOperationsSignal = operationHistory !== null && operationHistory.length > 0;

  if (!hasPromptSignal && !hasWorldInfoSignal && !hasOperationsSignal) return null;

  return {
    estimator: "chars_div4",
    prompt: {
      messages,
      approxTokens: {
        total: typeof approxTokens.total === "number" ? Math.max(0, Math.floor(approxTokens.total)) : 0,
        byRole: {
          system: typeof byRole.system === "number" ? Math.max(0, Math.floor(byRole.system)) : 0,
          user: typeof byRole.user === "number" ? Math.max(0, Math.floor(byRole.user)) : 0,
          assistant:
            typeof byRole.assistant === "number" ? Math.max(0, Math.floor(byRole.assistant)) : 0,
        },
        sections: {
          systemInstruction:
            typeof sections.systemInstruction === "number"
              ? Math.max(0, Math.floor(sections.systemInstruction))
              : 0,
          chatHistory:
            typeof sections.chatHistory === "number"
              ? Math.max(0, Math.floor(sections.chatHistory))
              : 0,
          worldInfoBefore:
            typeof sections.worldInfoBefore === "number"
              ? Math.max(0, Math.floor(sections.worldInfoBefore))
              : 0,
          worldInfoAfter:
            typeof sections.worldInfoAfter === "number"
              ? Math.max(0, Math.floor(sections.worldInfoAfter))
              : 0,
          worldInfoDepth:
            typeof sections.worldInfoDepth === "number"
              ? Math.max(0, Math.floor(sections.worldInfoDepth))
              : 0,
          worldInfoOutlets:
            typeof sections.worldInfoOutlets === "number"
              ? Math.max(0, Math.floor(sections.worldInfoOutlets))
              : 0,
          worldInfoAN:
            typeof sections.worldInfoAN === "number" ? Math.max(0, Math.floor(sections.worldInfoAN)) : 0,
          worldInfoEM:
            typeof sections.worldInfoEM === "number" ? Math.max(0, Math.floor(sections.worldInfoEM)) : 0,
        },
      },
    },
    worldInfo: {
      activatedCount:
        worldInfoRaw && typeof worldInfoRaw.activatedCount === "number"
          ? Math.max(0, Math.floor(worldInfoRaw.activatedCount))
          : 0,
      warnings:
        worldInfoWarnings
          ? worldInfoWarnings.filter((item): item is string => typeof item === "string")
          : [],
      entries:
        worldInfoEntries
          ? worldInfoEntries
              .map((entry) => {
                if (!isRecord(entry)) return null;
                if (
                  typeof entry.hash !== "string" ||
                  typeof entry.bookId !== "string" ||
                  typeof entry.bookName !== "string" ||
                  typeof entry.uid !== "number" ||
                  typeof entry.comment !== "string" ||
                  typeof entry.content !== "string"
                ) {
                  return null;
                }
                return {
                  hash: entry.hash,
                  bookId: entry.bookId,
                  bookName: entry.bookName,
                  uid: Math.max(0, Math.floor(entry.uid)),
                  comment: entry.comment,
                  content: entry.content,
                  matchedKeys: Array.isArray(entry.matchedKeys)
                    ? entry.matchedKeys.filter((item): item is string => typeof item === "string")
                    : [],
                  reasons: Array.isArray(entry.reasons)
                    ? entry.reasons.filter((item): item is string => typeof item === "string")
                    : [],
                };
              })
              .filter(
                (
                  entry
                ): entry is PromptDiagnosticsDebugJson["worldInfo"]["entries"][number] => Boolean(entry)
              )
          : [],
    },
    operations: {
      turnUserCanonicalization:
        operationHistory
          ? operationHistory
              .map((record) => {
                if (!isRecord(record)) return null;
                const hook =
                  record.hook === "before_main_llm" || record.hook === "after_main_llm"
                    ? record.hook
                    : null;
                if (
                  !hook ||
                  typeof record.opId !== "string" ||
                  typeof record.userEntryId !== "string" ||
                  typeof record.userMainPartId !== "string" ||
                  typeof record.beforeText !== "string" ||
                  typeof record.afterText !== "string" ||
                  typeof record.committedAt !== "string"
                ) {
                  return null;
                }
                return {
                  hook,
                  opId: record.opId,
                  userEntryId: record.userEntryId,
                  userMainPartId: record.userMainPartId,
                  ...(typeof record.replacedPartId === "string"
                    ? { replacedPartId: record.replacedPartId }
                    : {}),
                  ...(typeof record.canonicalPartId === "string"
                    ? { canonicalPartId: record.canonicalPartId }
                    : {}),
                  beforeText: record.beforeText,
                  afterText: record.afterText,
                  committedAt: record.committedAt,
                };
              })
              .filter(
                (
                  record
                ): record is PromptDiagnosticsDebugJson["operations"]["turnUserCanonicalization"][number] =>
                  Boolean(record)
              )
          : [],
    },
  };
}
