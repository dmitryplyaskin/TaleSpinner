import { runOrchestrator } from "@core/operation-orchestrator";


import { renderLiquidTemplate } from "../../chat-core/prompt-template-renderer";
import {
  mapOperationOutputToEffectType,
  type OperationFinishedEventData,
  type OperationExecutionResult,
  type OperationSkipDetails,
  type OperationSkipReason,
  type PromptDraftMessage,
  type RuntimeEffect,
} from "../contracts";

import { applyPromptEffect } from "./effect-handlers/prompt-effects";
import { executeLlmOperation } from "./llm-operation-executor";

import type { TaskResult } from "../../../core/operation-orchestrator/types";
import type { InstructionRenderContext } from "../../chat-core/prompt-template-renderer";
import type { OperationHook, OperationInProfile, OperationTrigger } from "@shared/types/operation-profiles";

type PreviewState = {
  messages: PromptDraftMessage[];
  artifacts: Record<string, { value: string; history: string[] }>;
  assistantText: string;
};

function resolvePromptSystem(messages: PromptDraftMessage[]): string {
  return messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .filter((content) => content.trim().length > 0)
    .join("\n\n");
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function normalizePromptTimeRole(value: unknown): PromptDraftMessage["role"] {
  if (value === "assistant" || value === "user" || value === "system") return value;
  if (value === "developer") return "system";
  return "system";
}

function normalizeDepthFromEnd(value: unknown): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return Math.abs(Math.floor(n));
}

function clonePreview(state: PreviewState): PreviewState {
  return {
    messages: state.messages.map((m) => ({ ...m })),
    artifacts: Object.fromEntries(
      Object.entries(state.artifacts).map(([tag, value]) => [
        tag,
        { value: value.value, history: [...value.history] },
      ])
    ),
    assistantText: state.assistantText,
  };
}

function toRuntimeEffect(params: {
  opId: string;
  output: OperationInProfile["config"]["params"]["output"];
  rendered: string;
}): RuntimeEffect {
  const { opId, output, rendered } = params;
  if (output.type === "artifacts") {
    return {
      type: "artifact.upsert",
      opId,
      tag: output.writeArtifact.tag,
      persistence: output.writeArtifact.persistence,
      usage: output.writeArtifact.usage,
      semantics: output.writeArtifact.semantics,
      value: rendered,
    };
  }

  if (output.type === "turn_canonicalization") {
    return output.canonicalization.target === "assistant"
      ? { type: "turn.assistant.replace_text", opId, text: rendered }
      : { type: "turn.user.replace_text", opId, text: rendered };
  }

  if (output.promptTime.kind === "system_update") {
    return {
      type: "prompt.system_update",
      opId,
      mode: output.promptTime.mode,
      payload: rendered,
      source: output.promptTime.source,
    };
  }

  if (output.promptTime.kind === "append_after_last_user") {
    return {
      type: "prompt.append_after_last_user",
      opId,
      role: normalizePromptTimeRole(output.promptTime.role),
      payload: rendered,
      source: output.promptTime.source,
    };
  }

  return {
    type: "prompt.insert_at_depth",
    opId,
    role: normalizePromptTimeRole(output.promptTime.role),
    depthFromEnd: normalizeDepthFromEnd(output.promptTime.depthFromEnd),
    payload: rendered,
    source: output.promptTime.source,
  };
}

function applyEffectToPreview(state: PreviewState, effect: RuntimeEffect): PreviewState {
  if (
    effect.type === "prompt.system_update" ||
    effect.type === "prompt.append_after_last_user" ||
    effect.type === "prompt.insert_at_depth"
  ) {
    return { ...state, messages: applyPromptEffect(state.messages, effect) };
  }

  if (effect.type === "artifact.upsert") {
    const existing = state.artifacts[effect.tag];
    const history = [...(existing?.history ?? []), effect.value];
    return {
      ...state,
      artifacts: {
        ...state.artifacts,
        [effect.tag]: {
          value: effect.value,
          history,
        },
      },
    };
  }

  if (effect.type === "turn.assistant.replace_text") {
    return {
      ...state,
      assistantText: effect.text,
    };
  }

  const lastUserIdx = state.messages.map((m) => m.role).lastIndexOf("user");
  if (lastUserIdx < 0) return state;
  const nextMessages = state.messages.map((m, idx) =>
    idx === lastUserIdx ? { role: "user" as const, content: effect.text } : { ...m }
  );
  return { ...state, messages: nextMessages };
}

