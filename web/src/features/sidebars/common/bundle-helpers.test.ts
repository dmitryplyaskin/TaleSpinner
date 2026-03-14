import { describe, expect, it } from "vitest";

import {
  getBundleExportCandidateCopy,
  resolveBundleAutoApplyTargets,
  resolveInstructionBundleExportCandidates,
  toggleBundleCandidateSelection,
} from "./bundle-helpers";

describe("bundle helpers", () => {
  it("prefers source resource for auto-apply", () => {
    const resolved = resolveBundleAutoApplyTargets({
      sourceResourceId: "instruction:main",
      created: {
        instructions: [
          { resourceId: "instruction:main", id: "inst-1", name: "Main" },
          { resourceId: "instruction:alt", id: "inst-2", name: "Alt" },
        ],
        operationBlocks: [],
        operationProfiles: [],
        worldInfoBooks: [],
        entityProfiles: [],
        uiThemePresets: [],
        samplerPresets: [],
      },
      applied: {
        instructionId: "inst-1",
        operationProfileId: null,
        uiThemePresetId: null,
        entityProfileId: null,
        worldInfoBookId: null,
        samplerPresetId: null,
      },
      skippedApply: [],
      warnings: [],
    });

    expect(resolved.instructionId).toBe("inst-1");
    expect(resolved.warnings).toEqual([]);
  });

  it("skips ambiguous auto-apply targets without source match", () => {
    const resolved = resolveBundleAutoApplyTargets({
      created: {
        instructions: [
          { resourceId: "instruction:main", id: "inst-1", name: "Main" },
          { resourceId: "instruction:alt", id: "inst-2", name: "Alt" },
        ],
        operationBlocks: [],
        operationProfiles: [],
        worldInfoBooks: [],
        entityProfiles: [],
        uiThemePresets: [],
        samplerPresets: [],
      },
      applied: {
        instructionId: null,
        operationProfileId: null,
        uiThemePresetId: null,
        entityProfileId: null,
        worldInfoBookId: null,
        samplerPresetId: null,
      },
      skippedApply: [
        {
          kind: "instruction",
          reason: "ambiguous",
          message: "Skipped auto-apply for instruction: ambiguous imported resources.",
        },
      ],
      warnings: [],
    });

    expect(resolved.instructionId).toBeNull();
    expect(resolved.warnings).toContain("Skipped auto-apply for instruction: ambiguous imported resources.");
  });

  it("builds instruction export candidates with source preselected", () => {
    const candidates = resolveInstructionBundleExportCandidates({
      sourceInstruction: { id: "inst-1", name: "Main instruction" },
      activeOperationProfile: { profileId: "prof-1", name: "Main profile" },
      activeUiThemePreset: { presetId: "theme-1", name: "Night" },
      activeSamplerPreset: { presetId: "sampler-1", name: "Storyteller" },
      currentEntityProfile: { id: "entity-1", name: "Hero" },
      currentWorldInfoBooks: [{ id: "book-1", name: "Lore" }],
    });

    expect(candidates).toEqual([
      expect.objectContaining({ key: "instruction:inst-1", checkedByDefault: true }),
      expect.objectContaining({ key: "operation_profile:prof-1", checkedByDefault: false }),
      expect.objectContaining({ key: "ui_theme_preset:theme-1", checkedByDefault: false }),
      expect.objectContaining({ key: "sampler_preset:sampler-1", checkedByDefault: false }),
      expect.objectContaining({ key: "entity_profile:entity-1", checkedByDefault: false }),
      expect.objectContaining({ key: "world_info_book:book-1", checkedByDefault: false }),
    ]);
  });

  it("toggles bundle selection without relying on synthetic event state", () => {
    expect(toggleBundleCandidateSelection(["instruction:1"], "operation_profile:1", true)).toEqual([
      "instruction:1",
      "operation_profile:1",
    ]);
    expect(toggleBundleCandidateSelection(["instruction:1"], "instruction:1", true)).toEqual([
      "instruction:1",
    ]);
    expect(toggleBundleCandidateSelection(["instruction:1", "operation_profile:1"], "instruction:1", false)).toEqual([
      "operation_profile:1",
    ]);
  });

  it("provides descriptive copy metadata for export candidates", () => {
    const sourceCandidate = {
      key: "instruction:inst-1",
      label: "Main instruction",
      handle: { kind: "instruction" as const, id: "inst-1" },
      checkedByDefault: true,
    };
    const profileCandidate = {
      key: "operation_profile:prof-1",
      label: "Main profile",
      handle: { kind: "operation_profile" as const, id: "prof-1" },
      checkedByDefault: false,
    };
    const samplerCandidate = {
      key: "sampler_preset:sampler-1",
      label: "Storyteller",
      handle: { kind: "sampler_preset" as const, id: "sampler-1" },
      checkedByDefault: false,
    };

    expect(getBundleExportCandidateCopy(sourceCandidate)).toEqual({
      kindLabelKey: "instructions.bundle.candidates.kinds.instruction",
      descriptionKey: "instructions.bundle.candidates.descriptions.sourceInstruction",
    });
    expect(getBundleExportCandidateCopy(profileCandidate)).toEqual({
      kindLabelKey: "instructions.bundle.candidates.kinds.operationProfile",
      descriptionKey: "instructions.bundle.candidates.descriptions.operationProfile",
    });
    expect(getBundleExportCandidateCopy(samplerCandidate)).toEqual({
      kindLabelKey: "instructions.bundle.candidates.kinds.samplerPreset",
      descriptionKey: "instructions.bundle.candidates.descriptions.samplerPreset",
    });
  });

  it("returns sampler preset auto-apply target", () => {
    const resolved = resolveBundleAutoApplyTargets({
      created: {
        instructions: [],
        operationBlocks: [],
        operationProfiles: [],
        worldInfoBooks: [],
        entityProfiles: [],
        uiThemePresets: [],
        samplerPresets: [{ resourceId: "sampler_preset:main", presetId: "sampler-1", name: "Storyteller" }],
      },
      applied: {
        instructionId: null,
        operationProfileId: null,
        uiThemePresetId: null,
        entityProfileId: null,
        worldInfoBookId: null,
        samplerPresetId: "sampler-1",
      },
      skippedApply: [],
      warnings: [],
    });

    expect(resolved.samplerPresetId).toBe("sampler-1");
  });
});
