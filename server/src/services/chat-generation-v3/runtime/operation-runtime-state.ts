import { getBranchCurrentTurn } from "../../chat-entry-parts/branch-turn-repository";
import { listEntriesWithActiveVariantsPage } from "../../chat-entry-parts/entries-repository";
import { getPromptProjection } from "../../chat-entry-parts/projection";
import { serializePart } from "../../chat-entry-parts/prompt-serializers";
import { resolveOperationActivationState } from "../operations/operation-activation-intervals";

import {
  ChatRuntimeStateRepository,
  type ChatRuntimeStatePayload,
  type ChatRuntimeStateScope,
} from "./chat-runtime-state-repository";

import type { GenerateMessage } from "@shared/types/generate";
import type { OperationInProfile } from "@shared/types/operation-profiles";

type UserContextEvent = {
  contextTokens: number;
};

function approxTokensByChars(chars: number): number {
  if (!Number.isFinite(chars)) return 0;
  const normalized = Math.max(0, Math.floor(chars));
  if (normalized === 0) return 0;
  return Math.ceil(normalized / 4);
}

function sumContextTokensByMessages(messages: GenerateMessage[]): number {
  const chars = messages.reduce((acc, message) => {
    if (message.role !== "user" && message.role !== "assistant") return acc;
    return acc + String(message.content ?? "").length;
  }, 0);
  return approxTokensByChars(chars);
}

function supportsGenerateTrigger(op: OperationInProfile): boolean {
  const triggers = op.config.triggers ?? ["generate", "regenerate"];
  return triggers.includes("generate");
}

export function replayOperationActivationByEvents(params: {
  operations: OperationInProfile[];
  events: UserContextEvent[];
}): Record<string, { turnsCounter: number; tokensCounter: number }> {
  const out: Record<string, { turnsCounter: number; tokensCounter: number }> = {};

  for (const op of params.operations) {
    if (!op.config.activation) continue;
    let state: { turnsCounter: number; tokensCounter: number } | undefined = undefined;

    for (const event of params.events) {
      const resolved = resolveOperationActivationState({
        activation: op.config.activation,
        previous: state,
        source: "user_message",
        currentContextTokens: event.contextTokens,
        supportsCurrentTrigger: supportsGenerateTrigger(op),
      });
      state = resolved.nextState;
    }

    out[op.opId] = state ?? { turnsCounter: 0, tokensCounter: 0 };
  }

  return out;
}

export async function buildRuntimeBootstrapFromBranchHistory(params: {
  chatId: string;
  branchId: string;
  operations: OperationInProfile[];
  source: "user_message" | "continue" | "regenerate" | "system_message";
}): Promise<ChatRuntimeStatePayload> {
  const currentTurn = await getBranchCurrentTurn({ branchId: params.branchId });
  const entries: Awaited<ReturnType<typeof listEntriesWithActiveVariantsPage>>["entries"] = [];

  let cursorCreatedAt: number | undefined;
  let cursorEntryId: string | undefined;
  while (true) {
    const page = await listEntriesWithActiveVariantsPage({
      chatId: params.chatId,
      branchId: params.branchId,
      limit: 200,
      cursorCreatedAt,
      cursorEntryId,
    });
    entries.push(...page.entries);
    if (!page.pageInfo.hasMoreOlder || !page.pageInfo.nextCursor) break;
    cursorCreatedAt = page.pageInfo.nextCursor.createdAt;
    cursorEntryId = page.pageInfo.nextCursor.entryId;
  }
  entries.sort((a, b) => {
    if (a.entry.createdAt !== b.entry.createdAt) return a.entry.createdAt - b.entry.createdAt;
    return a.entry.entryId.localeCompare(b.entry.entryId);
  });

  const events: UserContextEvent[] = [];
  for (let idx = 0; idx < entries.length; idx += 1) {
    const candidate = entries[idx];
    if (!candidate || candidate.entry.role !== "user") continue;
    const messages = getPromptProjection({
      entries: entries.slice(0, idx + 1),
      currentTurn,
      serializePart,
    });
    events.push({ contextTokens: sumContextTokensByMessages(messages) });
  }

  // Current user send already inserted the latest user entry before run starts.
  if (params.source === "user_message" && events.length > 0) {
    events.pop();
  }

  return {
    version: 1,
    activationByOpId: replayOperationActivationByEvents({
      operations: params.operations,
      events,
    }),
    bootstrap: {
      source: "branch_active_history",
      userEventsCount: events.length,
      lastRebuiltAt: new Date().toISOString(),
    },
  };
}

export async function loadOrBootstrapRuntimeState(params: {
  scope: ChatRuntimeStateScope;
  operations: OperationInProfile[];
  source: "user_message" | "continue" | "regenerate" | "system_message";
}): Promise<{
  payload: ChatRuntimeStatePayload;
  updatedAt: Date;
}> {
  const existing = await ChatRuntimeStateRepository.getByScope(params.scope);
  if (existing) {
    return {
      payload: existing.payload,
      updatedAt: existing.updatedAt,
    };
  }

  const payload = await buildRuntimeBootstrapFromBranchHistory({
    chatId: params.scope.chatId,
    branchId: params.scope.branchId,
    operations: params.operations,
    source: params.source,
  });
  const saved = await ChatRuntimeStateRepository.upsert({
    scope: params.scope,
    payload,
  });
  return {
    payload: saved.payload,
    updatedAt: saved.updatedAt,
  };
}
