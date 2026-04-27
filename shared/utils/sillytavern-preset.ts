const SILLY_TAVERN_ROOT_HINT_KEYS = [
  "chat_completion_source",
  "openai_model",
  "claude_model",
  "openrouter_model",
  "google_model",
  "mistralai_model",
  "custom_model",
  "custom_url",
  "temperature",
  "openai_max_tokens",
] as const;

export const SILLY_TAVERN_PROMPT_IDENTIFIER_PATTERN = /^[A-Za-z0-9._-]+$/;

export const SILLY_TAVERN_PREFERRED_CHARACTER_ID = 100001;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(
  value: Record<string, unknown>,
  key: string
): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && Number.isFinite(value);
}

function isValidPromptObject(value: unknown): boolean {
  return isPlainObject(value) && isNonEmptyString(value.identifier);
}

function isValidPromptOrderObject(value: unknown): boolean {
  return isPlainObject(value) && isFiniteInteger(value.character_id);
}

export function getSillyTavernPresetValidationError(input: unknown): string | null {
  if (!isPlainObject(input)) {
    return "Preset must be a plain JSON object.";
  }

  if (input.type === "talespinner.instruction") {
    return "TaleSpinner instruction export is not a SillyTavern preset.";
  }

  if (!Array.isArray(input.prompts)) {
    return 'SillyTavern preset must contain a "prompts" array.';
  }

  if (!Array.isArray(input.prompt_order)) {
    return 'SillyTavern preset must contain a "prompt_order" array.';
  }

  if (!input.prompts.some(isValidPromptObject)) {
    return 'SillyTavern preset must contain at least one prompt with a non-empty "identifier".';
  }

  if (!input.prompt_order.some(isValidPromptOrderObject)) {
    return 'SillyTavern preset must contain at least one prompt_order item with an integer "character_id".';
  }

  const hasRootHint = SILLY_TAVERN_ROOT_HINT_KEYS.some((key) => hasOwn(input, key));
  if (!hasRootHint) {
    return "SillyTavern preset must contain at least one known root hint field.";
  }

  return null;
}

export function isSillyTavernPreset(
  input: unknown
): input is Record<string, unknown> {
  return getSillyTavernPresetValidationError(input) === null;
}

export function isValidSillyTavernPromptIdentifier(identifier: string): boolean {
  return SILLY_TAVERN_PROMPT_IDENTIFIER_PATTERN.test(identifier);
}

