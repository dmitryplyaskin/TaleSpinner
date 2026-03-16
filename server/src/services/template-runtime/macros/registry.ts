import { parseExpr } from "../expr/parser";
import { runtimeError } from "../runtime/errors";
import { lowerTemplate, parseTemplate } from "../template/compiler";

import type { CompiledMacroDefinition, MacroDefinition, MacroRegistry } from "../types";

export function validateMacro(definition: MacroDefinition): void {
  if (!definition.name || definition.name.trim().length === 0) {
    throw runtimeError("INVALID_MACRO", "Macro name is required");
  }
  if (definition.kind !== "value" && definition.kind !== "template") {
    throw runtimeError("INVALID_MACRO", `Unsupported macro kind: ${definition.kind}`);
  }

  const seen = new Set<string>();
  for (const param of definition.params) {
    if (!param.name || param.name.trim().length === 0) {
      throw runtimeError("INVALID_MACRO", "Macro param name is required", { macro: definition.name });
    }
    if (seen.has(param.name)) {
      throw runtimeError("INVALID_MACRO", `Duplicate macro param: ${param.name}`, {
        macro: definition.name,
      });
    }
    seen.add(param.name);
  }
}

export function createMacroRegistry(definitions: MacroDefinition[] = []): MacroRegistry {
  const source = new Map<string, MacroDefinition>();
  const compiled = new Map<string, CompiledMacroDefinition>();

  for (const definition of definitions) {
    validateMacro(definition);
    if (source.has(definition.name)) {
      throw runtimeError("INVALID_MACRO", `Duplicate macro name: ${definition.name}`, {
        macro: definition.name,
      });
    }
    source.set(definition.name, {
      ...definition,
      engine: "native_v1",
    });
  }

  return {
    definitions: source,
    get(name: string) {
      return source.get(name);
    },
    getCompiled(name: string) {
      const existing = compiled.get(name);
      if (existing) return existing;
      const definition = source.get(name);
      if (!definition) return undefined;

      const built =
        definition.kind === "value"
          ? {
              name: definition.name,
              kind: "value" as const,
              params: definition.params,
              body: parseExpr(definition.body),
            }
          : {
              name: definition.name,
              kind: "template" as const,
              params: definition.params,
              body: lowerTemplate(parseTemplate(definition.body)),
            };
      compiled.set(name, built);
      return built;
    },
  };
}
