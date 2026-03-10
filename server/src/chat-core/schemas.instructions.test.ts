import { describe, expect, test } from "vitest";

import {
  createInstructionBodySchema,
  updateInstructionBodySchema,
} from "./schemas";

describe("instruction schemas", () => {
  test("accepts basic instruction payload", () => {
    const parsed = createInstructionBodySchema.safeParse({
      name: "Basic",
      kind: "basic",
      templateText: "{{char.name}}",
    });

    expect(parsed.success).toBe(true);
  });

  test("accepts st_base instruction payload", () => {
    const parsed = createInstructionBodySchema.safeParse({
      name: "ST",
      kind: "st_base",
      stBase: {
        rawPreset: {},
        prompts: [{ identifier: "main", content: "Hello" }],
        promptOrder: [
          {
            character_id: 100001,
            order: [{ identifier: "main", enabled: true }],
          },
        ],
        responseConfig: {},
        importInfo: {
          source: "sillytavern",
          fileName: "Default.json",
          importedAt: "2026-03-10T00:00:00.000Z",
        },
      },
    });

    expect(parsed.success).toBe(true);
  });

  test("rejects mixed create payload", () => {
    const parsed = createInstructionBodySchema.safeParse({
      name: "Bad",
      kind: "st_base",
      templateText: "{{char.name}}",
      stBase: {
        rawPreset: {},
        prompts: [],
        promptOrder: [],
        responseConfig: {},
        importInfo: {
          source: "sillytavern",
          fileName: "Default.json",
          importedAt: "2026-03-10T00:00:00.000Z",
        },
      },
    });

    expect(parsed.success).toBe(false);
  });

  test("rejects update payload that omits stBase for st_base-only fields", () => {
    const parsed = updateInstructionBodySchema.safeParse({
      kind: "basic",
      stBase: {
        rawPreset: {},
        prompts: [],
        promptOrder: [],
        responseConfig: {},
        importInfo: {
          source: "sillytavern",
          fileName: "Default.json",
          importedAt: "2026-03-10T00:00:00.000Z",
        },
      },
    });

    expect(parsed.success).toBe(false);
  });
});
