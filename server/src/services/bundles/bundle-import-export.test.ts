import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { applyMigrations } from "../../db/apply-migrations";
import { initDb, resetDbForTests } from "../../db/client";
import { ensureInstructionsSchema } from "../../db/ensure-instructions-schema";
import { ensureOperationBlocksCutover } from "../../db/ensure-operation-blocks-cutover";
import { createInstruction } from "../chat-core/instructions-repository";
import { createOperationBlock, listOperationBlocks } from "../operations/operation-blocks-repository";
import { createOperationProfile, getOperationProfileById } from "../operations/operation-profiles-repository";
import { createUiThemePreset } from "../ui-theme/ui-theme-repository";

import { exportBundleSelection } from "./export-bundle-selection";
import { importBundleFile } from "./import-bundle-file";

describe("bundle import/export", () => {
  let tempDir = "";
  let dbPath = "";

  beforeEach(async () => {
    resetDbForTests();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "talespinner-bundles-"));
    dbPath = path.join(tempDir, "db.sqlite");
    await initDb({ dbPath });
    await applyMigrations();
    await ensureInstructionsSchema();
    await ensureOperationBlocksCutover();
  });

  afterEach(async () => {
    resetDbForTests();
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  test("exports and imports instruction + operation profile bundle with remapped block refs", async () => {
    const instruction = await createInstruction({
      name: "Main instruction",
      kind: "basic",
      templateText: "{{char.name}}",
    });
    const block = await createOperationBlock({
      input: {
        name: "Scene block",
        enabled: true,
        operations: [],
      },
    });
    const profile = await createOperationProfile({
      input: {
        name: "Main profile",
        enabled: true,
        executionMode: "concurrent",
        operationProfileSessionId: "2d9f1f5c-6f38-4f94-9caa-0ea4f36f2db8",
        blockRefs: [{ blockId: block.blockId, enabled: true, order: 0 }],
      },
    });

    const exported = await exportBundleSelection({
      ownerId: "global",
      source: { kind: "instruction", id: instruction.id },
      selections: [
        { kind: "instruction", id: instruction.id },
        { kind: "operation_profile", id: profile.profileId },
      ],
      format: "json",
    });

    const imported = await importBundleFile({
      ownerId: "global",
      fileName: exported.fileName,
      buffer: exported.buffer,
    });

    expect(imported.created.instructions).toHaveLength(1);
    expect(imported.created.operationProfiles).toHaveLength(1);
    expect(imported.sourceResourceId).toBeTruthy();
    expect(imported.applied.instructionId).toBe(imported.created.instructions[0]!.id);
    expect(imported.applied.operationProfileId).toBe(imported.created.operationProfiles[0]!.profileId);
    expect(imported.skippedApply).toEqual([]);

    const createdProfile = await getOperationProfileById(imported.created.operationProfiles[0]!.profileId);
    const blocks = await listOperationBlocks({ ownerId: "global" });

    expect(createdProfile?.blockRefs).toHaveLength(1);
    expect(createdProfile?.blockRefs[0]?.blockId).not.toBe(block.blockId);
    expect(blocks.some((item) => item.blockId === createdProfile?.blockRefs[0]?.blockId)).toBe(true);
  });

  test("imports legacy ui theme export via bundle import endpoint", async () => {
    const created = await createUiThemePreset({
      ownerId: "global",
      name: "Night",
      payload: {
        lightTokens: {},
        darkTokens: {},
        typography: {
          uiFontFamily: "UI",
          chatFontFamily: "Chat",
          uiBaseFontSize: "16px",
          chatBaseFontSize: "16px",
          radiusXs: "4px",
          radiusSm: "6px",
          radiusMd: "8px",
          radiusLg: "10px",
          radiusXl: "12px",
        },
        markdown: {
          fontSize: "16px",
          lineHeight: "1.5",
          codeFontSize: "14px",
          codePadding: "2px 4px",
          quoteBorderWidth: "3px",
        },
        customCss: "",
      },
    });

    const legacyPayload = JSON.stringify({
      type: "talespinner.uiThemePreset",
      version: 1,
      preset: {
        name: created.name,
        description: created.description,
        payload: created.payload,
      },
    });

    const imported = await importBundleFile({
      ownerId: "global",
      fileName: "ui-theme-night.json",
      buffer: Buffer.from(legacyPayload, "utf8"),
    });

    expect(imported.created.uiThemePresets).toHaveLength(1);
    expect(imported.applied.uiThemePresetId).toBe(imported.created.uiThemePresets[0]!.presetId);
    expect(imported.warnings).toContain("Imported legacy UI theme preset format.");
  });

  test("reports ambiguous auto-apply targets when bundle has multiple resources of same kind without source", async () => {
    const bundlePayload = JSON.stringify({
      type: "talespinner.bundle",
      version: 1,
      bundleId: "bundle-ambiguous",
      createdAt: "2026-03-13T10:00:00.000Z",
      container: "json",
      resources: [
        {
          resourceId: "instruction:one",
          kind: "instruction",
          schemaVersion: 1,
          role: "related",
          title: "One",
          payload: {
            name: "One",
            kind: "basic",
            engine: "liquidjs",
            templateText: "One",
          },
        },
        {
          resourceId: "instruction:two",
          kind: "instruction",
          schemaVersion: 1,
          role: "related",
          title: "Two",
          payload: {
            name: "Two",
            kind: "basic",
            engine: "liquidjs",
            templateText: "Two",
          },
        },
      ],
    });

    const imported = await importBundleFile({
      ownerId: "global",
      fileName: "ambiguous.json",
      buffer: Buffer.from(bundlePayload, "utf8"),
    });

    expect(imported.applied.instructionId).toBeNull();
    expect(imported.skippedApply).toContainEqual({
      kind: "instruction",
      reason: "ambiguous",
      message: "Skipped auto-apply for instruction: ambiguous imported resources.",
    });
  });
});
