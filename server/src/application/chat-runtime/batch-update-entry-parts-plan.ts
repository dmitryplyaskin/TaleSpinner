import { HttpError } from "@core/middleware/error-handler";

import type {
  BatchUpdateEntryPartPatch,
  BatchUpdateEntryPartPayload,
  BatchUpdateEntryPartsBody,
  BatchUpdatePartCreatePlan,
  BatchUpdatePartPatchPlan,
  BatchUpdatePartPlan,
  ExistingBatchUpdateEntryPartPatch,
} from "./batch-update-entry-parts-types";
import type { Entry, Part, PartChannel, PartPayloadFormat, PartVisibility } from "@shared/types/chat-entry-parts";

type PlannedBatchPartState = {
  refId: string;
  partId: string | null;
  clientPartId: string | null;
  channel: PartChannel;
  order: number;
  payload: BatchUpdateEntryPartPayload;
  payloadFormat: PartPayloadFormat;
  schemaId?: string;
  label?: string;
  visibility: PartVisibility;
  replacesPartId: string | null;
  deleted: boolean;
  createdTurn: number;
};

function normalizeReplacesPartId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function assertUniquePartIds(ids: string[], label: string): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      throw new HttpError(400, `Duplicate ${label} item`, "VALIDATION_ERROR", {
        partId: id,
      });
    }
    seen.add(id);
  }
}

function normalizePayloadByFormat(params: {
  payloadFormat: PartPayloadFormat;
  payload: unknown;
  partId: string;
}): BatchUpdateEntryPartPayload {
  if (params.payloadFormat === "text" || params.payloadFormat === "markdown") {
    if (typeof params.payload !== "string") {
      throw new HttpError(400, "Text/markdown part payload must be a string", "VALIDATION_ERROR", {
        partId: params.partId,
      });
    }
    return params.payload;
  }

  if (params.payloadFormat === "json") {
    if (
      params.payload === null ||
      typeof params.payload === "string" ||
      typeof params.payload === "number" ||
      typeof params.payload === "boolean" ||
      typeof params.payload === "object"
    ) {
      return params.payload as BatchUpdateEntryPartPayload;
    }
  }

  throw new HttpError(400, "Unsupported payload type for part format", "VALIDATION_ERROR", {
    partId: params.partId,
    payloadFormat: params.payloadFormat,
  });
}

function isPartDependentOnTarget(params: {
  refId: string;
  targetRefId: string;
  byRefId: Map<string, PlannedBatchPartState>;
}): boolean {
  const visited = new Set<string>();
  let cursor = params.byRefId.get(params.refId)?.replacesPartId ?? null;
  while (cursor) {
    if (cursor === params.targetRefId) return true;
    if (visited.has(cursor)) break;
    visited.add(cursor);
    cursor = params.byRefId.get(cursor)?.replacesPartId ?? null;
  }
  return false;
}

function isStringMainPayloadFormat(format: PartPayloadFormat): boolean {
  return format === "text" || format === "markdown";
}

function patchRefId(patch: BatchUpdateEntryPartPatch): string {
  if ("partId" in patch && typeof patch.partId === "string") return patch.partId;
  return patch.clientPartId;
}

function isExistingPatch(
  patch: BatchUpdateEntryPartPatch
): patch is ExistingBatchUpdateEntryPartPatch {
  return "partId" in patch && typeof patch.partId === "string";
}

function normalizeNewPartFormat(format: PartPayloadFormat | undefined): PartPayloadFormat {
  return format ?? "markdown";
}

function normalizeNewPartChannel(channel: PartChannel | undefined): PartChannel {
  return channel ?? "aux";
}

function defaultUiForFormat(format: PartPayloadFormat): Part["ui"] {
  return { rendererId: format === "json" ? "json" : format };
}

function defaultPromptForFormat(format: PartPayloadFormat): Part["prompt"] {
  if (format === "json") return { serializerId: "asJson" };
  if (format === "markdown") return { serializerId: "asMarkdown" };
  return { serializerId: "asText" };
}

