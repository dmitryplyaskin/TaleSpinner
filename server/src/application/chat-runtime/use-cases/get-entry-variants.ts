import { HttpError } from "@core/middleware/error-handler";

import { getEntryById } from "../../../services/chat-entry-parts/entries-repository";
import { listEntryVariants } from "../../../services/chat-entry-parts/variants-repository";

import type { Variant } from "@shared/types/chat-entry-parts";

export type GetEntryVariantsInput = {
  entryId: string;
};

export async function getEntryVariants(
  params: GetEntryVariantsInput
): Promise<Variant[]> {
  const entry = await getEntryById({ entryId: params.entryId });
  if (!entry) throw new HttpError(404, "Entry не найден", "NOT_FOUND");

  return listEntryVariants({ entryId: entry.entryId });
}
