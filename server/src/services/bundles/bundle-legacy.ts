import {
  TALESPINNER_BUNDLE_TYPE,
  TALESPINNER_BUNDLE_VERSION,
  createBundleResourceId,
  parseTaleSpinnerBundle,
  type TaleSpinnerBundle,
} from "@shared/types/bundles";
import { UI_THEME_EXPORT_TYPE, type UiThemeExportV1 } from "@shared/types/ui-theme";

import type { InstructionMeta, StBaseConfig } from "@shared/types/instructions";
import type { OperationProfileExport, OperationProfileLegacyExportV1 } from "@shared/types/operation-profiles";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOperationProfileBundleV2(
  input: OperationProfileExport | OperationProfileLegacyExportV1
): input is OperationProfileExport {
  return "type" in input && input.type === "operation_profile_bundle";
}

function convertLegacyInstruction(input: Record<string, unknown>): TaleSpinnerBundle | null {
  if (input.type !== "talespinner.instruction" || !isRecord(input.instruction)) return null;
  const kind = input.instruction.kind;
  const resourceId = createBundleResourceId("instruction", String(input.instruction.name ?? "instruction"));

  return parseTaleSpinnerBundle({
    type: TALESPINNER_BUNDLE_TYPE,
    version: TALESPINNER_BUNDLE_VERSION,
    bundleId: `legacy-instruction:${resourceId}`,
    createdAt: new Date().toISOString(),
    container: "json",
    sourceResourceId: resourceId,
    resources: [
      {
        resourceId,
        kind: "instruction",
        schemaVersion: 1,
        role: "primary",
        title: String(input.instruction.name ?? "Instruction"),
        payload:
          kind === "st_base"
            ? {
                name: String(input.instruction.name ?? "Instruction"),
                kind: "st_base",
                engine: "liquidjs",
                stBase: input.instruction.stBase as StBaseConfig,
                meta: input.instruction.meta as InstructionMeta | undefined,
              }
            : {
                name: String(input.instruction.name ?? "Instruction"),
                kind: "basic",
                engine: "liquidjs",
                templateText: String(input.instruction.templateText ?? ""),
                meta: input.instruction.meta as InstructionMeta | undefined,
              },
      },
    ],
  });
}

function toOperationBundleResources(input: OperationProfileExport | OperationProfileLegacyExportV1): TaleSpinnerBundle {
  const normalizedProfile = isOperationProfileBundleV2(input)
    ? input.profile
    : input;
  const profileResourceId = createBundleResourceId("operation_profile", normalizedProfile.name);
  const hasBlocks = isOperationProfileBundleV2(input);

  const blockResources = hasBlocks
    ? input.blocks.map((block) => {
        const resourceId = createBundleResourceId("operation_block", block.name);
        return {
          resourceId,
          kind: "operation_block" as const,
          schemaVersion: 1 as const,
          role: "dependency" as const,
          title: block.name,
          payload: {
            name: block.name,
            description: block.description,
            enabled: block.enabled,
            operations: block.operations,
            meta: block.meta,
          },
        };
      })
    : [
        {
          resourceId: createBundleResourceId("operation_block", `${normalizedProfile.name}-block`),
          kind: "operation_block" as const,
          schemaVersion: 1 as const,
          role: "dependency" as const,
          title: `${normalizedProfile.name} block`,
          payload: {
            name: `${normalizedProfile.name} block`,
            description: normalizedProfile.description,
            enabled: true,
            operations: input.operations,
            meta: normalizedProfile.meta,
          },
        },
      ];

  const blockIdMap = new Map<string, string>();
  if (hasBlocks) {
    input.blocks.forEach((block, index) => {
      if (block.blockId) {
        blockIdMap.set(block.blockId, blockResources[index]!.resourceId);
      }
    });
  }

  return parseTaleSpinnerBundle({
    type: TALESPINNER_BUNDLE_TYPE,
    version: TALESPINNER_BUNDLE_VERSION,
    bundleId: `legacy-operation:${profileResourceId}`,
    createdAt: new Date().toISOString(),
    container: "json",
    sourceResourceId: profileResourceId,
    resources: [
      ...blockResources,
      {
        resourceId: profileResourceId,
        kind: "operation_profile",
        schemaVersion: 1,
        role: "primary",
        title: normalizedProfile.name,
        payload: {
          name: normalizedProfile.name,
          description: normalizedProfile.description,
          enabled: normalizedProfile.enabled,
          executionMode: normalizedProfile.executionMode,
          operationProfileSessionId: normalizedProfile.operationProfileSessionId,
          blockRefs: hasBlocks
              ? input.profile.blockRefs.map((ref) => ({
                  resourceId: blockIdMap.get(ref.blockId) ?? ref.blockId,
                  enabled: ref.enabled,
                  order: ref.order,
                }))
              : [{ resourceId: blockResources[0]!.resourceId, enabled: true, order: 0 }],
          meta: normalizedProfile.meta,
        },
      },
    ],
  });
}

function convertLegacyUiTheme(input: UiThemeExportV1 | UiThemeExportV1[]): TaleSpinnerBundle {
  const items = Array.isArray(input) ? input : [input];
  const resources = items.map((item, index) => {
    const resourceId = createBundleResourceId("ui_theme_preset", `${item.preset.name}-${index + 1}`);
    return {
      resourceId,
      kind: "ui_theme_preset" as const,
      schemaVersion: 1 as const,
      role: index === 0 ? ("primary" as const) : ("related" as const),
      title: item.preset.name,
      payload: {
        name: item.preset.name,
        description: item.preset.description,
        payload: item.preset.payload,
      },
    };
  });

  return parseTaleSpinnerBundle({
    type: TALESPINNER_BUNDLE_TYPE,
    version: TALESPINNER_BUNDLE_VERSION,
    bundleId: `legacy-ui-theme:${resources[0]!.resourceId}`,
    createdAt: new Date().toISOString(),
    container: "json",
    sourceResourceId: resources[0]!.resourceId,
    resources,
  });
}

export function normalizeLegacyBundleInput(input: unknown): TaleSpinnerBundle | null {
  if (isRecord(input)) {
    const instructionBundle = convertLegacyInstruction(input);
    if (instructionBundle) return instructionBundle;

    if (input.type === UI_THEME_EXPORT_TYPE) {
      return convertLegacyUiTheme(input as unknown as UiThemeExportV1);
    }

    if (
      input.type === "operation_profile_bundle" ||
      ("name" in input &&
        "enabled" in input &&
        "executionMode" in input &&
        "operationProfileSessionId" in input &&
        ("operations" in input || "profile" in input))
    ) {
      return toOperationBundleResources(input as OperationProfileExport | OperationProfileLegacyExportV1);
    }
  }

  if (Array.isArray(input) && input.every((item) => isRecord(item) && item.type === UI_THEME_EXPORT_TYPE)) {
    return convertLegacyUiTheme(input as UiThemeExportV1[]);
  }

  return null;
}
