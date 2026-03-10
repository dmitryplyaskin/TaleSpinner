import { getBranchCurrentTurn } from "../../../chat-entry-parts/branch-turn-repository";
import { getEntryById, getActiveVariantWithParts, listEntriesWithActiveVariants } from "../../../chat-entry-parts/entries-repository";
import { createPart, getPartWithVariantContextById } from "../../../chat-entry-parts/parts-repository";

import type { RunPersistenceTarget, RuntimeEffect, UserTurnTarget } from "../../contracts";
import type { Part } from "@shared/types/chat-entry-parts";

type ResolvedTarget = {
  entryId: string;
  variantId: string;
  parts: Part[];
};

function compareByTimeAndId(a: { entryId: string; createdAt: number }, b: { entryId: string; createdAt: number }): number {
  if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
  return a.entryId.localeCompare(b.entryId);
}

async function resolveCurrentEntryTarget(partId: string): Promise<ResolvedTarget | null> {
  const context = await getPartWithVariantContextById({ partId });
  if (!context) return null;
  const entry = await getEntryById({ entryId: context.entryId });
  if (!entry) return null;
  const variant = await getActiveVariantWithParts({ entry });
  return {
    entryId: context.entryId,
    variantId: context.variantId,
    parts: variant?.parts ?? [context.part],
  };
}

async function resolveUiTarget(params: {
  chatId: string;
  branchId: string;
  hook: "before_main_llm" | "after_main_llm";
  effect: Extract<RuntimeEffect, { type: "ui.inline" }>;
  persistenceTarget: RunPersistenceTarget;
  userTurnTarget?: UserTurnTarget;
}): Promise<ResolvedTarget | null> {
  const entries = await listEntriesWithActiveVariants({
    chatId: params.chatId,
    branchId: params.branchId,
    limit: 200,
  });

  const resolvedCandidates = entries
    .filter((item) => item.entry.role === params.effect.role && item.variant)
    .map((item) => ({
      entryId: item.entry.entryId,
      createdAt: item.entry.createdAt,
      variantId: item.variant!.variantId,
      parts: item.variant!.parts,
    }))
    .sort(compareByTimeAndId);

  const maybeCurrentUser =
    params.effect.role === "user" && params.userTurnTarget
      ? await resolveCurrentEntryTarget(params.userTurnTarget.userMainPartId)
      : null;
  const maybeCurrentAssistant =
    params.effect.role === "assistant" && params.hook === "after_main_llm"
      ? await resolveCurrentEntryTarget(params.persistenceTarget.assistantMainPartId)
      : null;

  const withCurrent = [...resolvedCandidates];
  if (maybeCurrentUser && !withCurrent.some((item) => item.entryId === maybeCurrentUser.entryId)) {
    withCurrent.push({ ...maybeCurrentUser, createdAt: Number.MAX_SAFE_INTEGER });
  }
  if (maybeCurrentAssistant && !withCurrent.some((item) => item.entryId === maybeCurrentAssistant.entryId)) {
    withCurrent.push({ ...maybeCurrentAssistant, createdAt: Number.MAX_SAFE_INTEGER });
  }

  const ordered = withCurrent.sort(compareByTimeAndId);
  if (ordered.length === 0) return null;

  if (params.effect.anchor === "after_last_user") {
    if (params.effect.role === "user" && maybeCurrentUser) return maybeCurrentUser;
    if (params.effect.role === "assistant" && maybeCurrentAssistant) return maybeCurrentAssistant;
    const last = ordered[ordered.length - 1];
    return last
      ? {
          entryId: last.entryId,
          variantId: last.variantId,
          parts: last.parts,
        }
      : null;
  }

  const depth = Math.max(0, Math.floor(params.effect.depthFromEnd ?? 0));
  const target = ordered[ordered.length - 1 - depth];
  if (!target) return null;
  return {
    entryId: target.entryId,
    variantId: target.variantId,
    parts: target.parts,
  };
}

function resolveNextOrder(parts: Part[]): number {
  const maxOrder = parts.reduce((max, part) => Math.max(max, part.order), 0);
  return maxOrder + 10;
}

function normalizePartPayload(value: unknown): string | number | boolean | object | null {
  if (value === null) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "object") return value;
  return String(value ?? "");
}

export async function persistUiInlineEffect(params: {
  ownerId: string;
  chatId: string;
  branchId: string;
  hook: "before_main_llm" | "after_main_llm";
  effect: Extract<RuntimeEffect, { type: "ui.inline" }>;
  persistenceTarget: RunPersistenceTarget;
  userTurnTarget?: UserTurnTarget;
}): Promise<void> {
  const target = await resolveUiTarget(params);
  if (!target) return;

  const currentTurn = await getBranchCurrentTurn({ branchId: params.branchId });
  await createPart({
    ownerId: params.ownerId,
    variantId: target.variantId,
    channel: "aux",
    order: resolveNextOrder(target.parts),
    payload: normalizePartPayload(params.effect.payload),
    payloadFormat: params.effect.format,
    visibility: {
      ui: "always",
      prompt: false,
    },
    lifespan: "infinite",
    source: "agent",
    createdTurn: currentTurn,
    tags: ["artifact_exposure", "ui_inline"],
  });
}
