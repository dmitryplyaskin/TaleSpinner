import { HttpError } from "@core/middleware/error-handler";

import { getActiveVariantWithParts, getEntryById } from "../../../services/chat-entry-parts/entries-repository";
import { applyPartMutableBatchPatches } from "../../../services/chat-entry-parts/parts-repository";
import {
  assertBatchUpdateVariantIsActive,
  buildBatchUpdatePartPlan,
  type BatchUpdateEntryPartsBody,
} from "../chat-entry-helpers";

export type BatchUpdateEntryPartsInput = {
  entryId: string;
  body: BatchUpdateEntryPartsBody;
};

export type BatchUpdateEntryPartsResult = {
  entryId: string;
  variantId: string;
  mainPartId: string;
  updatedPartIds: string[];
  deletedPartIds: string[];
  createdParts: Array<{ clientPartId: string; partId: string }>;
};

export async function batchUpdateEntryParts(
  params: BatchUpdateEntryPartsInput
): Promise<BatchUpdateEntryPartsResult> {
  const entry = await getEntryById({ entryId: params.entryId });
  if (!entry) throw new HttpError(404, "Entry не найден", "NOT_FOUND");

  assertBatchUpdateVariantIsActive({
    entry,
    requestedVariantId: params.body.variantId,
  });

  const activeVariant = await getActiveVariantWithParts({ entry });
  if (!activeVariant) {
    throw new HttpError(404, "Active variant не найден", "NOT_FOUND");
  }

  const plan = buildBatchUpdatePartPlan({
    variantParts: activeVariant.parts ?? [],
    body: params.body,
  });

  const applyResult = await applyPartMutableBatchPatches({
    variantId: activeVariant.variantId,
    patches: plan.patches,
    creates: plan.creates,
    deletePartIds: plan.deletedPartIds,
  });
  const createdPartIdByClientId = new Map(
    applyResult.createdParts.map((item) => [item.clientPartId, item.partId] as const)
  );

  return {
    entryId: entry.entryId,
    variantId: activeVariant.variantId,
    mainPartId: createdPartIdByClientId.get(plan.mainPartId) ?? plan.mainPartId,
    updatedPartIds: plan.updatedPartIds,
    deletedPartIds: plan.deletedPartIds,
    createdParts: applyResult.createdParts,
  };
}
