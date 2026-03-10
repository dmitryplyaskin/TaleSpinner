import { describe, expect, test } from "vitest";

import { buildOperationArtifactId } from "@shared/types/operation-profiles";

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
    expect(out.operations[0]?.config.params.artifact.artifactId).toBe(buildOperationArtifactId("6ff77029-5037-4d21-8ace-c9836f58a14b"));
    expect(out.operations[0]?.config.params.artifact.tag).toBe("world_state");
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

  test("migrates legacy prompt_time output into artifact exposures", () => {
    const out = validateOperationBlockUpsertInput({
      name: "block",
      enabled: true,
      operations: [
        {
          opId: "7ff77029-5037-4d21-8ace-c9836f58a14b",
          name: "prompt-op",
          kind: "template",
          config: {
            enabled: true,
            required: false,
            hooks: ["before_main_llm"],
            order: 10,
            params: {
              template: "Hello",
              output: {
                type: "prompt_time",
                promptTime: {
                  kind: "append_after_last_user",
                  role: "system",
                  source: "legacy",
                },
              },
            },
          },
        },
      ],
    });

    expect(out.operations[0]?.config.params.artifact.exposures).toEqual([
      {
        type: "prompt_message",
        role: "system",
        anchor: "after_last_user",
        source: "legacy",
      },
    ]);
  });

  test("rejects prompt_message exposure in after_main_llm hook", () => {
    expect(() =>
      validateOperationBlockUpsertInput({
        name: "block",
        enabled: true,
        operations: [
          {
            opId: "8ff77029-5037-4d21-8ace-c9836f58a14b",
            name: "bad-op",
            kind: "template",
            config: {
              enabled: true,
              required: false,
              hooks: ["after_main_llm"],
              order: 10,
              params: {
                template: "Hello",
                artifact: {
                  artifactId: "artifact:bad-op",
                  tag: "bad_artifact",
                  title: "Bad artifact",
                  format: "markdown",
                  persistence: "run_only",
                  writeMode: "replace",
                  history: {
                    enabled: true,
                    maxItems: 20,
                  },
                  exposures: [
                    {
                      type: "prompt_message",
                      role: "system",
                      anchor: "after_last_user",
                    },
                  ],
                },
              },
            },
          },
        ],
      })
    ).toThrow(/before_main_llm/i);
  });
});
