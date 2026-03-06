import { and, eq } from "drizzle-orm";
import { randomUUID as uuidv4 } from "node:crypto";

import { safeJsonParse, safeJsonStringify } from "../../../chat-core/json";
import { initDb } from "../../../db/client";
import { chatRuntimeState } from "../../../db/schema";
import { INITIAL_OPERATION_ACTIVATION_STATE } from "../operations/operation-activation-intervals";

import type { OperationActivationState } from "../operations/operation-activation-intervals";

export type ChatRuntimeStateScope = {
  ownerId: string;
  chatId: string;
  branchId: string;
  profileId: string;
  operationProfileSessionId: string;
};

export type ChatRuntimeBootstrapMeta = {
  source: "branch_active_history";
  userEventsCount: number;
  lastRebuiltAt: string;
};

export type ChatRuntimeStatePayload = {
  version: 1;
  activationByOpId: Record<string, OperationActivationState>;
  bootstrap: ChatRuntimeBootstrapMeta;
};

export type ChatRuntimeStateRecord = {
  scope: ChatRuntimeStateScope;
  payload: ChatRuntimeStatePayload;
  updatedAt: Date;
};

function toNonNegativeInt(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function normalizeActivationByOpId(input: unknown): Record<string, OperationActivationState> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: Record<string, OperationActivationState> = {};
  for (const [rawOpId, rawState] of Object.entries(input)) {
    const opId = rawOpId.trim();
    if (opId.length === 0) continue;
    if (!rawState || typeof rawState !== "object" || Array.isArray(rawState)) {
      out[opId] = { ...INITIAL_OPERATION_ACTIVATION_STATE };
      continue;
    }
    const state = rawState as Record<string, unknown>;
    out[opId] = {
      turnsCounter: toNonNegativeInt(state.turnsCounter),
      tokensCounter: toNonNegativeInt(state.tokensCounter),
    };
  }
  return out;
}

function normalizeBootstrapMeta(input: unknown): ChatRuntimeBootstrapMeta {
  const nowIso = new Date().toISOString();
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      source: "branch_active_history",
      userEventsCount: 0,
      lastRebuiltAt: nowIso,
    };
  }
  const bootstrap = input as Record<string, unknown>;
  const source =
    bootstrap.source === "branch_active_history"
      ? "branch_active_history"
      : "branch_active_history";
  const lastRebuiltAt =
    typeof bootstrap.lastRebuiltAt === "string" && bootstrap.lastRebuiltAt.trim().length > 0
      ? bootstrap.lastRebuiltAt
      : nowIso;
  return {
    source,
    userEventsCount: toNonNegativeInt(bootstrap.userEventsCount),
    lastRebuiltAt,
  };
}

function normalizePayload(input: unknown): ChatRuntimeStatePayload {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      version: 1,
      activationByOpId: {},
      bootstrap: normalizeBootstrapMeta(null),
    };
  }
  const payload = input as Record<string, unknown>;
  return {
    version: 1,
    activationByOpId: normalizeActivationByOpId(payload.activationByOpId),
    bootstrap: normalizeBootstrapMeta(payload.bootstrap),
  };
}

function rowToRecord(row: typeof chatRuntimeState.$inferSelect): ChatRuntimeStateRecord {
  return {
    scope: {
      ownerId: row.ownerId,
      chatId: row.chatId,
      branchId: row.branchId,
      profileId: row.profileId,
      operationProfileSessionId: row.operationProfileSessionId,
    },
    payload: normalizePayload(safeJsonParse<unknown>(row.stateJson, null)),
    updatedAt: row.updatedAt,
  };
}

export class ChatRuntimeStateRepository {
  static async getByScope(params: ChatRuntimeStateScope): Promise<ChatRuntimeStateRecord | null> {
    const db = await initDb();
    const rows = await db
      .select()
      .from(chatRuntimeState)
      .where(
        and(
          eq(chatRuntimeState.ownerId, params.ownerId),
          eq(chatRuntimeState.chatId, params.chatId),
          eq(chatRuntimeState.branchId, params.branchId),
          eq(chatRuntimeState.profileId, params.profileId),
          eq(chatRuntimeState.operationProfileSessionId, params.operationProfileSessionId)
        )
      )
      .limit(1);
    const row = rows[0];
    return row ? rowToRecord(row) : null;
  }

  static async upsert(params: {
    scope: ChatRuntimeStateScope;
    payload: ChatRuntimeStatePayload;
  }): Promise<ChatRuntimeStateRecord> {
    const db = await initDb();
    const now = new Date();

    await db
      .insert(chatRuntimeState)
      .values({
        id: uuidv4(),
        ownerId: params.scope.ownerId,
        chatId: params.scope.chatId,
        branchId: params.scope.branchId,
        profileId: params.scope.profileId,
        operationProfileSessionId: params.scope.operationProfileSessionId,
        stateJson: safeJsonStringify(params.payload, "{}"),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          chatRuntimeState.ownerId,
          chatRuntimeState.chatId,
          chatRuntimeState.branchId,
          chatRuntimeState.profileId,
          chatRuntimeState.operationProfileSessionId,
        ],
        set: {
          stateJson: safeJsonStringify(params.payload, "{}"),
          updatedAt: now,
        },
      });

    const reloaded = await this.getByScope(params.scope);
    if (reloaded) return reloaded;
    return {
      scope: params.scope,
      payload: normalizePayload(params.payload),
      updatedAt: now,
    };
  }
}
