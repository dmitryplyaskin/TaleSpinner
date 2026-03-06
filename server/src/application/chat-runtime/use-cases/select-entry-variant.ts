import { HttpError } from "@core/middleware/error-handler";

import { getEntryById } from "../../../services/chat-entry-parts/entries-repository";
import { getVariantById, selectActiveVariant } from "../../../services/chat-entry-parts/variants-repository";

export type SelectEntryVariantInput = {
  entryId: string;
  variantId: string;
};

export type SelectEntryVariantResult = {
  entryId: string;
  activeVariantId: string;
};

export async function selectEntryVariant(
  params: SelectEntryVariantInput
): Promise<SelectEntryVariantResult> {
  const entry = await getEntryById({ entryId: params.entryId });
  if (!entry) throw new HttpError(404, "Entry не найден", "NOT_FOUND");

  const variant = await getVariantById({ variantId: params.variantId });
  if (!variant || variant.entryId !== entry.entryId) {
    throw new HttpError(404, "Variant не найден", "NOT_FOUND");
  }

  await selectActiveVariant({
    entryId: entry.entryId,
    variantId: params.variantId,
  });

  return {
    entryId: entry.entryId,
    activeVariantId: params.variantId,
  };
}
