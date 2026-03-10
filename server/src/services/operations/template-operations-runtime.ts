import { runOrchestrator } from "@core/operation-orchestrator";

import { renderLiquidTemplate } from "../chat-core/prompt-template-renderer";
import { compileArtifactExposureEffect } from "../chat-generation-v3/contracts";
import { applyPromptEffect } from "../chat-generation-v3/operations/effect-handlers/prompt-effects";

import type { InstructionRenderContext } from "../chat-core/prompt-template-renderer";
import type { OperationInProfile, OperationProfile, OperationTrigger } from "@shared/types/operation-profiles";

export type PromptDraftMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type RuntimeState = {
  messages: PromptDraftMessage[];
  art: Record<string, { value: unknown; history: unknown[] }>;
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

function mapArtifactsByOpId(
  operations: OperationInProfile[],
  artifacts: Record<string, { value: unknown; history: unknown[] }>
): Record<string, { value: unknown; history: unknown[] }> {
  const mapped: Record<string, { value: unknown; history: unknown[] }> = {};
  for (const op of operations) {
    const artifact = artifacts[op.config.params.artifact.artifactId];
    if (!artifact) continue;
    mapped[op.opId] = { value: artifact.value, history: [...artifact.history] };
  }
  return mapped;
}

function mapArtifactsForTemplate(
  operations: OperationInProfile[],
  artifacts: Record<string, { value: unknown; history: unknown[] }>
): Record<string, { value: unknown; history: unknown[] }> {
  const mapped: Record<string, { value: unknown; history: unknown[] }> = {};
  for (const op of operations) {
    const artifact = artifacts[op.config.params.artifact.artifactId];
    if (!artifact) continue;
    const snapshot = { value: artifact.value, history: [...artifact.history] };
    mapped[op.config.params.artifact.tag] = snapshot;
    mapped[op.config.params.artifact.artifactId] = snapshot;
  }
  return mapped;
}

function applyArtifactEffects(
  state: RuntimeState,
  op: Extract<OperationInProfile, { kind: "template" }>,
  payload: string
): void {
  const artifact = op.config.params.artifact;
  const existing = state.art[artifact.artifactId];
  if (existing) {
    existing.value = payload;
    existing.history.push(payload);
  } else {
    state.art[artifact.artifactId] = { value: payload, history: [payload] };
  }

  for (const exposure of artifact.exposures) {
    const effect = compileArtifactExposureEffect({
      opId: op.opId,
      artifact,
      exposure,
      value: payload,
    });
    if (
      effect.type === "prompt.system_update" ||
      effect.type === "prompt.append_after_last_user" ||
      effect.type === "prompt.insert_at_depth"
    ) {
      state.messages = applyPromptEffect(state.messages, effect);
      continue;
    }
    if (effect.type === "turn.assistant.replace_text") {
      state.assistantText = effect.text;
      continue;
    }
    if (effect.type === "turn.user.replace_text") {
      const lastUserIdx = state.messages.map((m) => m.role).lastIndexOf("user");
      if (lastUserIdx >= 0) {
        state.messages[lastUserIdx] = { role: "user", content: effect.text };
      }
    }
  }
}

function buildOperationContext(
  base: InstructionRenderContext,
  state: RuntimeState,
  operations: OperationInProfile[]
): InstructionRenderContext {
  return {
    ...base,
    promptSystem: resolvePromptSystem(state.messages),
    art: { ...(base.art ?? {}), ...mapArtifactsForTemplate(operations, state.art) },
    artByOpId: {
      ...(base.artByOpId ?? {}),
      ...mapArtifactsByOpId(operations, state.art),
    },
    messages: state.messages.map((m) => ({ role: m.role, content: m.content })),
  };
}

async function runTemplateOperations(params: {
  runId: string;
  profile: OperationProfile;
  trigger: OperationTrigger;
  hook: "before_main_llm" | "after_main_llm";
  state: RuntimeState;
  templateContext: InstructionRenderContext;
}): Promise<void> {
  const ops = (params.profile.operations ?? []).filter(
    (op): op is Extract<OperationInProfile, { kind: "template" }> =>
      op.kind === "template" &&
      op.config.hooks.includes(params.hook) &&
      (op.config.triggers ?? ["generate", "regenerate"]).includes(params.trigger)
  );

  if (ops.length === 0) return;

  const result = await runOrchestrator({
    runId: params.runId,
    hook: params.hook,
    trigger: params.trigger,
    executionMode: params.profile.executionMode,
    tasks: ops.map((op) => ({
      taskId: op.opId,
      name: op.name,
      enabled: op.config.enabled,
      required: op.config.required,
      order: op.config.order,
      dependsOn: op.config.dependsOn,
      run: async () => {
        const rendered = normalizeText(
          await renderLiquidTemplate({
            templateText: op.config.params.template,
            context: buildOperationContext(params.templateContext, params.state, params.profile.operations ?? []),
            options: { strictVariables: Boolean(op.config.params.strictVariables) },
          })
        );

        applyArtifactEffects(params.state, op, rendered);
        return { output: rendered };
      },
    })),
  });

  const byOpId = new Map(ops.map((op) => [op.opId, op] as const));
  const failedRequired = result.tasks.filter((task) => {
    const op = byOpId.get(task.taskId);
    return Boolean(op?.config.required) && task.status !== "done";
  });

  if (failedRequired.length > 0) {
    const first = failedRequired[0]!;
    throw new Error(`Required template operation failed: ${first.taskId} (${first.status})`);
  }
}

export async function applyTemplateOperationsToPromptDraft(params: {
  runId: string;
  profile: OperationProfile;
  trigger: OperationTrigger;
  draftMessages: PromptDraftMessage[];
  templateContext: InstructionRenderContext;
}): Promise<{
  messages: PromptDraftMessage[];
  artifacts: Record<string, { value: unknown; history: unknown[] }>;
}> {
  const state: RuntimeState = {
    messages: params.draftMessages.map((m) => ({ ...m })),
    art: {},
    assistantText: "",
  };

  await runTemplateOperations({
    runId: `${params.runId}:before`,
    profile: params.profile,
    trigger: params.trigger,
    hook: "before_main_llm",
    state,
    templateContext: params.templateContext,
  });

  return { messages: state.messages, artifacts: state.art };
}

export async function applyTemplateOperationsAfterMainLlm(params: {
  runId: string;
  profile: OperationProfile;
  trigger: OperationTrigger;
  draftMessages: PromptDraftMessage[];
  assistantText: string;
  templateContext: InstructionRenderContext;
}): Promise<{
  assistantText: string;
  artifacts: Record<string, { value: unknown; history: unknown[] }>;
}> {
  const state: RuntimeState = {
    messages: params.draftMessages.map((m) => ({ ...m })),
    art: {},
    assistantText: params.assistantText,
  };

  state.messages.push({ role: "assistant", content: state.assistantText });

  await runTemplateOperations({
    runId: `${params.runId}:after`,
    profile: params.profile,
    trigger: params.trigger,
    hook: "after_main_llm",
    state,
    templateContext: params.templateContext,
  });

  return {
    assistantText: state.assistantText,
    artifacts: state.art,
  };
}

