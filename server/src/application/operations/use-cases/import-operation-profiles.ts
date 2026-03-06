import { validateOperationProfileImport } from "../../../services/operations/operation-profile-validator";
import {
  createOperationBlock,
  listOperationBlocks,
  resolveImportedOperationBlockName,
} from "../../../services/operations/operation-blocks-repository";
import {
  createOperationProfile,
  listOperationProfiles,
} from "../../../services/operations/operation-profiles-repository";

function resolveImportedProfileName(input: string, existingNames: string[]): string {
  const base = input.trim() || "Imported profile";
  if (!existingNames.includes(base)) return base;
  for (let idx = 2; idx <= 9999; idx += 1) {
    const candidate = `${base} (imported ${idx})`;
    if (!existingNames.includes(candidate)) return candidate;
  }
  return `${base} (imported ${Date.now()})`;
}

export async function importOperationProfiles(params: {
  ownerId: string;
  items: unknown[];
}): Promise<{
  created: Array<Awaited<ReturnType<typeof createOperationProfile>>>;
}> {
  const existingProfiles = await listOperationProfiles({ ownerId: params.ownerId });
  const existingBlocks = await listOperationBlocks({ ownerId: params.ownerId });
  const profileNames = new Set(existingProfiles.map((item) => item.name));
  const blockNames = new Set(existingBlocks.map((item) => item.name));

  const created = [];
  for (const raw of params.items) {
    const validated = validateOperationProfileImport(raw);
    if (validated.kind === "legacy_v1") {
      const safeBlockName = resolveImportedOperationBlockName(
        `${validated.legacyProfile.name} block`,
        Array.from(blockNames)
      );
      blockNames.add(safeBlockName);
      const block = await createOperationBlock({
        ownerId: params.ownerId,
        input: {
          name: safeBlockName,
          description: validated.legacyProfile.description,
          enabled: true,
          operations: validated.legacyProfile.operations,
          meta: validated.legacyProfile.meta,
        },
      });
      const safeProfileName = resolveImportedProfileName(
        validated.legacyProfile.name,
        Array.from(profileNames)
      );
      profileNames.add(safeProfileName);
      const profile = await createOperationProfile({
        ownerId: params.ownerId,
        input: {
          name: safeProfileName,
          description: validated.legacyProfile.description,
          enabled: validated.legacyProfile.enabled,
          executionMode: validated.legacyProfile.executionMode,
          operationProfileSessionId: validated.legacyProfile.operationProfileSessionId,
          blockRefs: [
            {
              blockId: block.blockId,
              enabled: true,
              order: 0,
            },
          ],
          meta: undefined,
        },
      });
      created.push(profile);
      continue;
    }

    const blockIdMap = new Map<string, string>();
    for (const block of validated.blocks) {
      const safeBlockName = resolveImportedOperationBlockName(
        block.name,
        Array.from(blockNames)
      );
      blockNames.add(safeBlockName);
      const createdBlock = await createOperationBlock({
        ownerId: params.ownerId,
        input: {
          name: safeBlockName,
          description: block.description,
          enabled: block.enabled,
          operations: block.operations,
          meta: block.meta,
        },
      });
      if (typeof block.importBlockId === "string") {
        blockIdMap.set(block.importBlockId, createdBlock.blockId);
      }
    }

    const mappedRefs = validated.profile.blockRefs.map((ref) => ({
      ...ref,
      blockId: blockIdMap.get(ref.blockId) ?? ref.blockId,
    }));
    const safeProfileName = resolveImportedProfileName(
      validated.profile.name,
      Array.from(profileNames)
    );
    profileNames.add(safeProfileName);
    const profile = await createOperationProfile({
      ownerId: params.ownerId,
      input: {
        ...validated.profile,
        name: safeProfileName,
        blockRefs: mappedRefs,
      },
    });
    created.push(profile);
  }

  return { created };
}