function replayDependencyEffects(
  base: PreviewState,
  deps: string[],
  effectsByOpId: ReadonlyMap<string, RuntimeEffect[]>
): PreviewState {
  let state = clonePreview(base);
  for (const depId of deps) {
    const effects = effectsByOpId.get(depId) ?? [];
    for (const effect of effects) {
      state = applyEffectToPreview(state, effect);
    }
  }
  return state;
}

function buildTemplateContext(base: InstructionRenderContext, state: PreviewState): InstructionRenderContext {
  return {
    ...base,
    promptSystem: resolvePromptSystem(state.messages),
    art: {
      ...(base.art ?? {}),
      ...Object.fromEntries(
        Object.entries(state.artifacts).map(([tag, value]) => [tag, { value: value.value, history: value.history }])
      ),
    },
    messages: state.messages.map((m) => ({ role: m.role, content: m.content })),
  };
}

function buildLiquidContextSnapshot(params: {
  base: InstructionRenderContext;
  state: PreviewState;
}): {
  char: unknown;
  user: unknown;
  chat: unknown;
  rag: unknown;
  now: string;
  promptSystem: string;
  messages: Array<{ role: PromptDraftMessage["role"]; content: string }>;
  art: Record<string, { value: string; history: string[] }>;
} {
  return {
    char: params.base.char ?? {},
    user: params.base.user ?? {},
    chat: params.base.chat ?? {},
    rag: params.base.rag ?? {},
    now: params.base.now,
    promptSystem: resolvePromptSystem(params.state.messages),
    messages: params.state.messages.map((m) => ({ role: m.role, content: m.content })),
    art: Object.fromEntries(
      Object.entries(params.state.artifacts).map(([tag, value]) => [
        tag,
        { value: value.value, history: [...value.history] },
      ])
    ),
  };
}

function normalizeBlockedByOpIds(input: string[] | undefined): string[] {
  if (!input || input.length === 0) return [];
  return Array.from(new Set(input)).sort((a, b) => a.localeCompare(b));
}

function resolveSkipReasonAndDetails(params: {
  reason: OperationSkipReason;
  dependsOn: string[];
  blockedByOpIds?: string[];
  activationSkippedByOpId: ReadonlyMap<string, NonNullable<OperationSkipDetails["activation"]>>;
}): { skipReason: OperationSkipReason; skipDetails?: OperationSkipDetails } {
  const blockedByOpIds = normalizeBlockedByOpIds(
    params.blockedByOpIds?.length
      ? params.blockedByOpIds
      : params.reason === "dependency_missing" || params.reason === "dependency_not_done"
        ? params.dependsOn
        : []
  );
  const activationBlockedBy = blockedByOpIds.filter((opId) =>
    params.activationSkippedByOpId.has(opId)
  );
  const allBlockedByActivation =
    blockedByOpIds.length > 0 && activationBlockedBy.length === blockedByOpIds.length;

  if (params.reason === "dependency_missing" && allBlockedByActivation) {
    return {
      skipReason: "dependency_not_done",
      skipDetails: {
        blockedByOpIds,
        blockedByReason: "activation_not_reached",
      },
    };
  }

  if (params.reason === "dependency_missing" || params.reason === "dependency_not_done") {
    return {
      skipReason: params.reason,
      skipDetails:
        blockedByOpIds.length > 0
          ? {
              blockedByOpIds,
              blockedByReason: allBlockedByActivation ? "activation_not_reached" : undefined,
            }
          : undefined,
    };
  }

  return { skipReason: params.reason };
}

