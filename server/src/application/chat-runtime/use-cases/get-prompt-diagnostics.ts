import { HttpError } from "@core/middleware/error-handler";

import {
  getGenerationByIdWithDebug,
} from "../../../services/chat-core/generations-repository";
import { getEntryById } from "../../../services/chat-entry-parts/entries-repository";
import { getVariantById } from "../../../services/chat-entry-parts/variants-repository";

import {
  buildPromptDiagnosticsFromDebug,
  buildPromptDiagnosticsFromSnapshot,
  isRecord,
} from "../chat-entry-helpers";

import type { PromptDiagnosticsResponse } from "../chat-entry-helpers";

export type GetPromptDiagnosticsInput = {
  entryId: string;
  variantId?: string;
};

export async function getPromptDiagnostics(
  params: GetPromptDiagnosticsInput
): Promise<PromptDiagnosticsResponse> {
  const entry = await getEntryById({ entryId: params.entryId });
  if (!entry) throw new HttpError(404, "Entry не найден", "NOT_FOUND");
  if (entry.role !== "assistant") {
    throw new HttpError(400, "Prompt diagnostics доступны только для assistant entry", "VALIDATION_ERROR");
  }

  const variantId = params.variantId ?? entry.activeVariantId;
  const variant = await getVariantById({ variantId });
  if (!variant || variant.entryId !== entry.entryId) {
    throw new HttpError(404, "Variant не найден", "NOT_FOUND");
  }

  const derived = isRecord(variant.derived) ? variant.derived : {};
  const generationId = typeof derived.generationId === "string" ? derived.generationId : null;
  if (!generationId) {
    throw new HttpError(404, "Prompt diagnostics не найдены для варианта", "NOT_FOUND");
  }

  const generation = await getGenerationByIdWithDebug(generationId);
  if (!generation) {
    throw new HttpError(404, "Generation не найдена", "NOT_FOUND");
  }

  const fromDebug = buildPromptDiagnosticsFromDebug({
    generation,
    entryId: entry.entryId,
    variantId: variant.variantId,
  });
  if (fromDebug) return fromDebug;

  const fromSnapshot = buildPromptDiagnosticsFromSnapshot({
    generation,
    entryId: entry.entryId,
    variantId: variant.variantId,
  });
  if (fromSnapshot) return fromSnapshot;

  throw new HttpError(404, "Prompt diagnostics недоступны", "NOT_FOUND");
}
