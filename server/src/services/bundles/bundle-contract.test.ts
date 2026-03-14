import {
  createBundleResourceId,
  parseTaleSpinnerBundle,
  validateBundleResourceGraph,
} from "@shared/types/bundles";
import { describe, expect, test } from "vitest";

describe("bundle contract", () => {
  test("parses valid sampler preset resource", () => {
    const samplerResourceId = createBundleResourceId("sampler_preset", "storyteller");

    const parsed = parseTaleSpinnerBundle({
      type: "talespinner.bundle",
      version: 1,
      bundleId: "bundle-sampler-1",
      createdAt: "2026-03-13T10:00:00.000Z",
      container: "json",
      sourceResourceId: samplerResourceId,
      resources: [
        {
          resourceId: samplerResourceId,
          kind: "sampler_preset",
          schemaVersion: 1,
          role: "primary",
          title: "Storyteller",
          payload: {
            name: "Storyteller",
            settings: {
              temperature: 0.9,
              topP: 0.95,
              reasoning: {
                enabled: true,
                effort: "medium",
              },
            },
          },
        },
      ],
    });

    expect(parsed.resources).toHaveLength(1);
    expect(parsed.resources[0]).toMatchObject({
      kind: "sampler_preset",
      payload: {
        name: "Storyteller",
      },
    });
    expect(() => validateBundleResourceGraph(parsed)).not.toThrow();
  });

  test("parses valid bundle manifest", () => {
    const blockResourceId = createBundleResourceId("operation_block", "scene");
    const profileResourceId = createBundleResourceId("operation_profile", "main");

    const parsed = parseTaleSpinnerBundle({
      type: "talespinner.bundle",
      version: 1,
      bundleId: "bundle-1",
      createdAt: "2026-03-13T10:00:00.000Z",
      container: "json",
      sourceResourceId: profileResourceId,
      resources: [
        {
          resourceId: blockResourceId,
          kind: "operation_block",
          schemaVersion: 1,
          role: "dependency",
          title: "Scene block",
          payload: {
            name: "Scene block",
            enabled: true,
            operations: [],
          },
        },
        {
          resourceId: profileResourceId,
          kind: "operation_profile",
          schemaVersion: 1,
          role: "primary",
          title: "Main profile",
          payload: {
            name: "Main profile",
            enabled: true,
            executionMode: "concurrent",
            operationProfileSessionId: "2d9f1f5c-6f38-4f94-9caa-0ea4f36f2db8",
            blockRefs: [{ resourceId: blockResourceId, enabled: true, order: 0 }],
          },
        },
      ],
    });

    expect(parsed.type).toBe("talespinner.bundle");
    expect(parsed.resources).toHaveLength(2);
    expect(() => validateBundleResourceGraph(parsed)).not.toThrow();
  });

  test("rejects missing cross-resource references", () => {
    const parsed = parseTaleSpinnerBundle({
      type: "talespinner.bundle",
      version: 1,
      bundleId: "bundle-1",
      createdAt: "2026-03-13T10:00:00.000Z",
      container: "json",
      resources: [
        {
          resourceId: createBundleResourceId("operation_profile", "main"),
          kind: "operation_profile",
          schemaVersion: 1,
          role: "primary",
          title: "Main profile",
          payload: {
            name: "Main profile",
            enabled: true,
            executionMode: "concurrent",
            operationProfileSessionId: "2d9f1f5c-6f38-4f94-9caa-0ea4f36f2db8",
            blockRefs: [{ resourceId: "block-local-db-id", enabled: true, order: 0 }],
          },
        },
      ],
    });

    expect(() => validateBundleResourceGraph(parsed)).toThrow(/Unknown operation_block resourceId/i);
  });
});