function mapTaskResult(params: {
  hook: OperationHook;
  task: TaskResult;
  op: OperationInProfile;
  activationSkippedByOpId: ReadonlyMap<string, NonNullable<OperationSkipDetails["activation"]>>;
}): OperationExecutionResult {
  const { task, op } = params;
  if (task.status === "done") {
    const rawResult = (task as { result?: unknown }).result;
    const result =
      rawResult && typeof rawResult === "object"
        ? (rawResult as { effects?: unknown; debugSummary?: unknown })
        : {};
    const effects = Array.isArray(result.effects)
      ? (result.effects as RuntimeEffect[])
      : [];
    const debugSummary =
      typeof result.debugSummary === "string" ? result.debugSummary : undefined;

    return {
      opId: op.opId,
      name: op.name,
      required: op.config.required,
      hook: params.hook,
      status: "done",
      order: op.config.order,
      dependsOn: op.config.dependsOn ?? [],
      effects,
      debugSummary,
    };
  }

  if (task.status === "error") {
    return {
      opId: op.opId,
      name: op.name,
      required: op.config.required,
      hook: params.hook,
      status: "error",
      order: op.config.order,
      dependsOn: op.config.dependsOn ?? [],
      effects: [],
      error: {
        code: task.error.code ?? "OPERATION_ERROR",
        message: task.error.message,
      },
    };
  }

  if (task.status === "aborted") {
    return {
      opId: op.opId,
      name: op.name,
      required: op.config.required,
      hook: params.hook,
      status: "aborted",
      order: op.config.order,
      dependsOn: op.config.dependsOn ?? [],
      effects: [],
      error: task.reason
        ? {
            code: "OPERATION_ABORTED",
            message: task.reason,
          }
        : undefined,
    };
  }

  const normalized = resolveSkipReasonAndDetails({
    reason: task.reason as OperationSkipReason,
    dependsOn: op.config.dependsOn ?? [],
    blockedByOpIds: task.blockedByTaskIds,
    activationSkippedByOpId: params.activationSkippedByOpId,
  });
  return {
    opId: op.opId,
    name: op.name,
    required: op.config.required,
    hook: params.hook,
    status: "skipped",
    order: op.config.order,
    dependsOn: op.config.dependsOn ?? [],
    effects: [],
    skipReason: normalized.skipReason,
    skipDetails: normalized.skipDetails,
  };
}

