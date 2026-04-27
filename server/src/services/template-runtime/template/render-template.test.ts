import { describe, expect, test } from "vitest";

import { renderTemplate, type InstructionRenderContext } from "../index";

function makeContext(): InstructionRenderContext {
  return {
    char: { name: "Alice" },
    user: { name: "User" },
    chat: { title: "Chat" },
    messages: [
      { role: "assistant", content: "A1" },
      { role: "user", content: "U1 uwu" },
      { role: "assistant", content: "A2 ara" },
      { role: "user", content: "U2 uwu ara" },
    ],
    rag: {},
    art: {
      note: { value: "NOTE", history: ["NOTE"] },
    },
    promptSystem: "SYS",
    outlet: {
      default: "OUTLET_TEXT",
    },
    lastUserMessage: "U2 uwu ara",
    lastAssistantMessage: "A2 ara",
    now: new Date("2026-03-16T00:00:00.000Z").toISOString(),
  };
}

describe("template-runtime/renderTemplate", () => {
  test("renders text interpolation, if/else, and each", () => {
    const rendered = renderTemplate({
      source:
        "Hi {{ char.name }}\n{{#if contains(lastUserMessage, \"uwu\", \"i\")}}YES{{else}}NO{{/if}}\n{{#each messages as msg}}[{{msg.role}}={{msg.content}}]{{/each}}",
      context: makeContext(),
    });

    expect(rendered).toBe(
      "Hi Alice\nYES\n[assistant=A1][user=U1 uwu][assistant=A2 ara][user=U2 uwu ara]"
    );
  });

  test("supports set and unset statements with render scope default", () => {
    const rendered = renderTemplate({
      source:
        "{{set(\"mood\", \"angry\")}}Mood={{mood}}|{{unset(\"mood\")}}After={{mood}}",
      context: makeContext(),
    });

    expect(rendered).toBe("Mood=angry|After=");
  });

  test("supports trim semantics around blank lines", () => {
    const rendered = renderTemplate({
      source: "Start\n\n{{ wiBefore }}\n{{trim}}\n\n{{ wiAfter }}\n\nEnd",
      context: {
        ...makeContext(),
        wiBefore: "BEFORE",
        wiAfter: "AFTER",
      },
    });

    expect(rendered).toBe("Start\n\nBEFORE\nAFTER\n\nEnd");
  });

  test("supports mixed canonical syntax and ST aliases", () => {
    const rendered = renderTemplate({
      source:
        "{{set(\"tone\", pickRandom(\"calm\", \"tense\"))}}T={{tone}}|O={{outlet::default}}|R={{random::A::B}}|{{setvar::mood::angry}}M={{mood}}",
      context: makeContext(),
      options: {
        rng: () => 0,
      },
    });

    expect(rendered).toBe("T=calm|O=OUTLET_TEXT|R=A|M=angry");
  });

  test("coerces missing values to empty string in non-strict mode and errors in strict mode", () => {
    expect(
      renderTemplate({
        source: "X={{missing.value}}",
        context: makeContext(),
      })
    ).toBe("X=");

    expect(() =>
      renderTemplate({
        source: "X={{missing.value}}",
        context: makeContext(),
        options: {
          strictVariables: true,
        },
      })
    ).toThrow();
  });

  test("does not mutate input context or state", () => {
    const context = makeContext();
    const messagesBefore = [...context.messages];
    const rendered = renderTemplate({
      source: "{{set(\"mood\", \"angry\")}}{{mood}}",
      context,
    });

    expect(rendered).toBe("angry");
    expect(context.messages).toEqual(messagesBefore);
    expect((context as unknown as Record<string, unknown>).mood).toBeUndefined();
  });
});
