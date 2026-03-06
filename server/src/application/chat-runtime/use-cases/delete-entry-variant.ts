import { HttpError } from "@core/middleware/error-handler";

import { getEntryById } from "../../../services/chat-entry-parts/entries-repository";
import { deleteVariant, getVariantById, listEntryVariants } from "../../../services/chat-entry-parts/variants-repository";

export type DeleteEntryVariantInput = {
  entryId: string;
  variantId: string;
};

export type DeleteEntryVariantResult = {
  entryId: string;
  activeVariantId: string;
  deletedVariantId: string;
};

export async function deleteEntryVariant(
  params: DeleteEntryVariantInput
): Promise<DeleteEntryVariantResult> {
  const entry = await getEntryById({ entryId: params.entryId });
  if (!entry) throw new HttpError(404, "Entry не найден", "NOT_FOUND");

  const variant = await getVariantById({ variantId: params.variantId });
  if (!variant || variant.entryId !== entry.entryId) {
    throw new HttpError(404, "Variant не найден", "NOT_FOUND");
  }

  const variants = await listEntryVariants({ entryId: entry.entryId });
  if (variants.length <= 1) {
    throw new HttpError(400, "Нельзя удалить последний вариант", "VALIDATION_ERROR");
  }

  return deleteVariant({
    entryId: entry.entryId,
    variantId: params.variantId,
  });
}
