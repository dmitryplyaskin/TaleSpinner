import { HttpError } from "@core/middleware/error-handler";

import { getEntryById, updateEntryMeta } from "../../../services/chat-entry-parts/entries-repository";

import { mergeEntryPromptVisibilityMeta } from "../chat-entry-helpers";

export type SetEntryPromptVisibilityInput = {
  entryId: string;
  includeInPrompt: boolean;
};

export type SetEntryPromptVisibilityResult = {
  id: string;
  includeInPrompt: boolean;
};

export async function setEntryPromptVisibility(
  params: SetEntryPromptVisibilityInput
): Promise<SetEntryPromptVisibilityResult> {
  const entry = await getEntryById({ entryId: params.entryId });
  if (!entry) throw new HttpError(404, "Entry не найден", "NOT_FOUND");

  const nextMeta = mergeEntryPromptVisibilityMeta({
    existingMeta: entry.meta,
    includeInPrompt: params.includeInPrompt,
  });

  await updateEntryMeta({
    entryId: entry.entryId,
    meta: nextMeta,
  });

  return {
    id: entry.entryId,
    includeInPrompt: params.includeInPrompt,
  };
}
