import {
  ST_PROMPT_DEFAULT_DEPTH,
  ST_PROMPT_DEFAULT_ORDER,
  ST_PROMPT_INJECTION_POSITION,
} from "../types/instructions";

import type {
  StBasePrompt,
  StBasePromptInjectionPosition,
  StBasePromptOrder,
  StBasePromptRole,
} from "../types/instructions";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNonNegativeInteger(
  value: unknown,
  fallback: number
): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return fallback;
  }
  return Math.floor(value);
}

export function normalizeStPromptRole(
  value: unknown
): StBasePromptRole | undefined {
  if (value === "system" || value === "user" || value === "assistant") {
    return value;
  }
  return undefined;
}

export function normalizeStPromptInjectionPosition(
  value: unknown
): StBasePromptInjectionPosition {
  return value === ST_PROMPT_INJECTION_POSITION.IN_CHAT
    ? ST_PROMPT_INJECTION_POSITION.IN_CHAT
    : ST_PROMPT_INJECTION_POSITION.RELATIVE;
}

export function normalizeStPrompt(
  value: unknown
): StBasePrompt | null {
  if (!isRecord(value)) return null;
  const identifier = asString(value.identifier);
  if (!identifier) return null;

  const prompt: StBasePrompt = {
    identifier,
    injection_position: normalizeStPromptInjectionPosition(
      value.injection_position
    ),
    injection_depth: toNonNegativeInteger(
      value.injection_depth,
      ST_PROMPT_DEFAULT_DEPTH
    ),
    injection_order: toNonNegativeInteger(
      value.injection_order,
      ST_PROMPT_DEFAULT_ORDER
    ),
  };

  const name = asString(value.name);
  if (name) prompt.name = name;

  const role = normalizeStPromptRole(value.role);
  if (role) prompt.role = role;

  if (typeof value.content === "string") prompt.content = value.content;
  if (typeof value.system_prompt === "boolean") {
    prompt.system_prompt = value.system_prompt;
  }
  if (typeof value.marker === "boolean") {
    prompt.marker = value.marker;
  }

  return prompt;
}

export function normalizeStPrompts(input: unknown): StBasePrompt[] {
  if (!Array.isArray(input)) return [];
  return input
    .map(normalizeStPrompt)
    .filter((item): item is StBasePrompt => Boolean(item));
}

export function cloneStPromptWithDefaults(prompt: StBasePrompt): StBasePrompt {
  return {
    ...prompt,
    injection_position: normalizeStPromptInjectionPosition(
      prompt.injection_position
    ),
    injection_depth: toNonNegativeInteger(
      prompt.injection_depth,
      ST_PROMPT_DEFAULT_DEPTH
    ),
    injection_order: toNonNegativeInteger(
      prompt.injection_order,
      ST_PROMPT_DEFAULT_ORDER
    ),
  };
}

export function normalizeStPromptOrderEntry(
  value: unknown
): { identifier: string; enabled: boolean } | null {
  if (!isRecord(value)) return null;
  const identifier = asString(value.identifier);
  if (!identifier) return null;
  return {
    identifier,
    enabled: typeof value.enabled === "boolean" ? value.enabled : true,
  };
}

export function normalizeStPromptOrderItem(
  value: unknown
): StBasePromptOrder | null {
  if (!isRecord(value)) return null;
  const rawCharacterId = value.character_id;
  const characterId =
    typeof rawCharacterId === "number" && Number.isFinite(rawCharacterId)
      ? Math.floor(rawCharacterId)
      : null;
  if (characterId === null) return null;

  const rawOrder = Array.isArray(value.order) ? value.order : [];
  const order = rawOrder
    .map(normalizeStPromptOrderEntry)
    .filter(
      (entry): entry is { identifier: string; enabled: boolean } =>
        Boolean(entry)
    );

  return {
    character_id: characterId,
    order,
  };
}

export function normalizeStPromptOrder(input: unknown): StBasePromptOrder[] {
  if (!Array.isArray(input)) return [];
  return input
    .map(normalizeStPromptOrderItem)
    .filter((item): item is StBasePromptOrder => Boolean(item));
}