export function assertBatchUpdateVariantIsActive(params: {
  entry: Entry;
  requestedVariantId: string;
}): void {
  if (params.entry.activeVariantId === params.requestedVariantId) return;
  throw new HttpError(409, "Variant mismatch: active variant has changed", "CONFLICT", {
    activeVariantId: params.entry.activeVariantId,
    requestedVariantId: params.requestedVariantId,
  });
}

export function buildBatchUpdatePartPlan(params: {
  variantParts: Part[];
  body: BatchUpdateEntryPartsBody;
}): BatchUpdatePartPlan {
  const activeParts = (params.variantParts ?? []).filter((part) => !part.softDeleted);
  if (activeParts.length === 0) {
    throw new HttpError(400, "No active parts in variant", "VALIDATION_ERROR");
  }

  const activeById = new Map(activeParts.map((part) => [part.partId, part] as const));
  const requestedRefIds = params.body.parts.map(patchRefId);
  assertUniquePartIds(requestedRefIds, "parts");

  const existingPatches = params.body.parts.filter(isExistingPatch);
  const requestedExistingIds = existingPatches.map((item) => item.partId);
  for (const partId of requestedExistingIds) {
    if (!activeById.has(partId)) {
      throw new HttpError(404, "Part не найден", "NOT_FOUND", { partId });
    }
  }
  if (requestedExistingIds.length !== activeParts.length) {
    throw new HttpError(400, "Request must include all active variant parts", "VALIDATION_ERROR");
  }

  const requestPatchByRefId = new Map(params.body.parts.map((item) => [patchRefId(item), item] as const));
  const plannedByRefId = new Map<string, PlannedBatchPartState>();
  const createdTurn = activeParts.reduce((max, part) => Math.max(max, part.createdTurn), 0);

  for (const activePart of activeParts) {
    const patch = requestPatchByRefId.get(activePart.partId);
    if (!patch || !isExistingPatch(patch)) {
      throw new HttpError(400, "Missing part in batch update request", "VALIDATION_ERROR", {
        partId: activePart.partId,
      });
    }

    plannedByRefId.set(activePart.partId, {
      refId: activePart.partId,
      partId: activePart.partId,
      clientPartId: null,
      channel: activePart.channel,
      order: activePart.order,
      payload: normalizePayloadByFormat({
        payloadFormat: activePart.payloadFormat,
        payload: patch.payload,
        partId: activePart.partId,
      }),
      payloadFormat: activePart.payloadFormat,
      schemaId: activePart.schemaId,
      label: activePart.label,
      visibility: {
        ui: patch.visibility.ui,
        prompt: patch.visibility.prompt,
      },
      replacesPartId: normalizeReplacesPartId(activePart.replacesPartId),
      deleted: patch.deleted,
      createdTurn: activePart.createdTurn,
    });
  }

  for (const patch of params.body.parts) {
    if (isExistingPatch(patch)) continue;
    const format = normalizeNewPartFormat(patch.payloadFormat);
    plannedByRefId.set(patch.clientPartId, {
      refId: patch.clientPartId,
      partId: null,
      clientPartId: patch.clientPartId,
      channel: normalizeNewPartChannel(patch.channel),
      order: 0,
      payload: normalizePayloadByFormat({
        payloadFormat: format,
        payload: patch.payload,
        partId: patch.clientPartId,
      }),
      payloadFormat: format,
      label: patch.label,
      visibility: {
        ui: patch.visibility.ui,
        prompt: patch.visibility.prompt,
      },
      replacesPartId: null,
      deleted: false,
      createdTurn,
    });
  }

  const nonDeletedPartIds = Array.from(plannedByRefId.values())
    .filter((part) => !part.deleted)
    .map((part) => part.refId);
  if (nonDeletedPartIds.length === 0) {
    throw new HttpError(400, "At least one part must remain active", "VALIDATION_ERROR");
  }

  const mainPart = plannedByRefId.get(params.body.mainPartId);
  if (!mainPart || mainPart.deleted) {
    throw new HttpError(400, "mainPartId must reference an active part", "VALIDATION_ERROR", {
      mainPartId: params.body.mainPartId,
    });
  }
  if (!isStringMainPayloadFormat(mainPart.payloadFormat) || typeof mainPart.payload !== "string") {
    throw new HttpError(400, "Main part must be text/markdown with string payload", "VALIDATION_ERROR", {
      mainPartId: params.body.mainPartId,
    });
  }

  assertUniquePartIds(params.body.orderedPartIds, "orderedPartIds");
  const orderedSet = new Set(params.body.orderedPartIds);
  const nonDeletedSet = new Set(nonDeletedPartIds);
  if (orderedSet.size !== nonDeletedSet.size) {
    throw new HttpError(
      400,
      "orderedPartIds must match the set of non-deleted parts",
      "VALIDATION_ERROR"
    );
  }
  for (const partId of orderedSet) {
    if (!nonDeletedSet.has(partId)) {
      throw new HttpError(
        400,
        "orderedPartIds must match the set of non-deleted parts",
        "VALIDATION_ERROR",
        { partId }
      );
    }
  }

  mainPart.channel = "main";
  mainPart.replacesPartId = null;

  const deletedRefIds = new Set(
    Array.from(plannedByRefId.values())
      .filter((part) => part.deleted)
      .map((part) => part.refId)
  );

  for (const plannedPart of plannedByRefId.values()) {
    if (plannedPart.deleted) continue;
    if (plannedPart.refId !== params.body.mainPartId && plannedPart.channel === "main") {
      plannedPart.channel = "aux";
    }
    if (plannedPart.replacesPartId && deletedRefIds.has(plannedPart.replacesPartId)) {
      plannedPart.replacesPartId = null;
    }
  }

  for (const plannedPart of plannedByRefId.values()) {
    if (plannedPart.deleted) continue;
    if (plannedPart.refId === params.body.mainPartId) continue;
    if (
      isPartDependentOnTarget({
        refId: plannedPart.refId,
        targetRefId: params.body.mainPartId,
        byRefId: plannedByRefId,
      })
    ) {
      plannedPart.replacesPartId = null;
    }
  }

  let nextOrder = 0;
  for (const partId of params.body.orderedPartIds) {
    const plannedPart = plannedByRefId.get(partId);
    if (!plannedPart || plannedPart.deleted) continue;
    plannedPart.order = nextOrder;
    nextOrder += 10;
  }

  const activePlans = Array.from(plannedByRefId.values()).filter((part) => !part.deleted);
  const patches: BatchUpdatePartPatchPlan[] = activePlans
    .filter((plannedPart) => plannedPart.partId)
    .map((plannedPart) => ({
      partId: plannedPart.partId as string,
      channel: plannedPart.channel,
      order: plannedPart.order,
      payload: plannedPart.payload,
      payloadFormat: plannedPart.payloadFormat,
      schemaId: plannedPart.schemaId,
      label: plannedPart.label,
      visibility: plannedPart.visibility,
      replacesPartId: plannedPart.replacesPartId,
      softDeleted: false,
      softDeletedAt: null,
      softDeletedBy: null,
    }));

  const creates: BatchUpdatePartCreatePlan[] = activePlans
    .filter((plannedPart) => plannedPart.clientPartId)
    .map((plannedPart) => ({
      clientPartId: plannedPart.clientPartId as string,
      channel: plannedPart.channel,
      order: plannedPart.order,
      payload: plannedPart.payload,
      payloadFormat: plannedPart.payloadFormat,
      schemaId: plannedPart.schemaId,
      label: plannedPart.label,
      visibility: plannedPart.visibility,
      ui: defaultUiForFormat(plannedPart.payloadFormat),
      prompt: defaultPromptForFormat(plannedPart.payloadFormat),
      lifespan: "infinite",
      createdTurn: plannedPart.createdTurn,
      source: "user",
      replacesPartId: plannedPart.replacesPartId,
    }));

  const deletedPartIds = Array.from(plannedByRefId.values())
    .filter((item) => item.deleted && item.partId)
    .map((item) => item.partId as string);

  return {
    mainPartId: params.body.mainPartId,
    updatedPartIds: patches.map((item) => item.partId),
    deletedPartIds,
    patches,
    creates,
  };
}
