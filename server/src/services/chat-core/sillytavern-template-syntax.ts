export const INTERNAL_MESSAGE_HELPER_FILTER = "__tsMessageHelper";

const RECENT_MESSAGE_HELPER_RE =
  /\b(recentMessages(?:Text|ByContextTokens(?:Text)?)?)\s*\(\s*([^()]*)\s*\)/g;
const LIQUID_SEGMENT_RE = /({{[\s\S]*?}}|{%[\s\S]*?%})/g;
const MACRO_TAG_RE = /{{\s*([^{}]*?)\s*}}/g;
const TRIM_SENTINEL = "__TS_LIQUID_TRIM_SENTINEL__";
const SETVAR_PREFIX = "setvar::";
const GETVAR_PREFIX = "getvar::";

export type SillyTavernTemplateVariables = Record<string, string>;

function sanitizeOutletKey(value: string): string {
  return value.trim().replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function clampRngValue(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 0.999_999_999_999;
  return value;
}

function pickRandomOption(options: string[], rng: () => number): string {
  const idx = Math.floor(clampRngValue(rng()) * options.length);
  return options[idx] ?? options[0] ?? "";
}

function resolveRandomMacro(rawMacroBody: string, rng: () => number): string | null {
  const prefix = "random::";
  if (!rawMacroBody.startsWith(prefix)) return null;
  const tail = rawMacroBody.slice(prefix.length);
  if (!tail) return null;

  const options = tail
    .split("::")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  if (options.length === 0) return null;

  return pickRandomOption(options, rng);
}

function rewriteRecentMessageHelperCalls(templateText: string): string {
  return templateText.replace(LIQUID_SEGMENT_RE, (segment: string) => {
    const isOutputSegment = segment.startsWith("{{") && segment.endsWith("}}");
    const isTagSegment = segment.startsWith("{%") && segment.endsWith("%}");
    if (!isOutputSegment && !isTagSegment) return segment;

    const prefix = segment.slice(0, 2);
    const suffix = segment.slice(-2);
    const inner = segment.slice(2, -2);
    const rewrittenInner = inner.replace(
      RECENT_MESSAGE_HELPER_RE,
      (_match: string, helperName: string, rawArg: string) => {
        const normalizedArg = rawArg.trim().length > 0 ? rawArg.trim() : "nil";
        return `'' | ${INTERNAL_MESSAGE_HELPER_FILTER}: '${helperName}', ${normalizedArg}`;
      }
    );
    return `${prefix}${rewrittenInner}${suffix}`;
  });
}

function parseSetVarMacro(
  macroBody: string
): { key: string; value: string } | null {
  if (!macroBody.startsWith(SETVAR_PREFIX)) return null;
  const tail = macroBody.slice(SETVAR_PREFIX.length);
  const separatorIndex = tail.indexOf("::");
  if (separatorIndex < 0) return null;

  const key = tail.slice(0, separatorIndex).trim();
  if (!key) return null;

  return {
    key,
    value: tail.slice(separatorIndex + 2),
  };
}

function parseGetVarMacro(macroBody: string): string | null {
  if (!macroBody.startsWith(GETVAR_PREFIX)) return null;
  const key = macroBody.slice(GETVAR_PREFIX.length).trim();
  return key.length > 0 ? key : null;
}

export function preprocessSillyTavernTemplateSyntax(
  templateText: string,
  options?: { rng?: () => number; variables?: SillyTavernTemplateVariables }
): {
  text: string;
  hasTrimSentinel: boolean;
} {
  const rng = options?.rng ?? Math.random;
  const variables = options?.variables ?? {};
  let hasTrimSentinel = false;
  const text = rewriteRecentMessageHelperCalls(templateText).replace(
    MACRO_TAG_RE,
    (full: string, rawMacroBody: string) => {
      const macroBody = rawMacroBody.trim();
      if (!macroBody) return full;

      if (macroBody === "trim") {
        hasTrimSentinel = true;
        return TRIM_SENTINEL;
      }

      if (macroBody.startsWith("//")) return "";

      const setVar = parseSetVarMacro(macroBody);
      if (setVar) {
        variables[setVar.key] = setVar.value;
        return "";
      }

      const getVarKey = parseGetVarMacro(macroBody);
      if (getVarKey) return variables[getVarKey] ?? "";

      if (macroBody.startsWith("outlet::")) {
        const rawKey = macroBody.slice("outlet::".length);
        if (!rawKey.trim()) return full;
        return `{{ outlet['${sanitizeOutletKey(rawKey)}'] }}`;
      }

      if (macroBody.startsWith("random::")) {
        const selected = resolveRandomMacro(macroBody, rng);
        return selected !== null ? selected : `{% raw %}${full}{% endraw %}`;
      }

      return full;
    }
  );

  return { text, hasTrimSentinel };
}

function isBlankLine(line: string): boolean {
  return line.trim().length === 0;
}

export function stripSillyTavernTrimSentinel(text: string): string {
  if (!text.includes(TRIM_SENTINEL)) return text;

  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const out: string[] = [];
  let skipLeadingBlankLines = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === TRIM_SENTINEL) {
      while (out.length > 0 && isBlankLine(out[out.length - 1] ?? "")) out.pop();
      skipLeadingBlankLines = true;
      continue;
    }

    if (line.includes(TRIM_SENTINEL)) {
      const replaced = line.split(TRIM_SENTINEL).join("");
      if (!(skipLeadingBlankLines && isBlankLine(replaced))) out.push(replaced);
      if (!isBlankLine(replaced)) skipLeadingBlankLines = false;
      continue;
    }

    if (skipLeadingBlankLines && isBlankLine(line)) continue;
    out.push(line);
    if (!isBlankLine(line)) skipLeadingBlankLines = false;
  }

  return out.join("\n");
}
