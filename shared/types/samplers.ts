import {
  CommonModelItemType,
  CommonModelSettingsType,
} from "./common-model-types";

export type SamplerReasoningEffort = "low" | "medium" | "high";

export interface SamplerReasoningSettings {
  enabled?: boolean;
  effort?: SamplerReasoningEffort;
  maxTokens?: number;
  exclude?: boolean;
}

export interface SamplerItemSettingsType {
  temperature?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  repetitionPenalty?: number;
  minP?: number;
  topA?: number;
  maxTokens?: number;
  stopSequences?: string[];
  seed?: number;
  reasoning?: SamplerReasoningSettings;
  [key: string]: any;
}

export interface SamplersItemType extends CommonModelItemType {
  id: string;
  name: string;
  settings: SamplerItemSettingsType;
  createdAt: string;
  updatedAt: string;
}

export interface SamplersSettingsType extends CommonModelSettingsType {}
