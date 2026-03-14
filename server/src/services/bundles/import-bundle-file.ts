import { randomUUID } from "node:crypto";

import {
  type EntityProfileBundleResource,
  type InstructionBundleResource,
  type OperationBlockBundleResource,
  type OperationProfileBundleResource,
  parseTaleSpinnerBundle,
  type SamplerPresetBundleResource,
  type TaleSpinnerBundle,
  type UiThemePresetBundleResource,
  validateBundleResourceGraph,
  type WorldInfoBookBundleResource,
} from "@shared/types/bundles";
import { type InstructionMeta, type StBaseConfig } from "@shared/types/instructions";
import { UI_THEME_EXPORT_TYPE } from "@shared/types/ui-theme";

import { saveEntityProfileAvatarPng } from "../chat-core/entity-profile-media";
import { createEntityProfile } from "../chat-core/entity-profiles-repository";
import { createInstruction, listInstructions } from "../chat-core/instructions-repository";
import { createOperationBlock, listOperationBlocks, resolveImportedOperationBlockName } from "../operations/operation-blocks-repository";
import { createOperationProfile, listOperationProfiles } from "../operations/operation-profiles-repository";
import { resolveImportedSamplerPresetName, samplersService } from "../samplers.service";
import { createUiThemePreset, listUiThemePresets, resolveImportedPresetName } from "../ui-theme/ui-theme-repository";
import { createWorldInfoBook } from "../world-info/world-info-repositories";

import { decodeBundleArchive } from "./bundle-archive";
import { normalizeLegacyBundleInput } from "./bundle-legacy";

function resolveImportedName(input: string, existingNames: Set<string>, suffix = "copy"): string {
  const base = input.trim() || "Imported item";
  if (!existingNames.has(base)) {
    existingNames.add(base);
    return base;
  }
  let index = 2;
  while (existingNames.has(`${base} (${suffix} ${index})`)) {
    index += 1;
  }
  const next = `${base} (${suffix} ${index})`;
  existingNames.add(next);
  return next;
}

function looksLikeArchive(buffer: Buffer): boolean {
  return buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
}

function isInstructionResource(resource: TaleSpinnerBundle["resources"][number]): resource is InstructionBundleResource {
  return resource.kind === "instruction";
}

function isOperationBlockResource(resource: TaleSpinnerBundle["resources"][number]): resource is OperationBlockBundleResource {
  return resource.kind === "operation_block";
}

function isOperationProfileResource(resource: TaleSpinnerBundle["resources"][number]): resource is OperationProfileBundleResource {
  return resource.kind === "operation_profile";
}

function isWorldInfoBookResource(resource: TaleSpinnerBundle["resources"][number]): resource is WorldInfoBookBundleResource {
  return resource.kind === "world_info_book";
}

function isEntityProfileResource(resource: TaleSpinnerBundle["resources"][number]): resource is EntityProfileBundleResource {
  return resource.kind === "entity_profile";
}

function isUiThemePresetResource(resource: TaleSpinnerBundle["resources"][number]): resource is UiThemePresetBundleResource {
  return resource.kind === "ui_theme_preset";
}

function isSamplerPresetResource(resource: TaleSpinnerBundle["resources"][number]): resource is SamplerPresetBundleResource {
  return resource.kind === "sampler_preset";
}

type CreatedResourceItem = { resourceId: string };
type AutoApplyKind =
  | "instruction"
  | "operation_profile"
  | "ui_theme_preset"
  | "sampler_preset"
  | "entity_profile"
  | "world_info_book";

type BundleAppliedTargets = {
  instructionId: string | null;
  operationProfileId: string | null;
  uiThemePresetId: string | null;
  samplerPresetId: string | null;
  entityProfileId: string | null;
  worldInfoBookId: string | null;
};

type BundleSkippedApplyItem = {
  kind: AutoApplyKind;
  reason: "ambiguous";
  message: string;
};

function resolveAppliedTarget<T extends CreatedResourceItem, TResult>(
  items: T[],
  sourceResourceId: string | undefined,
  kind: AutoApplyKind,
  label: string,
  pickId: (item: T) => TResult
): { value: TResult | null; skipped: BundleSkippedApplyItem | null } {
  if (items.length === 0) {
    return { value: null, skipped: null };
  }

  if (sourceResourceId) {
    const sourceMatch = items.find((item) => item.resourceId === sourceResourceId) ?? null;
    if (sourceMatch) {
      return { value: pickId(sourceMatch), skipped: null };
    }
  }

  if (items.length === 1) {
    return { value: pickId(items[0]!), skipped: null };
  }

  return {
    value: null,
    skipped: {
      kind,
      reason: "ambiguous",
      message: `Skipped auto-apply for ${label}: ambiguous imported resources.`,
    },
  };
}

