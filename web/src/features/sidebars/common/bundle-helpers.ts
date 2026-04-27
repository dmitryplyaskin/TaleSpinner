import type { BundleImportResult, BundleSelectionHandle } from "../../../api/bundles";

export type BundleApplyTargets = {
  instructionId: string | null;
  operationProfileId: string | null;
  uiThemePresetId: string | null;
  samplerPresetId: string | null;
  entityProfileId: string | null;
  worldInfoBookId: string | null;
  warnings: string[];
};

export type BundleExportCandidate = {
  key: string;
  label: string;
  handle: BundleSelectionHandle;
  checkedByDefault: boolean;
};

export type BundleExportCandidateCopy = {
  kindLabelKey: string;
  descriptionKey: string;
};

export function resolveBundleAutoApplyTargets(result: BundleImportResult): BundleApplyTargets {
  return {
    instructionId: result.applied.instructionId,
    operationProfileId: result.applied.operationProfileId,
    uiThemePresetId: result.applied.uiThemePresetId,
    samplerPresetId: result.applied.samplerPresetId,
    entityProfileId: result.applied.entityProfileId,
    worldInfoBookId: result.applied.worldInfoBookId,
    warnings: [...result.warnings, ...result.skippedApply.map((item) => item.message)],
  };
}

export function toggleBundleCandidateSelection(currentKeys: string[], key: string, checked: boolean): string[] {
  if (checked) {
    return currentKeys.includes(key) ? currentKeys : [...currentKeys, key];
  }

  return currentKeys.filter((item) => item !== key);
}

export function getBundleExportCandidateCopy(candidate: BundleExportCandidate): BundleExportCandidateCopy {
  if (candidate.handle.kind === "instruction") {
    return {
      kindLabelKey: "instructions.bundle.candidates.kinds.instruction",
      descriptionKey: candidate.checkedByDefault
        ? "instructions.bundle.candidates.descriptions.sourceInstruction"
        : "instructions.bundle.candidates.descriptions.instruction",
    };
  }

  if (candidate.handle.kind === "operation_profile") {
    return {
      kindLabelKey: "instructions.bundle.candidates.kinds.operationProfile",
      descriptionKey: "instructions.bundle.candidates.descriptions.operationProfile",
    };
  }

  if (candidate.handle.kind === "ui_theme_preset") {
    return {
      kindLabelKey: "instructions.bundle.candidates.kinds.uiThemePreset",
      descriptionKey: "instructions.bundle.candidates.descriptions.uiThemePreset",
    };
  }

  if (candidate.handle.kind === "sampler_preset") {
    return {
      kindLabelKey: "instructions.bundle.candidates.kinds.samplerPreset",
      descriptionKey: "instructions.bundle.candidates.descriptions.samplerPreset",
    };
  }

  if (candidate.handle.kind === "entity_profile") {
    return {
      kindLabelKey: "instructions.bundle.candidates.kinds.entityProfile",
      descriptionKey: "instructions.bundle.candidates.descriptions.entityProfile",
    };
  }

  return {
    kindLabelKey: "instructions.bundle.candidates.kinds.worldInfoBook",
    descriptionKey: "instructions.bundle.candidates.descriptions.worldInfoBook",
  };
}

export function resolveInstructionBundleExportCandidates(params: {
  sourceInstruction: { id: string; name: string };
  activeOperationProfile?: { profileId: string; name: string } | null;
  activeUiThemePreset?: { presetId: string; name: string } | null;
  activeSamplerPreset?: { presetId: string; name: string } | null;
  currentEntityProfile?: { id: string; name: string } | null;
  currentWorldInfoBooks?: Array<{ id: string; name: string }>;
}): BundleExportCandidate[] {
  const candidates: BundleExportCandidate[] = [
    {
      key: `instruction:${params.sourceInstruction.id}`,
      label: params.sourceInstruction.name,
      handle: { kind: "instruction", id: params.sourceInstruction.id },
      checkedByDefault: true,
    },
  ];

  if (params.activeOperationProfile) {
    candidates.push({
      key: `operation_profile:${params.activeOperationProfile.profileId}`,
      label: params.activeOperationProfile.name,
      handle: { kind: "operation_profile", id: params.activeOperationProfile.profileId },
      checkedByDefault: false,
    });
  }

  if (params.activeUiThemePreset) {
    candidates.push({
      key: `ui_theme_preset:${params.activeUiThemePreset.presetId}`,
      label: params.activeUiThemePreset.name,
      handle: { kind: "ui_theme_preset", id: params.activeUiThemePreset.presetId },
      checkedByDefault: false,
    });
  }

  if (params.activeSamplerPreset) {
    candidates.push({
      key: `sampler_preset:${params.activeSamplerPreset.presetId}`,
      label: params.activeSamplerPreset.name,
      handle: { kind: "sampler_preset", id: params.activeSamplerPreset.presetId },
      checkedByDefault: false,
    });
  }

  if (params.currentEntityProfile) {
    candidates.push({
      key: `entity_profile:${params.currentEntityProfile.id}`,
      label: params.currentEntityProfile.name,
      handle: { kind: "entity_profile", id: params.currentEntityProfile.id },
      checkedByDefault: false,
    });
  }

  (params.currentWorldInfoBooks ?? []).forEach((book) => {
    candidates.push({
      key: `world_info_book:${book.id}`,
      label: book.name,
      handle: { kind: "world_info_book", id: book.id },
      checkedByDefault: false,
    });
  });

  return candidates;
}
