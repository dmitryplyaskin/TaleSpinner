import {
  ST_PROMPT_DEFAULT_DEPTH,
  ST_PROMPT_DEFAULT_ORDER,
  ST_PROMPT_INJECTION_POSITION,
} from "@shared/types/instructions";
import { SILLY_TAVERN_PREFERRED_CHARACTER_ID } from "@shared/utils/sillytavern-preset";
import { cloneStPromptWithDefaults } from "@shared/utils/st-prompts";

import { renderLiquidTemplate } from "./prompt-template-renderer";

import type { InstructionRenderContext } from "./prompt-template-renderer";
import type {
  StBaseConfig,
  StBasePromptOrder,
  StBaseResponseConfig,
} from "@shared/types/instructions";

type ResolvedDepthInsertion = {
  depth: number;
  role: "system" | "user" | "assistant";
  order: number;
  content: string;
};

export type ResolvedStBaseInstruction = {
  systemPrompt: string;
  preHistorySystemMessages: string[];
  postHistorySystemMessages: string[];
  depthInsertions: ResolvedDepthInsertion[];
  derivedSettings: Record<string, unknown>;
  usedPromptIdentifiers: string[];
};

function resolvePreferredPromptOrderEntries(
  promptOrder: StBasePromptOrder[]
): Array<{ identifier: string; enabled: boolean }> {
  if (promptOrder.length === 0) return [];
  const preferred =
    promptOrder.find(
      (item) => item.character_id === SILLY_TAVERN_PREFERRED_CHARACTER_ID
    ) ?? promptOrder[0];
  return preferred.order;
}

function resolveDynamicPromptContent(params: {
  identifier: string;
  context: InstructionRenderContext;
}): string {
  const context = params.context;
  const firstMessageExample =
    typeof context.mesExamples === "string"
      ? context.mesExamples
      : typeof context.mesExamplesRaw === "string"
        ? context.mesExamplesRaw
        : "";

  switch (params.identifier) {
    case "worldInfoBefore":
      return context.wiBefore ?? context.loreBefore ?? context.anchorBefore ?? "";
    case "worldInfoAfter":
      return context.wiAfter ?? context.loreAfter ?? context.anchorAfter ?? "";
    case "charDescription":
      return context.description ?? "";
    case "charPersonality":
      return context.personality ?? "";
    case "scenario":
      return context.scenario ?? "";
    case "personaDescription":
      return context.persona ?? "";
    case "dialogueExamples":
      return firstMessageExample;
    default:
      return "";
  }
}

function toGatewaySettingsFromResponseConfig(
  config: StBaseResponseConfig
): Record<string, unknown> {
  const settings: Record<string, unknown> = {};

  if (typeof config.temperature === "number") settings.temperature = config.temperature;
  if (typeof config.top_p === "number") settings.top_p = config.top_p;
  if (typeof config.top_k === "number") settings.top_k = config.top_k;
  if (typeof config.top_a === "number") settings.top_a = config.top_a;
  if (typeof config.min_p === "number") settings.min_p = config.min_p;
  if (typeof config.repetition_penalty === "number") {
    settings.repetition_penalty = config.repetition_penalty;
  }
  if (typeof config.frequency_penalty === "number") {
    settings.frequency_penalty = config.frequency_penalty;
  }
  if (typeof config.presence_penalty === "number") {
    settings.presence_penalty = config.presence_penalty;
  }
  if (typeof config.openai_max_tokens === "number") {
    settings.maxTokens = config.openai_max_tokens;
  }
  if (typeof config.seed === "number") settings.seed = config.seed;
  if (typeof config.n === "number") settings.n = config.n;
  if (typeof config.reasoning_effort === "string") {
    settings.reasoning_effort = config.reasoning_effort;
  }
  if (typeof config.verbosity === "string") settings.verbosity = config.verbosity;
  if (typeof config.enable_web_search === "boolean") {
    settings.enable_web_search = config.enable_web_search;
  }
  if (typeof config.stream_openai === "boolean") {
    settings.stream = config.stream_openai;
  }

  return settings;
}

