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
    nowMs: Date.now(),
  });

  await applyPartMutableBatchPatches({
    variantId: activeVariant.variantId,
    patches: plan.patches,
  });

  return {
    entryId: entry.entryId,
    variantId: activeVariant.variantId,
    mainPartId: plan.mainPartId,
    updatedPartIds: plan.updatedPartIds,
    deletedPartIds: plan.deletedPartIds,
  };
}
