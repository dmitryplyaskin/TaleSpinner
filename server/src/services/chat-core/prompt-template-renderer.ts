import { Liquid } from "liquidjs";

import {
  INTERNAL_MESSAGE_HELPER_FILTER,
  preprocessSillyTavernTemplateSyntax,
  type SillyTavernTemplateVariables,
  stripSillyTavernTrimSentinel,
} from "./sillytavern-template-syntax";

export interface InstructionRenderContext {
  char: unknown;
  user: unknown;
  chat: unknown;
  messages: Array<{ role: string; content: string }>;
  rag: unknown;
  worldInfo?: {
    activatedCount: number;
    activatedEntries: Array<{
      hash: string;
      bookId: string;
      bookName: string;
      uid: number;
      comment: string;
      content: string;
      matchedKeys: string[];
      reasons: string[];
    }>;
    warnings: string[];
  };
  // Artifacts materialized as `art.<artifactId>.value/history`.
  // `artByOpId` is a convenience alias for cross-operation references from templates.
  art?: Record<string, unknown>;
  artByOpId?: Record<string, unknown>;
  now: string;

  // --- SillyTavern-like convenience variables (compat layer).
  // These do not replace `char` / `user` objects; they are additional top-level aliases.
  anchorBefore?: string;
  anchorAfter?: string;
  description?: string;
  scenario?: string;
  personality?: string;
  system?: string;
  promptSystem?: string;
  persona?: string;
  wiBefore?: string;
  wiAfter?: string;
  loreBefore?: string;
  loreAfter?: string;
  outlet?: Record<string, string>;
  outletEntries?: Record<string, string[]>;
  anTop?: string[];
  anBottom?: string[];
  emTop?: string[];
  emBottom?: string[];
  mesExamples?: string;
  mesExamplesRaw?: string;
  lastUserMessage?: string;
  lastAssistantMessage?: string;
}

type RenderableMessage = { role: string; content: string };

const DEFAULT_MAX_PASSES = 5;
const DEFAULT_MAX_OUTPUT_CHARS = 200_000;

function sanitizeRenderableMessages(messages: unknown): RenderableMessage[] {
  return Array.isArray(messages)
    ? messages.filter(
        (item): item is RenderableMessage =>
          typeof item?.role === "string" && typeof item?.content === "string"
      )
    : [];
}

function isConversationRole(role: string): role is "user" | "assistant" {
  return role === "user" || role === "assistant";
}

function getConversationalMessages(messages: RenderableMessage[]): RenderableMessage[] {
  return messages.filter((message) => isConversationRole(message.role));
}

function approxTokensByChars(chars: number): number {
  if (!Number.isFinite(chars)) return 0;
  const normalized = Math.max(0, Math.floor(chars));
  if (normalized === 0) return 0;
  return Math.ceil(normalized / 4);
}

function normalizePositiveIntegerArg(value: unknown): number | null {
  const raw =
    typeof value === "string" && value.trim().length > 0 ? Number(value.trim()) : value;
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  const normalized = Math.floor(raw);
  return normalized > 0 ? normalized : null;
}

function formatMessagesAsText(messages: RenderableMessage[]): string {
  return messages.map((message) => `${message.role}: ${message.content}`).join("\n");
}

function selectRecentMessages(
  messages: RenderableMessage[],
  count: number
): RenderableMessage[] {
  if (count <= 0) return [];
  return messages.slice(-count);
}

function selectRecentMessagesByTokenLimit(
  messages: RenderableMessage[],
  tokenLimit: number
): RenderableMessage[] {
  if (tokenLimit <= 0) return [];
  const selected: RenderableMessage[] = [];
  let accumulatedTokens = 0;

  for (let idx = messages.length - 1; idx >= 0; idx -= 1) {
    const message = messages[idx];
    if (!message) continue;
    selected.push(message);
    accumulatedTokens += approxTokensByChars(message.content.length);
    if (accumulatedTokens >= tokenLimit) break;
  }

  selected.reverse();
  return selected;
}

function resolveRecentMessagesHelper(
  helperName: unknown,
  rawArg: unknown,
  messages: RenderableMessage[]
): RenderableMessage[] | string {
  const normalizedHelperName = typeof helperName === "string" ? helperName.trim() : "";
  const normalizedArg = normalizePositiveIntegerArg(rawArg);
  const emptyArrayResult: RenderableMessage[] = [];
  const emptyTextResult = "";
  const shouldReturnText = normalizedHelperName.endsWith("Text");
  if (!normalizedArg) {
    return shouldReturnText ? emptyTextResult : emptyArrayResult;
  }

  const conversationalMessages = getConversationalMessages(messages);
  const selectedMessages =
    normalizedHelperName === "recentMessages"
      ? selectRecentMessages(conversationalMessages, normalizedArg)
      : normalizedHelperName === "recentMessagesText"
        ? selectRecentMessages(conversationalMessages, normalizedArg)
        : normalizedHelperName === "recentMessagesByContextTokens"
          ? selectRecentMessagesByTokenLimit(conversationalMessages, normalizedArg)
          : normalizedHelperName === "recentMessagesByContextTokensText"
            ? selectRecentMessagesByTokenLimit(conversationalMessages, normalizedArg)
            : null;

  if (!selectedMessages) {
    return shouldReturnText ? emptyTextResult : emptyArrayResult;
  }

  return shouldReturnText ? formatMessagesAsText(selectedMessages) : selectedMessages;
}