async function renderPromptContent(params: {
  identifier: string;
  stBase: StBaseConfig;
  context: InstructionRenderContext;
}): Promise<{
  content: string;
  role: "system" | "user" | "assistant";
  absolute: boolean;
  depth: number;
  order: number;
} | null> {
  const prompt = cloneStPromptWithDefaults(
    params.stBase.prompts.find((item) => item.identifier === params.identifier) ?? {
      identifier: params.identifier,
    }
  );

  const rawContent =
    typeof prompt.content === "string" && prompt.content.trim().length > 0
      ? prompt.content
      : resolveDynamicPromptContent({
          identifier: params.identifier,
          context: params.context,
        });

  if (!rawContent.trim()) return null;

  const rendered = await renderLiquidTemplate({
    templateText: rawContent,
    context: params.context,
  });
  const content = rendered.trim();
  if (!content) return null;

  return {
    content,
    role: prompt.role ?? "system",
    absolute:
      prompt.injection_position === ST_PROMPT_INJECTION_POSITION.IN_CHAT,
    depth: prompt.injection_depth ?? ST_PROMPT_DEFAULT_DEPTH,
    order: prompt.injection_order ?? ST_PROMPT_DEFAULT_ORDER,
  };
}

export async function resolveStBaseInstructionRuntime(params: {
  stBase: StBaseConfig;
  context: InstructionRenderContext;
}): Promise<ResolvedStBaseInstruction> {
  const selectedOrder = resolvePreferredPromptOrderEntries(
    params.stBase.promptOrder
  );
  const fallbackOrder =
    selectedOrder.length > 0
      ? selectedOrder
      : params.stBase.prompts.map((item) => ({
          identifier: item.identifier,
          enabled: true,
        }));

  const mainOrderIndex = fallbackOrder.findIndex(
    (item) => item.enabled && item.identifier === "main"
  );
  const mainPrompt =
    mainOrderIndex >= 0
      ? cloneStPromptWithDefaults(
          params.stBase.prompts.find((item) => item.identifier === "main") ?? {
            identifier: "main",
          }
        )
      : null;
  const mainIsAbsolute =
    mainPrompt?.injection_position === ST_PROMPT_INJECTION_POSITION.IN_CHAT;

  const preHistory: string[] = [];
  const postHistory: string[] = [];
  const depthInsertions: ResolvedDepthInsertion[] = [];
  const usedPromptIdentifiers: string[] = [];
  let afterHistory = false;

  for (const orderEntry of fallbackOrder) {
    if (!orderEntry.enabled) continue;
    const identifier = orderEntry.identifier;

    if (identifier === "chatHistory") {
      afterHistory = true;
      usedPromptIdentifiers.push(identifier);
      continue;
    }

    const rendered = await renderPromptContent({
      identifier,
      stBase: params.stBase,
      context: params.context,
    });
    if (!rendered) continue;
    usedPromptIdentifiers.push(identifier);

    if (mainIsAbsolute && !rendered.absolute && mainPrompt) {
      depthInsertions.push({
        depth: mainPrompt.injection_depth ?? ST_PROMPT_DEFAULT_DEPTH,
        role: rendered.role,
        order: mainPrompt.injection_order ?? ST_PROMPT_DEFAULT_ORDER,
        content: rendered.content,
      });
      continue;
    }

    if (rendered.absolute) {
      depthInsertions.push({
        depth: rendered.depth,
        role: rendered.role,
        order: rendered.order,
        content: rendered.content,
      });
      continue;
    }

    if (afterHistory) postHistory.push(rendered.content);
    else preHistory.push(rendered.content);
  }

  let systemPrompt = "";
  let preHistorySystemMessages: string[] = [];
  let postHistorySystemMessages = [...postHistory];

  if (!mainIsAbsolute) {
    if (preHistory.length > 0) {
      systemPrompt = preHistory[0];
      preHistorySystemMessages = preHistory.slice(1);
    } else if (postHistory.length > 0) {
      systemPrompt = postHistory[0];
      postHistorySystemMessages = postHistory.slice(1);
    }
  }

  return {
    systemPrompt,
    preHistorySystemMessages,
    postHistorySystemMessages,
    depthInsertions,
    derivedSettings: toGatewaySettingsFromResponseConfig(
      params.stBase.responseConfig
    ),
    usedPromptIdentifiers,
  };
}