export async function executeOperationsPhase(params: {
  runId: string;
  hook: OperationHook;
  trigger: OperationTrigger;
  operations: OperationInProfile[];
  activationSkippedByOpId?: ReadonlyMap<
    string,
    NonNullable<OperationSkipDetails["activation"]>
  >;
  executionMode: "concurrent" | "sequential";
  baseMessages: PromptDraftMessage[];
  baseArtifacts: Record<string, { value: string; history: string[] }>;
  assistantText: string;
  templateContext: InstructionRenderContext;
  abortSignal?: AbortSignal;
  onOperationStarted?: (data: { hook: OperationHook; opId: string; name: string }) => void;
  onOperationFinished?: (data: OperationFinishedEventData) => void;
  onTemplateDebug?: (data: {
    hook: OperationHook;
    opId: string;
    name: string;
    template: string;
    rendered: string;
    effect: RuntimeEffect;
    liquidContext: {
      char: unknown;
      user: unknown;
      chat: unknown;
      rag: unknown;
      now: string;
      promptSystem: string;
      messages: Array<{ role: PromptDraftMessage["role"]; content: string }>;
      art: Record<string, { value: string; history: string[] }>;
    };
  }) => void;
}): Promise<OperationExecutionResult[]> {
  const candidateOperations = params.operations.filter((op) => {
    if (!op.config.enabled) return false;
    if (!op.config.hooks.includes(params.hook)) return false;
    const triggers = op.config.triggers ?? ["generate", "regenerate"];
    return triggers.includes(params.trigger);
  });

  if (candidateOperations.length === 0) return [];
  const activationSkippedByOpId = params.activationSkippedByOpId ?? new Map();
  const activationSkippedResults: OperationExecutionResult[] = [];
  const runnableOperations: OperationInProfile[] = [];
  for (const op of candidateOperations) {
    const activation = activationSkippedByOpId.get(op.opId);
    if (!activation) {
      runnableOperations.push(op);
      continue;
    }
    const result: OperationExecutionResult = {
      opId: op.opId,
      name: op.name,
      required: op.config.required,
      hook: params.hook,
      status: "skipped",
      order: op.config.order,
      dependsOn: op.config.dependsOn ?? [],
      effects: [],
      skipReason: "activation_not_reached",
      skipDetails: {
        activation: {
          everyNTurns: activation.everyNTurns,
          everyNContextTokens: activation.everyNContextTokens,
          turnsCounter: activation.turnsCounter,
          tokensCounter: activation.tokensCounter,
        },
      },
    };
    activationSkippedResults.push(result);
    params.onOperationFinished?.({
      hook: params.hook,
      opId: op.opId,
      name: op.name,
      status: "skipped",
      skipReason: "activation_not_reached",
      skipDetails: result.skipDetails,
    });
  }

  const executableOps = runnableOperations.filter(
    (op): op is Extract<OperationInProfile, { kind: "template" | "llm" }> =>
      op.kind === "template" || op.kind === "llm"
  );
  const executableOpsById = new Map(executableOps.map((op) => [op.opId, op]));
  const executableTaskIdSet = new Set(executableOps.map((op) => op.opId));
  const unsupportedOps = runnableOperations.filter(
    (op): op is Exclude<OperationInProfile, Extract<OperationInProfile, { kind: "template" | "llm" }>> =>
      op.kind !== "template" && op.kind !== "llm"
  );

  const effectsByOpId = new Map<string, RuntimeEffect[]>();
  const taskResultByOpId = new Map<string, NonNullable<OperationFinishedEventData["result"]>>();
  const baseState: PreviewState = {
    messages: params.baseMessages.map((m) => ({ ...m })),
    artifacts: Object.fromEntries(
      Object.entries(params.baseArtifacts).map(([tag, v]) => [tag, { value: v.value, history: [...v.history] }])
    ),
    assistantText: params.assistantText,
  };

  const skippedEventMetaByTaskId = new Map<
    string,
    { skipReason: OperationSkipReason; skipDetails?: OperationSkipDetails }
  >();
  const executableResults: OperationExecutionResult[] = [];
  if (executableOps.length > 0) {
    const orchestration = await runOrchestrator(
      {
        runId: `${params.runId}:${params.hook}`,
        hook: params.hook,
        trigger: params.trigger,
        executionMode: params.executionMode,
        signal: params.abortSignal,
        tasks: executableOps.map((op) => ({
          taskId: op.opId,
          name: op.name,
          enabled: op.config.enabled,
          required: op.config.required,
          order: op.config.order,
          dependsOn: op.config.dependsOn,
          run: async () => {
            const depPreview = replayDependencyEffects(baseState, op.config.dependsOn ?? [], effectsByOpId);
            const liquidContext = buildTemplateContext(params.templateContext, depPreview);
            let resolvedRendered = "";
            let debugSummary: string | undefined;

            if (op.kind === "template") {
              resolvedRendered = normalizeText(
                await renderLiquidTemplate({
                  templateText: op.config.params.template,
                  context: liquidContext,
                  options: { strictVariables: Boolean(op.config.params.strictVariables) },
                })
              );
            }

            if (op.kind === "llm") {
              const llmResult = await executeLlmOperation({
                op,
                liquidContext,
                abortSignal: params.abortSignal,
              });
              resolvedRendered = normalizeText(llmResult.rendered);
              debugSummary = llmResult.debugSummary;
            }

            const effect = toRuntimeEffect({
              opId: op.opId,
              output: op.config.params.output,
              rendered: resolvedRendered,
            });
            if (op.kind === "template") {
              params.onTemplateDebug?.({
                hook: params.hook,
                opId: op.opId,
                name: op.name,
                template: op.config.params.template,
                rendered: resolvedRendered,
                effect,
                liquidContext: buildLiquidContextSnapshot({
                  base: liquidContext,
                  state: depPreview,
                }),
              });
            }
            const effects: RuntimeEffect[] = [effect];
            effectsByOpId.set(op.opId, effects);
            taskResultByOpId.set(op.opId, {
              effects,
              debugSummary:
                debugSummary ??
                `${mapOperationOutputToEffectType(op.config.params.output)}:${resolvedRendered.length}`,
            });
            return {
              effects,
              debugSummary:
                debugSummary ??
                `${mapOperationOutputToEffectType(op.config.params.output)}:${resolvedRendered.length}`,
            };
          },
        })),
      },
      {
        onEvent: (evt) => {
          if (evt.type === "orch.task.started") {
            const op = executableOpsById.get(evt.data.taskId);
            if (!op) return;
            params.onOperationStarted?.({ hook: params.hook, opId: op.opId, name: op.name });
            return;
          }
          if (evt.type === "orch.task.skipped") {
            const op = executableOpsById.get(evt.data.taskId);
            if (!op) return;
            const missingDeps =
              evt.data.reason === "dependency_missing"
                ? (op.config.dependsOn ?? []).filter((depId) => !executableTaskIdSet.has(depId))
                : op.config.dependsOn ?? [];
            skippedEventMetaByTaskId.set(
              op.opId,
              resolveSkipReasonAndDetails({
                reason: evt.data.reason as OperationSkipReason,
                dependsOn: op.config.dependsOn ?? [],
                blockedByOpIds: missingDeps,
                activationSkippedByOpId,
              })
            );
            return;
          }
          if (evt.type === "orch.task.finished") {
            const op = executableOpsById.get(evt.data.taskId);
            if (!op) return;
            if (evt.data.status === "skipped") {
              const normalized =
                skippedEventMetaByTaskId.get(op.opId) ??
                resolveSkipReasonAndDetails({
                  reason: "dependency_not_done",
                  dependsOn: op.config.dependsOn ?? [],
                  activationSkippedByOpId,
                });
              params.onOperationFinished?.({
                hook: params.hook,
                opId: op.opId,
                name: op.name,
                status: "skipped",
                skipReason: normalized.skipReason,
                skipDetails: normalized.skipDetails,
              });
              return;
            }
            const result =
              evt.data.status === "done" ? taskResultByOpId.get(op.opId) : undefined;
            params.onOperationFinished?.({
              hook: params.hook,
              opId: op.opId,
              name: op.name,
              status: evt.data.status,
              result,
            });
          }
        },
      }
    );

    executableResults.push(
      ...orchestration.tasks
        .map((task) => {
          const op = executableOpsById.get(task.taskId);
          if (!op) return null;
          return mapTaskResult({
            hook: params.hook,
            op,
            task,
            activationSkippedByOpId,
          });
        })
        .filter((item): item is OperationExecutionResult => Boolean(item))
    );
  }

  const nonTemplateResults: OperationExecutionResult[] = unsupportedOps.map((op) => ({
    opId: op.opId,
    name: op.name,
    required: op.config.required,
    hook: params.hook,
    status: "skipped",
    order: op.config.order,
    dependsOn: op.config.dependsOn ?? [],
    effects: [],
    skipReason: "unsupported_kind",
  }));

  const all = [...activationSkippedResults, ...executableResults, ...nonTemplateResults].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.opId.localeCompare(b.opId);
  });

  for (const item of nonTemplateResults) {
    params.onOperationFinished?.({
      hook: params.hook,
      opId: item.opId,
      name: item.name,
      status: "skipped",
      skipReason: "unsupported_kind",
    });
  }

  return all;
}
