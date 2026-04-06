import { describe, expect, test } from "vitest";

import {
  createStBaseConfigFromPreset,
  detectStChatCompletionPreset,
  loadBuiltInSillyTavernPreset,
  resolveStBaseInstructionRuntime,
  stripSensitiveFieldsFromPreset,
} from "./instruction-st-base";

describe("instruction-st-base", () => {
  test("parses ST Default.json compatible preset shape", () => {
    const rawDefault = `{
      "chat_completion_source": "openai",
      "openai_model": "gpt-4-turbo",
      "temperature": 1,
      "top_p": 1,
      "openai_max_tokens": 300,
      "stream_openai": true,
      "prompts": [
        { "identifier": "main", "name": "Main Prompt", "role": "system", "content": "Write {{char}}", "system_prompt": true },
        { "identifier": "chatHistory", "name": "Chat History", "system_prompt": true },
        { "identifier": "jailbreak", "name": "Post-History Instructions", "role": "system", "content": "", "system_prompt": true }
      ],
      "prompt_order": [
        {
          "character_id": 100001,
          "order": [
            { "identifier": "main", "enabled": true },
            { "identifier": "chatHistory", "enabled": true },
            { "identifier": "jailbreak", "enabled": true }
          ]
        }
      ],
      "extensions": {}
    }`;

    const parsed = JSON.parse(rawDefault) as Record<string, unknown>;
    expect(detectStChatCompletionPreset(parsed)).toBe(true);

    const normalized = createStBaseConfigFromPreset({
      preset: parsed,
      fileName: "Default.json",
      sensitiveImportMode: "keep",
    });

    expect(normalized.prompts.length).toBe(3);
    expect(normalized.promptOrder.length).toBe(1);
    expect(normalized.prompts[0]).toEqual(
      expect.objectContaining({
        injection_position: 0,
        injection_depth: 4,
        injection_order: 100,
      })
    );
    expect(normalized.responseConfig).toMatchObject({
      temperature: 1,
      top_p: 1,
      openai_max_tokens: 300,
      stream_openai: true,
    });
    expect(
      Object.prototype.hasOwnProperty.call(normalized.responseConfig, "openai_model")
    ).toBe(false);
  });

  test("detects ST chat completion preset shape", () => {
    expect(
      detectStChatCompletionPreset({
        chat_completion_source: "openai",
        openai_model: "gpt-4-turbo",
        prompts: [{ identifier: "main" }],
        prompt_order: [{ character_id: 100001, order: [] }],
      })
    ).toBe(true);

    expect(
      detectStChatCompletionPreset({
        type: "talespinner.instruction",
      })
    ).toBe(false);

    expect(
      detectStChatCompletionPreset({
        temperature: 0.8,
      })
    ).toBe(false);

    expect(
      detectStChatCompletionPreset({
        openai_model: "gpt-4-turbo",
        prompts: [{ identifier: "main" }],
      })
    ).toBe(false);
  });

  test("loads built-in Default.json preset", async () => {
    const builtInPreset = await loadBuiltInSillyTavernPreset();

    expect(builtInPreset.fileName).toBe("Default.json");
    expect(detectStChatCompletionPreset(builtInPreset.preset)).toBe(true);

    const normalized = createStBaseConfigFromPreset({
      preset: builtInPreset.preset,
      fileName: builtInPreset.fileName,
      sensitiveImportMode: "keep",
    });

    expect(normalized.prompts.length).toBeGreaterThan(0);
    expect(normalized.promptOrder.length).toBeGreaterThan(0);
    expect(normalized.rawPreset.prompts).toEqual(builtInPreset.preset.prompts);
    expect(normalized.rawPreset.prompt_order).toEqual(
      builtInPreset.preset.prompt_order
    );
  });

  test("strips sensitive fields", () => {
    const input = {
      custom_url: "https://proxy.local/v1",
      reverse_proxy: "https://proxy.local",
      temperature: 0.8,
    };

    const output = stripSensitiveFieldsFromPreset(input);
    expect(output.temperature).toBe(0.8);
    expect(Object.prototype.hasOwnProperty.call(output, "custom_url")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(output, "reverse_proxy")).toBe(false);
  });

  test("normalizes preset with sensitive mode and extracts response config", () => {
    const preset = {
      chat_completion_source: "openai",
      temperature: 0.8,
      top_p: 0.9,
      openai_max_tokens: 512,
      openai_model: "gpt-4-turbo",
      custom_url: "https://proxy.local/v1",
      prompts: [{ identifier: "main", role: "system", content: "Main" }],
      prompt_order: [{ character_id: 100001, order: [{ identifier: "main", enabled: true }] }],
    };

    const removed = createStBaseConfigFromPreset({
      preset,
      fileName: "Default.json",
      sensitiveImportMode: "remove",
    });
    expect(removed.importInfo.fileName).toBe("Default.json");
    expect(Object.prototype.hasOwnProperty.call(removed.rawPreset, "custom_url")).toBe(false);
    expect(removed.responseConfig.temperature).toBe(0.8);
    expect(removed.responseConfig.top_p).toBe(0.9);
    expect(removed.responseConfig.openai_max_tokens).toBe(512);
    expect(
      Object.prototype.hasOwnProperty.call(removed.responseConfig, "openai_model")
    ).toBe(false);

    const kept = createStBaseConfigFromPreset({
      preset,
      fileName: "Default.json",
      sensitiveImportMode: "keep",
    });
    expect(kept.rawPreset.custom_url).toBe("https://proxy.local/v1");
  });

  test("uses prompt_order with preferred character id and splits pre/post history prompts", async () => {
    const stBase = createStBaseConfigFromPreset({
      preset: {
        prompts: [
          {
            identifier: "main",
            role: "system",
            content: "Main {{char.name}}",
          },
          {
            identifier: "worldInfoBefore",
            role: "system",
            content: "",
          },
          {
            identifier: "jailbreak",
            role: "system",
            content: "Post {{user.name}}",
          },
        ],
        prompt_order: [
          {
            character_id: 100000,
            order: [
              { identifier: "main", enabled: false },
              { identifier: "jailbreak", enabled: true },
            ],
          },
          {
            character_id: 100001,
            order: [
              { identifier: "main", enabled: true },
              { identifier: "worldInfoBefore", enabled: true },
              { identifier: "chatHistory", enabled: true },
              { identifier: "jailbreak", enabled: true },
            ],
          },
        ],
        temperature: 0.65,
        openai_max_tokens: 333,
      },
      fileName: "Default.json",
      sensitiveImportMode: "keep",
    });

    const resolved = await resolveStBaseInstructionRuntime({
      stBase,
      context: {
        char: { name: "Lilly" },
        user: { name: "Dima" },
        chat: {},
        messages: [],
        rag: {},
        art: {},
        now: new Date("2026-02-13T00:00:00.000Z").toISOString(),
        wiBefore: "WI BEFORE",
      },
    });

    expect(resolved.systemPrompt).toBe("Main Lilly");
    expect(resolved.preHistorySystemMessages).toEqual(["WI BEFORE"]);
    expect(resolved.postHistorySystemMessages).toEqual(["Post Dima"]);
    expect(resolved.derivedSettings).toMatchObject({
      temperature: 0.65,
      maxTokens: 333,
    });
    expect(resolved.usedPromptIdentifiers).toEqual([
      "main",
      "worldInfoBefore",
      "chatHistory",
      "jailbreak",
    ]);
  });

  test("collects in-chat prompts as ordered depth insertions", async () => {
    const stBase = createStBaseConfigFromPreset({
      preset: {
        chat_completion_source: "openai",
        prompts: [
          {
            identifier: "main",
            role: "system",
            content: "Main {{char.name}}",
          },
          {
            identifier: "authorNote",
            role: "user",
            content: "Note {{user.name}}",
            injection_position: 1,
            injection_depth: 2,
            injection_order: 80,
          },
        ],
        prompt_order: [
          {
            character_id: 100001,
            order: [
              { identifier: "main", enabled: true },
              { identifier: "chatHistory", enabled: true },
              { identifier: "authorNote", enabled: true },
            ],
          },
        ],
      },
      fileName: "Default.json",
      sensitiveImportMode: "keep",
    });

    const resolved = await resolveStBaseInstructionRuntime({
      stBase,
      context: {
        char: { name: "Lilly" },
        user: { name: "Dima" },
        chat: {},
        messages: [],
        rag: {},
        art: {},
        now: new Date("2026-02-13T00:00:00.000Z").toISOString(),
      },
    });

    expect(resolved.systemPrompt).toBe("Main Lilly");
    expect(resolved.depthInsertions).toEqual([
      { depth: 2, role: "user", order: 80, content: "Note Dima" },
    ]);
  });

  test("maps relative prompts around absolute main prompt into the same in-chat bucket", async () => {
    const stBase = createStBaseConfigFromPreset({
      preset: {
        chat_completion_source: "openai",
        prompts: [
          {
            identifier: "main",
            role: "system",
            content: "Main {{char.name}}",
            injection_position: 1,
            injection_depth: 1,
            injection_order: 100,
          },
          {
            identifier: "nsfw",
            role: "system",
            content: "Before main",
          },
          {
            identifier: "jailbreak",
            role: "assistant",
            content: "After main",
          },
        ],
        prompt_order: [
          {
            character_id: 100001,
            order: [
              { identifier: "nsfw", enabled: true },
              { identifier: "main", enabled: true },
              { identifier: "chatHistory", enabled: true },
              { identifier: "jailbreak", enabled: true },
            ],
          },
        ],
      },
      fileName: "Default.json",
      sensitiveImportMode: "keep",
    });

    const resolved = await resolveStBaseInstructionRuntime({
      stBase,
      context: {
        char: { name: "Lilly" },
        user: { name: "Dima" },
        chat: {},
        messages: [],
        rag: {},
        art: {},
        now: new Date("2026-02-13T00:00:00.000Z").toISOString(),
      },
    });

    expect(resolved.systemPrompt).toBe("");
    expect(resolved.preHistorySystemMessages).toEqual([]);
    expect(resolved.postHistorySystemMessages).toEqual([]);
    expect(resolved.depthInsertions).toEqual([
      { depth: 1, role: "system", order: 100, content: "Before main" },
      { depth: 1, role: "system", order: 100, content: "Main Lilly" },
      { depth: 1, role: "assistant", order: 100, content: "After main" },
    ]);
  });
});
