import { describe, expect, test } from "vitest";

import { parseKnowledgeRevealOperationParams, parseKnowledgeSearchOperationParams } from "./knowledge-operation-params";

describe("knowledge operation params", () => {
  test("parses inline knowledge search source", () => {
    const parsed = parseKnowledgeSearchOperationParams({
      source: {
        mode: "inline",
        requestTemplate: "{\"textQuery\":\"forest\",\"limit\":5}",
      },
    });

    expect(parsed).toEqual({
      source: {
        mode: "inline",
        requestTemplate: "{\"textQuery\":\"forest\",\"limit\":5}",
        strictVariables: false,
      },
    });
  });

  test("parses artifact knowledge reveal source", () => {
    const parsed = parseKnowledgeRevealOperationParams({
      source: {
        mode: "artifact",
        artifactTag: "planner_result",
      },
    });

    expect(parsed).toEqual({
      source: {
        mode: "artifact",
        artifactTag: "planner_result",
      },
    });
  });

  test("rejects invalid artifact tag", () => {
    expect(() =>
      parseKnowledgeSearchOperationParams({
        source: {
          mode: "artifact",
          artifactTag: "bad tag",
        },
      })
    ).toThrow(/artifactTag/i);
  });
});