export async function importBundleFile(params: {
  ownerId: string;
  fileName: string;
  buffer: Buffer;
}): Promise<{
  sourceResourceId?: string;
  created: {
    instructions: Array<{ resourceId: string; id: string; name: string }>;
    operationBlocks: Array<{ resourceId: string; blockId: string; name: string }>;
    operationProfiles: Array<{ resourceId: string; profileId: string; name: string }>;
    worldInfoBooks: Array<{ resourceId: string; id: string; name: string }>;
    entityProfiles: Array<{ resourceId: string; id: string; name: string }>;
    uiThemePresets: Array<{ resourceId: string; presetId: string; name: string }>;
    samplerPresets: Array<{ resourceId: string; presetId: string; name: string }>;
  };
  applied: BundleAppliedTargets;
  skippedApply: BundleSkippedApplyItem[];
  warnings: string[];
}> {
  const files: Record<string, { data: Buffer; mediaType: string; fileName: string }> = {};
  let bundle: TaleSpinnerBundle;

  if (looksLikeArchive(params.buffer)) {
    const decoded = await decodeBundleArchive(params.buffer);
    bundle = decoded.manifest;
    Object.assign(files, decoded.files);
  } else {
    const text = params.buffer.toString("utf8");
    const raw = JSON.parse(text) as unknown;
    const legacy = normalizeLegacyBundleInput(raw);
    bundle = legacy ?? parseTaleSpinnerBundle(raw);
  }

  validateBundleResourceGraph(bundle);

  const [existingInstructions, existingBlocks, existingProfiles, existingThemes] = await Promise.all([
    listInstructions({ ownerId: params.ownerId }),
    listOperationBlocks({ ownerId: params.ownerId }),
    listOperationProfiles({ ownerId: params.ownerId }),
    listUiThemePresets({ ownerId: params.ownerId }),
  ]);
  const existingSamplerPresets = await samplersService.samplers.getAll();

  const instructionNames = new Set(existingInstructions.map((item) => item.name));
  const blockNames = new Set(existingBlocks.map((item) => item.name));
  const profileNames = new Set(existingProfiles.map((item) => item.name));
  const themeNames = new Set(existingThemes.map((item) => item.name));
  const samplerPresetNames = new Set(existingSamplerPresets.map((item) => item.name));
  const blockIdMap = new Map<string, string>();

  const created = {
    instructions: [] as Array<{ resourceId: string; id: string; name: string }>,
    operationBlocks: [] as Array<{ resourceId: string; blockId: string; name: string }>,
    operationProfiles: [] as Array<{ resourceId: string; profileId: string; name: string }>,
    worldInfoBooks: [] as Array<{ resourceId: string; id: string; name: string }>,
    entityProfiles: [] as Array<{ resourceId: string; id: string; name: string }>,
    uiThemePresets: [] as Array<{ resourceId: string; presetId: string; name: string }>,
    samplerPresets: [] as Array<{ resourceId: string; presetId: string; name: string }>,
  };
  const warnings: string[] = [];

  for (const resource of bundle.resources.filter(isInstructionResource)) {
    const name = resolveImportedName(resource.payload.name, instructionNames, "copy");
    const createdInstruction =
      resource.payload.kind === "st_base"
        ? await createInstruction({
            ownerId: params.ownerId,
            name,
            kind: "st_base",
            stBase: resource.payload.stBase as StBaseConfig,
            meta: resource.payload.meta as InstructionMeta | undefined,
          })
        : await createInstruction({
            ownerId: params.ownerId,
            name,
            kind: "basic",
            templateText: resource.payload.templateText ?? "",
            meta: resource.payload.meta as InstructionMeta | undefined,
          });
    created.instructions.push({
      resourceId: resource.resourceId,
      id: createdInstruction.id,
      name: createdInstruction.name,
    });
  }

  for (const resource of bundle.resources.filter(isOperationBlockResource)) {
    const name = resolveImportedOperationBlockName(resource.payload.name, Array.from(blockNames));
    blockNames.add(name);
    const block = await createOperationBlock({
      ownerId: params.ownerId,
      input: {
        name,
        description: resource.payload.description,
        enabled: resource.payload.enabled,
        operations: resource.payload.operations,
        meta: resource.payload.meta,
      },
    });
    blockIdMap.set(resource.resourceId, block.blockId);
    created.operationBlocks.push({
      resourceId: resource.resourceId,
      blockId: block.blockId,
      name: block.name,
    });
  }

  for (const resource of bundle.resources.filter(isOperationProfileResource)) {
    const name = resolveImportedName(resource.payload.name, profileNames, "imported");
    const profile = await createOperationProfile({
      ownerId: params.ownerId,
      input: {
        name,
        description: resource.payload.description,
        enabled: resource.payload.enabled,
        executionMode: resource.payload.executionMode,
        operationProfileSessionId: resource.payload.operationProfileSessionId,
        blockRefs: resource.payload.blockRefs.map((ref) => ({
          blockId: blockIdMap.get(ref.resourceId) ?? ref.resourceId,
          enabled: ref.enabled,
          order: ref.order,
        })),
        meta: resource.payload.meta,
      },
    });
    created.operationProfiles.push({
      resourceId: resource.resourceId,
      profileId: profile.profileId,
      name: profile.name,
    });
  }

  for (const resource of bundle.resources.filter(isWorldInfoBookResource)) {
    const book = await createWorldInfoBook({
      ownerId: params.ownerId,
      name: resource.payload.name,
      slug: resource.payload.slug,
      description: resource.payload.description ?? null,
      data: resource.payload.data,
      extensions: resource.payload.extensions,
      source: resource.payload.source,
    });
    created.worldInfoBooks.push({
      resourceId: resource.resourceId,
      id: book.id,
      name: book.name,
    });
  }

  for (const resource of bundle.resources.filter(isEntityProfileResource)) {
    let avatarAssetId: string | undefined;
    if (resource.payload.avatarFile) {
      const file = files[resource.payload.avatarFile.path];
      if (file) {
        avatarAssetId = await saveEntityProfileAvatarPng(file.data);
      } else {
        warnings.push(`Missing archive file: ${resource.payload.avatarFile.path}`);
      }
    }
    const profile = await createEntityProfile({
      ownerId: params.ownerId,
      name: resource.payload.name,
      kind: "CharSpec",
      spec: resource.payload.spec,
      meta: resource.payload.meta,
      isFavorite: resource.payload.isFavorite,
      avatarAssetId,
    });
    created.entityProfiles.push({
      resourceId: resource.resourceId,
      id: profile.id,
      name: profile.name,
    });
  }

  for (const resource of bundle.resources.filter(isUiThemePresetResource)) {
    const name = resolveImportedPresetName(resource.payload.name, Array.from(themeNames));
    themeNames.add(name);
    const preset = await createUiThemePreset({
      ownerId: params.ownerId,
      name,
      description: resource.payload.description,
      payload: resource.payload.payload,
    });
    created.uiThemePresets.push({
      resourceId: resource.resourceId,
      presetId: preset.presetId,
      name: preset.name,
    });
  }

  for (const resource of bundle.resources.filter(isSamplerPresetResource)) {
    const presetId = randomUUID();
    const now = new Date().toISOString();
    const name = resolveImportedSamplerPresetName(resource.payload.name, Array.from(samplerPresetNames));
    samplerPresetNames.add(name);
    const preset = await samplersService.samplers.create({
      id: presetId,
      name,
      settings: resource.payload.settings,
      createdAt: now,
      updatedAt: now,
    });
    created.samplerPresets.push({
      resourceId: resource.resourceId,
      presetId: preset.id,
      name: preset.name,
    });
  }

  if (params.fileName.endsWith(".json") && params.buffer.toString("utf8").includes(UI_THEME_EXPORT_TYPE)) {
    warnings.push("Imported legacy UI theme preset format.");
  }

  const instructionApply = resolveAppliedTarget(
    created.instructions,
    bundle.sourceResourceId,
    "instruction",
    "instruction",
    (item) => item.id
  );
  const operationProfileApply = resolveAppliedTarget(
    created.operationProfiles,
    bundle.sourceResourceId,
    "operation_profile",
    "operation profile",
    (item) => item.profileId
  );
  const uiThemePresetApply = resolveAppliedTarget(
    created.uiThemePresets,
    bundle.sourceResourceId,
    "ui_theme_preset",
    "UI theme preset",
    (item) => item.presetId
  );
  const samplerPresetApply = resolveAppliedTarget(
    created.samplerPresets,
    bundle.sourceResourceId,
    "sampler_preset",
    "sampler preset",
    (item) => item.presetId
  );
  const entityProfileApply = resolveAppliedTarget(
    created.entityProfiles,
    bundle.sourceResourceId,
    "entity_profile",
    "entity profile",
    (item) => item.id
  );
  const worldInfoBookApply = resolveAppliedTarget(
    created.worldInfoBooks,
    bundle.sourceResourceId,
    "world_info_book",
    "world info book",
    (item) => item.id
  );
  const skippedApply = [
    instructionApply.skipped,
    operationProfileApply.skipped,
    uiThemePresetApply.skipped,
    samplerPresetApply.skipped,
    entityProfileApply.skipped,
    worldInfoBookApply.skipped,
  ].filter((item): item is BundleSkippedApplyItem => Boolean(item));

  return {
    sourceResourceId: bundle.sourceResourceId,
    created,
    applied: {
      instructionId: instructionApply.value,
      operationProfileId: operationProfileApply.value,
      uiThemePresetId: uiThemePresetApply.value,
      samplerPresetId: samplerPresetApply.value,
      entityProfileId: entityProfileApply.value,
      worldInfoBookId: worldInfoBookApply.value,
    },
    skippedApply,
    warnings,
  };
}
