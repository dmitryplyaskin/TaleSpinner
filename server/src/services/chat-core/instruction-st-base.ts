import {
  isSillyTavernPreset,
  getSillyTavernPresetValidationError,
} from "@shared/utils/sillytavern-preset";
import {
  normalizeStPromptOrder,
  normalizeStPrompts,
} from "@shared/utils/st-prompts";

import {
  BUILT_IN_SILLY_TAVERN_PRESET,
  BUILT_IN_SILLY_TAVERN_PRESET_FILE_NAME,
} from "./built-in-sillytavern-preset";

export { resolveStBaseInstructionRuntime } from "./st-prompt-runtime";

import type {
  StBaseConfig,
  StBaseResponseConfig,
} from "@shared/types/instructions";

export const ST_SENSITIVE_FIELDS = [
  "reverse_proxy",
  "proxy_password",
  "custom_url",
  "custom_include_body",
  "custom_exclude_body",
  "custom_include_headers",
  "vertexai_region",
  "vertexai_express_project_id",
  "azure_base_url",
  "azure_deployment_name",
] as const;

type SensitiveImportMode = "remove" | "keep";

type StResponseNumericKey =
  | "temperature"
  | "top_p"
  | "top_k"
  | "top_a"
  | "min_p"
  | "repetition_penalty"
  | "frequency_penalty"
  | "presence_penalty"
  | "openai_max_tokens"
  | "seed"
  | "n";

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return value;
}

function toOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

export function detectStChatCompletionPreset(
  input: unknown
): input is Record<string, unknown> {
  return isSillyTavernPreset(input);
}

export function stripSensitiveFieldsFromPreset(
  preset: Record<string, unknown>
): Record<string, unknown> {
  const cloned = structuredClone(preset);
  for (const key of ST_SENSITIVE_FIELDS) {
    delete cloned[key];
  }
  return cloned;
}

function normalizeResponseConfig(
  preset: Record<string, unknown>
): StBaseResponseConfig {
  const responseConfig: StBaseResponseConfig = {};

  const numericKeys: StResponseNumericKey[] = [
    "temperature",
    "top_p",
    "top_k",
    "top_a",
    "min_p",
    "repetition_penalty",
    "frequency_penalty",
    "presence_penalty",
    "openai_max_tokens",
    "seed",
    "n",
  ];

  for (const key of numericKeys) {
    const value = toFiniteNumber(preset[key]);
    if (typeof value === "number") {
      responseConfig[key] = value;
    }
  }

  if (typeof preset.reasoning_effort === "string") {
    responseConfig.reasoning_effort = preset.reasoning_effort;
  }
  if (typeof preset.verbosity === "string") {
    responseConfig.verbosity = preset.verbosity;
  }
  const enableWebSearch = toOptionalBoolean(preset.enable_web_search);
  if (typeof enableWebSearch === "boolean") {
    responseConfig.enable_web_search = enableWebSearch;
  }
  const stream = toOptionalBoolean(preset.stream_openai);
  if (typeof stream === "boolean") {
    responseConfig.stream_openai = stream;
  }

  return responseConfig;
}

export function createStBaseConfigFromPreset(params: {
  preset: Record<string, unknown>;
  fileName: string;
  sensitiveImportMode: SensitiveImportMode;
}): StBaseConfig {
  const validationError = getSillyTavernPresetValidationError(params.preset);
  if (validationError) {
    throw new Error(validationError);
  }

  const rawPreset =
    params.sensitiveImportMode === "remove"
      ? stripSensitiveFieldsFromPreset(params.preset)
      : structuredClone(params.preset);
  const prompts = normalizeStPrompts(rawPreset.prompts);
  const promptOrder = normalizeStPromptOrder(rawPreset.prompt_order);

  return {
    rawPreset,
    prompts,
    promptOrder,
    responseConfig: normalizeResponseConfig(rawPreset),
    importInfo: {
      source: "sillytavern",
      fileName: params.fileName,
      importedAt: new Date().toISOString(),
    },
  };
}

export async function loadBuiltInSillyTavernPreset(): Promise<{
  fileName: string;
  preset: Record<string, unknown>;
}> {
  const parsed = structuredClone(BUILT_IN_SILLY_TAVERN_PRESET) as unknown;
  const validationError = getSillyTavernPresetValidationError(parsed);

  if (validationError || !isSillyTavernPreset(parsed)) {
    throw new Error(
      `Built-in SillyTavern preset is invalid: ${validationError ?? "Unknown validation error."}`
    );
  }

  return {
    fileName: BUILT_IN_SILLY_TAVERN_PRESET_FILE_NAME,
    preset: parsed,
  };
}
