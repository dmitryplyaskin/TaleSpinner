import { getKnowledgeRecordAccessState } from "./knowledge-access-repository";
import { findKnowledgeRecordsByKeys } from "./knowledge-records-repository";

import type {
  KnowledgeAccessMode,
  KnowledgeGateExpression,
  KnowledgeGateNode,
  KnowledgeGatePredicate,
  KnowledgeRecordDto,
  KnowledgeRuntimeContext,
} from "@shared/types/chat-knowledge";

type EvaluationEnv = {
  ownerId: string;
  chatId: string;
  branchId: string | null;
  context?: KnowledgeRuntimeContext;
};

export function getDefaultAccessSnapshot(accessMode: KnowledgeAccessMode) {
  if (accessMode === "public") {
    return {
      discoverState: "visible" as const,
      readState: "full" as const,
      promptState: "allowed" as const,
      revealState: "hidden" as const,
    };
  }
  if (accessMode === "discoverable") {
    return {
      discoverState: "discoverable" as const,
      readState: "blocked" as const,
      promptState: "blocked" as const,
      revealState: "hidden" as const,
    };
  }
  return {
    discoverState: "hidden" as const,
    readState: "blocked" as const,
    promptState: "blocked" as const,
    revealState: "hidden" as const,
  };
}

async function resolveRecordState(params: {
  predicate: Extract<KnowledgeGatePredicate, { type: "record_revealed" | "record_state" }>;
  env: EvaluationEnv;
}) {
  const { predicate, env } = params;
  let recordId = predicate.recordId;
  if (!recordId && predicate.recordKey) {
    const records = await findKnowledgeRecordsByKeys({
      ownerId: env.ownerId,
      chatId: env.chatId,
      branchId: env.branchId,
      keys: [predicate.recordKey],
    });
    recordId = records[0]?.id;
  }
  if (!recordId) return null;
  return getKnowledgeRecordAccessState({
    ownerId: env.ownerId,
    chatId: env.chatId,
    branchId: env.branchId,
    recordId,
  });
}

async function evaluatePredicate(params: {
  predicate: KnowledgeGatePredicate;
  env: EvaluationEnv;
}): Promise<boolean> {
  const { predicate, env } = params;
  if (predicate.type === "flag_equals") {
    return env.context?.flags?.[predicate.key] === predicate.value;
  }
  if (predicate.type === "counter_gte") {
    return (env.context?.counters?.[predicate.key] ?? 0) >= predicate.value;
  }
  if (predicate.type === "manual_unlock") {
    return env.context?.manualUnlock === true;
  }
  if (predicate.type === "branch_only") {
    return predicate.branchId ? predicate.branchId === env.branchId : env.branchId !== null;
  }

  const state = await resolveRecordState({
    predicate,
    env,
  });
  if (!state) return false;
  if (predicate.type === "record_revealed") {
    return state.revealState === "revealed";
  }
  if (predicate.revealState && state.revealState !== predicate.revealState) return false;
  if (predicate.readState && state.readState !== predicate.readState) return false;
  if (predicate.promptState && state.promptState !== predicate.promptState) return false;
  return true;
}

async function evaluateNode(params: {
  node: KnowledgeGateNode;
  env: EvaluationEnv;
}): Promise<boolean> {
  const { node, env } = params;
  if ("type" in node) {
    return evaluatePredicate({
      predicate: node,
      env,
    });
  }
  if ("all" in node) {
    for (const item of node.all) {
      if (!(await evaluateNode({ node: item, env }))) return false;
    }
    return true;
  }
  if ("any" in node) {
    for (const item of node.any) {
      if (await evaluateNode({ node: item, env })) return true;
    }
    return false;
  }
  return !(await evaluateNode({ node: node.not, env }));
}

export async function evaluateKnowledgeGate(params: {
  record: KnowledgeRecordDto;
  gate?: { mode?: "always" } | KnowledgeGateExpression;
  ownerId: string;
  chatId: string;
  branchId: string | null;
  context?: KnowledgeRuntimeContext;
}): Promise<boolean> {
  if (!params.gate) return true;
  if ("mode" in params.gate) return params.gate.mode === "always";
  return evaluateNode({
    node: params.gate as KnowledgeGateExpression,
    env: {
      ownerId: params.ownerId,
      chatId: params.chatId,
      branchId: params.branchId,
      context: params.context,
    },
  });
}
