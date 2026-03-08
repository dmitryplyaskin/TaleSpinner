import { describe, expect, test } from "vitest";

import { renderLiquidTemplate, validateLiquidTemplate } from "./prompt-template-renderer";

function makeContext() {
  return {
    char: {},
    user: { name: "Alice", nested: "{{ user.name }}-N" },
    chat: {},
    messages: [],
    rag: {},
    art: {},
    outlet: {
      default: "OUTLET_TEXT",
    },
    now: new Date("2026-02-10T00:00:00.000Z").toISOString(),
  };
}

describe("prompt-template-renderer", () => {
  test("validateLiquidTemplate accepts valid templates and rejects invalid", () => {
    expect(() => validateLiquidTemplate("Hello {{ user.name }}")).not.toThrow();
    expect(() => validateLiquidTemplate("{{outlet::default}}")).not.toThrow();
    expect(() => validateLiquidTemplate("{{random::A::B}}")).not.toThrow();
    expect(() => validateLiquidTemplate("{{ recentMessages(2) | size }}")).not.toThrow();
    expect(() => validateLiquidTemplate("{{ broken ")).toThrow();
  });

  test("renders regular template values", async () => {
    const rendered = await renderLiquidTemplate({
      templateText: "Hi {{ user.name }}",
      context: makeContext(),
    });

    expect(rendered).toBe("Hi Alice");
  });

  test("supports multi-pass nested rendering", async () => {
    const rendered = await renderLiquidTemplate({
      templateText: "{{ user.nested }}",
      context: makeContext(),
      options: { maxPasses: 5 },
    });

    expect(rendered).toBe("Alice-N");
  });

  test("honors maxPasses and can stop before nested value resolves", async () => {
    const rendered = await renderLiquidTemplate({
      templateText: "{{ user.nested }}",
      context: makeContext(),
      options: { maxPasses: 1 },
    });

    expect(rendered).toBe("{{ user.name }}-N");
  });

  test("throws on missing variables when strictVariables enabled", async () => {
    await expect(
      renderLiquidTemplate({
        templateText: "{{ missing.value }}",
        context: makeContext(),
        options: { strictVariables: true },
      })
    ).rejects.toThrow();
  });

  test("returns previous output when extra pass parsing fails", async () => {
    const rendered = await renderLiquidTemplate({
      templateText: "{{ '{{ broken ' }}",
      context: makeContext(),
      options: { maxPasses: 5 },
    });

    expect(rendered).toBe("{{ broken ");
  });

  test("supports ST outlet macro syntax", async () => {
    const rendered = await renderLiquidTemplate({
      templateText: "X={{outlet::default}}",
      context: makeContext(),
    });

    expect(rendered).toBe("X=OUTLET_TEXT");
  });

  test("trim macro removes surrounding blank lines between WI blocks", async () => {
    const rendered = await renderLiquidTemplate({
      templateText: "Start\n\n{{ wiBefore }}\n{{ trim }}\n\n{{ wiAfter }}\n\nEnd",
      context: {
        ...makeContext(),
        wiBefore: "BEFORE",
        wiAfter: "AFTER",
      },
    });

    expect(rendered).toBe("Start\n\nBEFORE\nAFTER\n\nEnd");
  });

  test("strictVariables mode works with trim macro", async () => {
    const rendered = await renderLiquidTemplate({
      templateText: "A\n{{trim}}\nB",
      context: makeContext(),
      options: { strictVariables: true },
    });

    expect(rendered).toBe("A\nB");
  });

  test("supports ST random macro syntax with deterministic rng", async () => {
    const first = await renderLiquidTemplate({
      templateText: "Pick={{random::A::B::C}}",
      context: makeContext(),
      options: { rng: () => 0 },
    });
    const last = await renderLiquidTemplate({
      templateText: "Pick={{random::A::B::C}}",
      context: makeContext(),
      options: { rng: () => 0.999999 },
    });

    expect(first).toBe("Pick=A");
    expect(last).toBe("Pick=C");
  });

  test("exposes lastUserMessage and lastAssistantMessage aliases from messages", async () => {
    const rendered = await renderLiquidTemplate({
      templateText: "U={{lastUserMessage}} | A={{lastAssistantMessage}}",
      context: {
        ...makeContext(),
        messages: [
          { role: "system", content: "S0" },
          { role: "assistant", content: "A1" },
          { role: "user", content: "U1" },
          { role: "assistant", content: "A2" },
          { role: "user", content: "U2" },
        ],
      },
    });

    expect(rendered).toBe("U=U2 | A=A2");
  });

  test("lastAssistantMessage points to fresh assistant text when it is in messages tail", async () => {
    const rendered = await renderLiquidTemplate({
      templateText: "{{lastAssistantMessage}}",
      context: {
        ...makeContext(),
        messages: [
          { role: "assistant", content: "old answer" },
          { role: "user", content: "new question" },
          { role: "assistant", content: "fresh main llm answer" },
        ],
      },
    });

    expect(rendered).toBe("fresh main llm answer");
  });

  test("keeps malformed random macro as literal without throwing", async () => {
    const rendered = await renderLiquidTemplate({
      templateText: "Bad={{random::   }}",
      context: makeContext(),
    });

    expect(rendered).toBe("Bad={{random::   }}");
  });

  test("renders recentMessages(count) after preprocessing and keeps chronological order", async () => {
    const rendered = await renderLiquidTemplate({
      templateText:
        "{% assign msgs = recentMessages(3) %}{% for m in msgs %}[{{m.role}}={{m.content}}]{% endfor %}",
      context: {
        ...makeContext(),
        messages: [
          { role: "system", content: "S0" },
          { role: "assistant", content: "A1" },
          { role: "user", content: "U1" },
          { role: "assistant", content: "A2" },
          { role: "user", content: "U2" },
        ],
      },
    });

    expect(rendered).toBe("[user=U1][assistant=A2][user=U2]");
  });

  test("recentMessagesText(count) formats conversational messages as role-prefixed lines", async () => {
    const rendered = await renderLiquidTemplate({
      templateText: "{{ recentMessagesText(2) }}",
      context: {
        ...makeContext(),
        messages: [
          { role: "assistant", content: "A1" },
          { role: "system", content: "S0" },
          { role: "user", content: "U1" },
          { role: "assistant", content: "A2" },
        ],
      },
    });

    expect(rendered).toBe("user: U1\nassistant: A2");
  });

  test("recentMessagesByContextTokens(tokenLimit) uses chars-per-4 heuristic and rounds upward", async () => {
    const rendered = await renderLiquidTemplate({
      templateText:
        "{% assign msgs = recentMessagesByContextTokens(4) %}{% for m in msgs %}[{{m.role}}={{m.content}}]{% endfor %}",
      context: {
        ...makeContext(),
        messages: [
          { role: "user", content: "12345678" },
          { role: "assistant", content: "123456789012" },
          { role: "user", content: "1234" },
        ],
      },
    });

    expect(rendered).toBe("[assistant=123456789012][user=1234]");
  });

  test("recentMessagesByContextTokensText(tokenLimit) includes the overflowing message and excludes system", async () => {
    const rendered = await renderLiquidTemplate({
      templateText: "{{ recentMessagesByContextTokensText(3) }}",
      context: {
        ...makeContext(),
        messages: [
          { role: "user", content: "12345678901234567890" },
          { role: "system", content: "ignored" },
          { role: "assistant", content: "12345678" },
          { role: "user", content: "1234" },
        ],
      },
    });

    expect(rendered).toBe("assistant: 12345678\nuser: 1234");
  });

  test("recent message helpers return empty values for invalid or non-positive args", async () => {
    const rendered = await renderLiquidTemplate({
      templateText:
        "A={{ recentMessages(0) | size }}|B={{ recentMessagesText(-1) }}|C={{ recentMessagesByContextTokens() | size }}|D={{ recentMessagesByContextTokensText('bad') }}",
      context: {
        ...makeContext(),
        messages: [{ role: "user", content: "U1" }],
      },
    });

    expect(rendered).toBe("A=0|B=|C=0|D=");
  });
});
