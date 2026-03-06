import { HttpError } from "@core/middleware/error-handler";

import { withDbTransaction } from "../../../db/client";
import { getPartWithVariantContextById, softDeletePart } from "../../../services/chat-entry-parts/parts-repository";
import { listEntryVariants } from "../../../services/chat-entry-parts/variants-repository";

import {
  isCanonicalizationPart,
  resolveActiveUndoCascade,
  resolveRestoredPartId,
} from "../chat-entry-helpers";

export type UndoPartCanonicalizationInput = {
  partId: string;
  body: {
    by: "user" | "agent";
  };
};

export type UndoPartCanonicalizationResult = {
  undonePartIds: string[];
  restoredPartId: string | null;
  entryId: string;
};

export async function undoPartCanonicalization(
  params: UndoPartCanonicalizationInput
): Promise<UndoPartCanonicalizationResult> {
  const context = await getPartWithVariantContextById({ partId: params.partId });
  if (!context) throw new HttpError(404, "Part не найден", "NOT_FOUND");
  if (context.part.softDeleted) {
    throw new HttpError(400, "Part уже удалён", "VALIDATION_ERROR");
  }
  if (!isCanonicalizationPart(context.part)) {
    throw new HttpError(400, "Part не является canonicalization replacement", "VALIDATION_ERROR");
  }

  const variants = await listEntryVariants({ entryId: context.entryId });
  const variant = variants.find((item) => item.variantId === context.variantId) ?? null;
  if (!variant) {
    throw new HttpError(404, "Variant не найден", "NOT_FOUND");
  }

  const undonePartIds = resolveActiveUndoCascade({
    startPartId: context.part.partId,
    parts: variant.parts ?? [],
  });
  if (!undonePartIds.includes(context.part.partId)) {
    throw new HttpError(400, "Не удалось построить цепочку отката", "VALIDATION_ERROR");
  }

  await withDbTransaction((tx) => {
    for (const partId of undonePartIds) {
      softDeletePart({
        partId,
        by: params.body.by,
        executor: tx,
      });
    }
  });

  const restoredPartId = resolveRestoredPartId({
    startReplacesPartId: context.part.replacesPartId,
    parts: variant.parts ?? [],
    undonePartIds,
  });

  return {
    undonePartIds,
    restoredPartId,
    entryId: context.entryId,
  };
}
