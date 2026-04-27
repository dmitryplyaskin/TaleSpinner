import { runtimeError } from "./errors";

import type { HelperDefinition, HelperInvocation } from "../types";

function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || typeof value === "undefined") return "";
  return String(value);
}

function asPositiveInteger(value: unknown): number | null {
  const raw = typeof value === "string" && value.trim().length > 0 ? Number(value) : value;
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  const normalized = Math.floor(raw);
  return normalized > 0 ? normalized : null;
}

function approxTokensByChars(chars: number): number {
  return chars <= 0 ? 0 : Math.ceil(Math.floor(chars) / 4);
}

function conversationalMessages(messages: Array<{ role: string; content: string }>) {
  return messages.filter((message) => message.role === "user" || message.role === "assistant");
}

function recentMessagesByTokenLimit(
  messages: Array<{ role: string; content: string }>,
  tokenLimit: number
): Array<{ role: string; content: string }> {
  if (tokenLimit <= 0) return [];
  const selected: Array<{ role: string; content: string }> = [];
  let total = 0;

  for (let idx = messages.length - 1; idx >= 0; idx -= 1) {
    const message = messages[idx];
    if (!message) continue;
    selected.push(message);
    total += approxTokensByChars(message.content.length);
    if (total >= tokenLimit) break;
  }

  selected.reverse();
  return selected;
}

function formatMessages(messages: Array<{ role: string; content: string }>): string {
  return messages.map((message) => `${message.role}: ${message.content}`).join("\n");
}

function clampRng(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value >= 1) return 0.999_999_999_999;
  return value;
}

const helpers: Record<string, HelperDefinition> = {
  contains: ({ args }) => {
    const [text, needle, flags] = args;
    const haystack = asString(text);
    const rawNeedle = asString(needle);
    if (rawNeedle.length === 0) return false;
    if (typeof flags === "string" && flags.length > 0) {
      return new RegExp(rawNeedle, flags).test(haystack);
    }
    return haystack.includes(rawNeedle);
  },
  match: ({ args }) => {
    const [text, pattern, flags] = args;
    return new RegExp(asString(pattern), typeof flags === "string" ? flags : "").test(
      asString(text)
    );
  },
  lower: ({ args }) => asString(args[0]).toLowerCase(),
  upper: ({ args }) => asString(args[0]).toUpperCase(),
  trimText: ({ args }) => asString(args[0]).trim(),
  size: ({ args }) => {
    const value = args[0];
    if (Array.isArray(value) || typeof value === "string") return value.length;
    if (value && typeof value === "object") return Object.keys(value).length;
    return 0;
  },
  empty: ({ args }) => {
    const value = args[0];
    if (value === null || typeof value === "undefined") return true;
    if (typeof value === "string") return value.length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "object") return Object.keys(value).length === 0;
    return false;
  },
  coalesce: ({ args }) => args.find((value) => value !== null && typeof value !== "undefined") ?? null,
  json: ({ args }) => JSON.stringify(args[0]),
  outlet: ({ args, context }) => {
    const key = asString(args[0]);
    return context.outlet?.[key] ?? "";
  },
  pickRandom: ({ args, options }) => {
    if (args.length === 0) return null;
    const idx = Math.floor(clampRng(options.rng()) * args.length);
    return args[idx] ?? args[0] ?? null;
  },
  recentMessages: ({ args, context }) => {
    const count = asPositiveInteger(args[0]);
    if (!count) return [];
    return conversationalMessages(context.messages).slice(-count);
  },
  recentMessagesText: ({ args, context }) => {
    const count = asPositiveInteger(args[0]);
    if (!count) return "";
    return formatMessages(conversationalMessages(context.messages).slice(-count));
  },
  recentMessagesByContextTokens: ({ args, context }) => {
    const limit = asPositiveInteger(args[0]);
    if (!limit) return [];
    return recentMessagesByTokenLimit(conversationalMessages(context.messages), limit);
  },
  recentMessagesByContextTokensText: ({ args, context }) => {
    const limit = asPositiveInteger(args[0]);
    if (!limit) return "";
    return formatMessages(recentMessagesByTokenLimit(conversationalMessages(context.messages), limit));
  },
};

export function invokeHelper(name: string, input: HelperInvocation): unknown {
  const helper = helpers[name];
  if (!helper) {
    throw runtimeError("UNKNOWN_HELPER", `Unknown helper: ${name}`, { helper: name });
  }
  try {
    return helper(input);
  } catch (error) {
    if (error instanceof Error && "code" in error) throw error;
    throw runtimeError("HELPER_ERROR", error instanceof Error ? error.message : String(error), {
      helper: name,
    });
  }
}