function registerInternalFilters(liquid: Liquid): Liquid {
  liquid.registerFilter(
    INTERNAL_MESSAGE_HELPER_FILTER,
    function (_input: unknown, helperName: unknown, rawArg: unknown) {
      const filterContext = this as {
        context?: { environments?: { messages?: unknown } };
      };
      const messages = sanitizeRenderableMessages(
        filterContext.context?.environments?.messages
      );
      return resolveRecentMessagesHelper(helperName, rawArg, messages);
    }
  );
  liquid.registerFilter("json", (input: unknown) => JSON.stringify(input));
  return liquid;
}

const engine = registerInternalFilters(
  new Liquid({
    cache: true,
    strictFilters: false,
    strictVariables: false,
  })
);

function normalizeToString(value: unknown): string {
  return typeof value === "string" ? value : String(value);
}

function findLastMessageByRole(
  messages: Array<{ role: string; content: string }>,
  role: "user" | "assistant"
): string {
  for (let idx = messages.length - 1; idx >= 0; idx -= 1) {
    const item = messages[idx];
    if (item?.role !== role) continue;
    return typeof item.content === "string" ? item.content : String(item.content ?? "");
  }
  return "";
}

function withDerivedMessageAliases(
  context: InstructionRenderContext
): InstructionRenderContext {
  const messages = sanitizeRenderableMessages(context.messages);

  // These aliases are derived from effective prompt-visible history.
  // before_main_llm: lastAssistantMessage is the latest assistant message before current user turn.
  // after_main_llm: callers append freshly generated assistant text to messages, so alias points to it.
  return {
    ...context,
    messages,
    lastUserMessage: findLastMessageByRole(messages, "user"),
    lastAssistantMessage: findLastMessageByRole(messages, "assistant"),
  };
}

function mightContainLiquidSyntax(text: string): boolean {
  // Fast heuristic: detect potential Liquid markers.
  return text.includes("{{") || text.includes("{%");
}

export function validateLiquidTemplate(templateText: string): void {
  // Throws on syntax errors. Variables/filters are not strict in v1.
  const preprocessed = preprocessSillyTavernTemplateSyntax(templateText, {
    rng: () => 0,
  });
  engine.parse(preprocessed.text);
}

export async function renderLiquidTemplate(params: {
  templateText: string;
  context: InstructionRenderContext;
  options?: {
    strictVariables?: boolean;
    /**
     * Multi-pass rendering enables "templates inside values".
     * Example: if `user.contentTypeDefault` contains `{{ user.name }}` and
     * you output it via `{{ user.contentTypeDefault }}`, additional passes
     * will resolve the nested tags.
     */
    maxPasses?: number;
    /**
     * Safety valve to avoid runaway memory/CPU on huge outputs.
     * If the rendered output exceeds this limit, recursion stops.
     */
    maxOutputChars?: number;
    /**
     * Optional RNG used by ST-compatible random macros like `{{random::A::B}}`.
     * Useful for deterministic tests.
     */
    rng?: () => number;
    stVariables?: SillyTavernTemplateVariables;
  };
}): Promise<string> {
  const renderEngine = params.options?.strictVariables
    ? registerInternalFilters(
        new Liquid({ cache: true, strictFilters: false, strictVariables: true })
      )
    : engine;
  const renderContext = withDerivedMessageAliases(params.context);
  const maxPasses = params.options?.maxPasses ?? DEFAULT_MAX_PASSES;
  const maxOutputChars = params.options?.maxOutputChars ?? DEFAULT_MAX_OUTPUT_CHARS;
  let sawTrimSentinel = false;

  const firstPassPreprocessed = preprocessSillyTavernTemplateSyntax(params.templateText, {
    rng: params.options?.rng,
    variables: params.options?.stVariables,
  });
  sawTrimSentinel = sawTrimSentinel || firstPassPreprocessed.hasTrimSentinel;

  // Pass 1: render the original template (syntax has typically been validated earlier).
  let current = normalizeToString(
    await renderEngine.parseAndRender(firstPassPreprocessed.text, renderContext)
  );

  // Additional passes: render again only if the output still looks like a template.
  // Important: if the output contains `{{` for non-template reasons (e.g. documentation/code),
  // the next parse may throw вЂ” in that case we stop and return the previous output.
  for (let pass = 2; pass <= maxPasses; pass++) {
    if (!mightContainLiquidSyntax(current)) break;
    if (current.length > maxOutputChars) break;

    try {
      const passPreprocessed = preprocessSillyTavernTemplateSyntax(current, {
        rng: params.options?.rng,
        variables: params.options?.stVariables,
      });
      sawTrimSentinel = sawTrimSentinel || passPreprocessed.hasTrimSentinel;
      const next = normalizeToString(
        await renderEngine.parseAndRender(passPreprocessed.text, renderContext)
      );
      if (next === current) break;
      current = next;
    } catch {
      break;
    }
  }

  if (sawTrimSentinel) {
    return stripSillyTavernTrimSentinel(current);
  }

  return current;
}

