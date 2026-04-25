import type {
  Part,
  PartChannel,
  PartLifespan,
  PartPayloadFormat,
  PartSource,
  PartVisibility,
} from "@shared/types/chat-entry-parts";

export type BatchUpdateEntryPartPayload = string | object | number | boolean | null;

export type ExistingBatchUpdateEntryPartPatch = {
  partId: string;
  clientPartId?: never;
  deleted: boolean;
  visibility: {
    ui: "always" | "never";
    prompt: boolean;
  };
  payload: BatchUpdateEntryPartPayload;
};

export type NewBatchUpdateEntryPartPatch = {
  partId?: never;
  clientPartId: string;
  deleted?: false;
  channel?: PartChannel;
  payloadFormat?: PartPayloadFormat;
  label?: string;
  visibility: {
    ui: "always" | "never";
    prompt: boolean;
  };
  payload: BatchUpdateEntryPartPayload;
};

export type BatchUpdateEntryPartPatch =
  | ExistingBatchUpdateEntryPartPatch
  | NewBatchUpdateEntryPartPatch;

export type BatchUpdateEntryPartsBody = {
  variantId: string;
  mainPartId: string;
  orderedPartIds: string[];
  parts: BatchUpdateEntryPartPatch[];
};

export type BatchUpdatePartPatchPlan = {
  partId: string;
  channel: PartChannel;
  order: number;
  payload: BatchUpdateEntryPartPayload;
  payloadFormat: PartPayloadFormat;
  schemaId?: string;
  label?: string;
  visibility: PartVisibility;
  replacesPartId: string | null;
  softDeleted: false;
  softDeletedAt: null;
  softDeletedBy: null;
};

export type BatchUpdatePartCreatePlan = {
  clientPartId: string;
  channel: PartChannel;
  order: number;
  payload: BatchUpdateEntryPartPayload;
  payloadFormat: PartPayloadFormat;
  schemaId?: string;
  label?: string;
  visibility: PartVisibility;
  ui: Part["ui"];
  prompt: Part["prompt"];
  lifespan: PartLifespan;
  createdTurn: number;
  source: PartSource;
  replacesPartId: string | null;
};

export type BatchUpdatePartPlan = {
  mainPartId: string;
  updatedPartIds: string[];
  deletedPartIds: string[];
  patches: BatchUpdatePartPatchPlan[];
  creates: BatchUpdatePartCreatePlan[];
};
