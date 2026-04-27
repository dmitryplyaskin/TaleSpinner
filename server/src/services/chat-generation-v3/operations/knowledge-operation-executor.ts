import { renderLiquidTemplate } from "../../chat-core/prompt-template-renderer";
import { revealKnowledgeRecords } from "../../chat-knowledge/knowledge-reveal-service";
import {
  searchKnowledgeRecords,
} from "../../chat-knowledge/knowledge-search-service";
import {
  parseKnowledgeRevealOperationParams,
  parseKnowledgeSearchOperationParams,
} from "../../operations/knowledge-operation-params";
import {
  compileArtifactExposureEffect,
  getArtifactPrimaryEffectType,
  type RuntimeEffect,
} from "../contracts";

import type { InstructionRenderContext } from "../../chat-core/prompt-template-renderer";
import type {
  KnowledgeRevealRequest,
  KnowledgeSearchRequest,
} from "@shared/types/chat-knowledge";
import type { OperationInProfile } from "@shared/types/operation-profiles";

type KnowledgeOperation = Extract<
  OperationInProfile,
  { kind: "knowledge_search" | "knowledge_reveal" }
>;

type ArtifactSnapshot = Record<string, { value: unknown; history: unknown[] }>;

type KnowledgeContext = {
  ownerId: string;
  chatId: string;
  branchId: string | null;
};

function parseJsonPayload<T>(value: unknown, label: string): T {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      throw new Error(
        `${label} must be valid JSON: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  if (value && typeof value === "object") {
    return value as T;
  }
  throw new Error(`${label} must resolve to a JSON object`);
}

async function resolveRequestValue(params: {
  op: KnowledgeOperation;
  liquidContext: InstructionRenderContext;
  artifacts: ArtifactSnapshot;
}): Promise<KnowledgeSearchRequest | KnowledgeRevealRequest> {
  const parsed =
    params.op.kind === "knowledge_search"
      ? parseKnowledgeSearchOperationParams(params.op.config.params.params)
      : parseKnowledgeRevealOperationParams(params.op.config.params.params);

  if (parsed.source.mode === "artifact") {
    const snapshot = params.artifacts[parsed.source.artifactTag];
    if (!snapshot) {
      throw new Error(`Artifact with tag ${parsed.source.artifactTag} not found`);
    }
    return parseJsonPayload(snapshot.value, `${params.op.kind} artifact request`);
  }

  const rendered = await renderLiquidTemplate({
    templateText: parsed.source.requestTemplate,
    context: params.liquidContext,
    options: {
      strictVariables: parsed.source.strictVariables,
    },
  });
  return parseJsonPayload(rendered, `${params.op.kind} inline request`);
}

export async function executeKnowledgeOperation(params: {
  op: KnowledgeOperation;
  liquidContext: InstructionRenderContext;
  artifacts: ArtifactSnapshot;
  knowledgeContext: KnowledgeContext;
}): Promise<{ effects: RuntimeEffect[]; debugSummary: string }> {
  const request = await resolveRequestValue(params);
  const value =
    params.op.kind === "knowledge_search"
      ? await searchKnowledgeRecords({
          ownerId: params.knowledgeContext.ownerId,
          chatId: params.knowledgeContext.chatId,
          branchId: params.knowledgeContext.branchId,
          request: request as KnowledgeSearchRequest,
        })
      : await revealKnowledgeRecords({
          ownerId: params.knowledgeContext.ownerId,
          chatId: params.knowledgeContext.chatId,
          branchId: params.knowledgeContext.branchId,
          request: request as KnowledgeRevealRequest,
        });

  const artifact = params.op.config.params.artifact;
  const effects: RuntimeEffect[] = [
    {
      type: "artifact.upsert",
      opId: params.op.opId,
      artifactId: artifact.tag,
      format: artifact.format,
      persistence: artifact.persistence,
      writeMode: artifact.writeMode,
      history: artifact.history,
      semantics: artifact.semantics ?? "intermediate",
      value,
    },
    ...artifact.exposures.map((exposure) =>
      compileArtifactExposureEffect({
        opId: params.op.opId,
        artifact,
        exposure,
        value,
      })
    ),
  ];

  const count = Array.isArray((value as { hits?: unknown[] }).hits)
    ? ((value as { hits: unknown[] }).hits?.length ?? 0)
    : Array.isArray((value as { results?: unknown[] }).results)
      ? ((value as { results: unknown[] }).results?.length ?? 0)
      : 0;

  return {
    effects,
    debugSummary: `${getArtifactPrimaryEffectType(artifact)}:${count}`,
  };
}
