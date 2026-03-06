import { describe, expect, test } from "vitest";

import { validateOperationBlockUpsertInput } from "./operation-block-validator";

describe("operation block validator", () => {
  test("accepts valid block", () => {
    const out = validateOperationBlockUpsertInput({
      name: "block",
      enabled: true,
      operations: [
        {
          opId: "6ff77029-5037-4d21-8ace-c9836f58a14b",
          name: "template-op",
          kind: "template",
            config: {
              enabled: true,
              required: false,
              hooks: ["before_main_llm"],
              activation: {
                everyNTurns: 5,
              },
              order: 10,
              params: {
                template: "Hello",
              output: {
                type: "artifacts",
                writeArtifact: {
                  tag: "world_state",
                  persistence: "run_only",
                  usage: "internal",
                  semantics: "intermediate",
                },
              },
            },
          },
        },
      ],
    });
    expect(out.operations).toHaveLength(1);
  });

  test("rejects dependency to unknown opId", () => {
    expect(() =>
      validateOperationBlockUpsertInput({
        name: "block",
        enabled: true,
        operations: [
          {
            opId: "6ff77029-5037-4d21-8ace-c9836f58a14b",
            name: "template-op",
            kind: "template",
            config: {
              enabled: true,
              required: false,
              hooks: ["before_main_llm"],
              order: 10,
              dependsOn: ["365f9038-f2d8-4f64-a30f-0fdd5a91bf73"],
              params: {
                template: "Hello",
                output: {
                  type: "artifacts",
                  writeArtifact: {
                    tag: "world_state",
                    persistence: "run_only",
                    usage: "internal",
                    semantics: "intermediate",
                  },
                },
              },
            },
          },
        ],
      })
    ).toThrow(/unknown opId/);
  });

  test("rejects empty activation object", () => {
    const payload = {
      name: "block",
      enabled: true,
      operations: [
        {
          opId: "6ff77029-5037-4d21-8ace-c9836f58a14b",
          name: "template-op",
          kind: "template" as const,
          config: {
            enabled: true,
            required: false,
            hooks: ["before_main_llm" as const],
            activation: {},
            order: 10,
            params: {
              template: "Hello",
              output: {
                type: "artifacts" as const,
                writeArtifact: {
                  tag: "world_state",
                  persistence: "run_only" as const,
                  usage: "internal" as const,
                  semantics: "intermediate",
                },
              },
            },
          },
        },
      ],
    };

    expect(() => validateOperationBlockUpsertInput(payload)).toThrow(/Validation error/);

    try {
      validateOperationBlockUpsertInput(payload);
      expect.unreachable("expected validation error");
    } catch (error) {
      const issues = (error as { details?: { issues?: Array<{ message?: string }> } }).details?.issues ?? [];
      expect(issues.some((issue) => issue.message === "activation must include at least one interval")).toBe(true);
    }
  });
});
