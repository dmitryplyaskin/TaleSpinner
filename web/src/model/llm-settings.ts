import { createStore, createEvent, createEffect, sample } from "effector";
import { type TFunction } from "i18next";
import { debounce } from "patronum/debounce";

import { apiJson } from "../api/api-json";

export interface LLMSettingField {
  key: string;
  labelKey: string;
  tooltipKey: string;
  label: string;
  type: "range" | "number" | "text" | "switch" | "select";
  tooltip: string;
  width: 1 | 2 | 3;
  defaultValue: number | string | boolean;
  options?: Array<{ value: string; labelKey: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
}

export interface LLMSettingsState {
  temperature: number;
  topP: number;
  topK: number;
  frequencyPenalty: number;
  presencePenalty: number;
  repetitionPenalty: number;
  minP: number;
  topA: number;
  maxTokens: number;
  reasoning: {
    enabled: boolean;
    effort: "low" | "medium" | "high";
    maxTokens: number;
    exclude: boolean;
  };
}

export const defaultSettings: LLMSettingsState = {
  temperature: 1,
  topP: 1,
  topK: 0,
  frequencyPenalty: 0,
  presencePenalty: 0,
  repetitionPenalty: 1,
  minP: 0,
  topA: 0,
  maxTokens: 0,
  reasoning: {
    enabled: false,
    effort: "medium",
    maxTokens: 0,
    exclude: false,
  },
};

const llmSettingsFieldDefinitions: Array<Omit<LLMSettingField, "label" | "tooltip">> = [
  {
    key: "maxTokens",
    labelKey: "llmSettings.fields.maxTokens.label",
    type: "range",
    tooltipKey: "llmSettings.fields.maxTokens.tooltip",
    width: 3,
    defaultValue: 0,
    min: 0,
    max: 40000,
    step: 1,
  },
  {
    key: "temperature",
    labelKey: "llmSettings.fields.temperature.label",
    type: "range",
    tooltipKey: "llmSettings.fields.temperature.tooltip",
    width: 3,
    defaultValue: 1,
    min: 0,
    max: 2,
    step: 0.001,
  },
  {
    key: "topP",
    labelKey: "llmSettings.fields.topP.label",
    type: "range",
    tooltipKey: "llmSettings.fields.topP.tooltip",
    width: 3,
    defaultValue: 1,
    min: 0,
    max: 1,
    step: 0.001,
  },
  {
    key: "topK",
    labelKey: "llmSettings.fields.topK.label",
    type: "range",
    tooltipKey: "llmSettings.fields.topK.tooltip",
    width: 3,
    defaultValue: 0,
    min: 0,
    max: 200,
    step: 1,
  },
  {
    key: "frequencyPenalty",
    labelKey: "llmSettings.fields.frequencyPenalty.label",
    type: "range",
    tooltipKey: "llmSettings.fields.frequencyPenalty.tooltip",
    width: 3,
    defaultValue: 0,
    min: -2,
    max: 2,
    step: 0.001,
  },
  {
    key: "presencePenalty",
    labelKey: "llmSettings.fields.presencePenalty.label",
    type: "range",
    tooltipKey: "llmSettings.fields.presencePenalty.tooltip",
    width: 3,
    defaultValue: 0,
    min: -2,
    max: 2,
    step: 0.001,
  },
  {
    key: "repetitionPenalty",
    labelKey: "llmSettings.fields.repetitionPenalty.label",
    type: "range",
    tooltipKey: "llmSettings.fields.repetitionPenalty.tooltip",
    width: 3,
    defaultValue: 1,
    min: 0,
    max: 2,
    step: 0.001,
  },
  {
    key: "minP",
    labelKey: "llmSettings.fields.minP.label",
    type: "range",
    tooltipKey: "llmSettings.fields.minP.tooltip",
    width: 3,
    defaultValue: 0,
    min: 0,
    max: 1,
    step: 0.001,
  },
  {
    key: "topA",
    labelKey: "llmSettings.fields.topA.label",
    type: "range",
    tooltipKey: "llmSettings.fields.topA.tooltip",
    width: 3,
    defaultValue: 0,
    min: 0,
    max: 1,
    step: 0.001,
  },
  {
    key: "reasoning.enabled",
    labelKey: "llmSettings.fields.reasoningEnabled.label",
    type: "switch",
    tooltipKey: "llmSettings.fields.reasoningEnabled.tooltip",
    width: 3,
    defaultValue: false,
  },
  {
    key: "reasoning.effort",
    labelKey: "llmSettings.fields.reasoningEffort.label",
    type: "select",
    tooltipKey: "llmSettings.fields.reasoningEffort.tooltip",
    width: 3,
    defaultValue: "medium",
    options: [
      { value: "low", labelKey: "llmSettings.fields.reasoningEffort.options.low", label: "" },
      { value: "medium", labelKey: "llmSettings.fields.reasoningEffort.options.medium", label: "" },
      { value: "high", labelKey: "llmSettings.fields.reasoningEffort.options.high", label: "" },
    ],
  },
  {
    key: "reasoning.maxTokens",
    labelKey: "llmSettings.fields.reasoningMaxTokens.label",
    type: "number",
    tooltipKey: "llmSettings.fields.reasoningMaxTokens.tooltip",
    width: 3,
    defaultValue: 0,
    min: 0,
    step: 1,
  },
  {
    key: "reasoning.exclude",
    labelKey: "llmSettings.fields.reasoningExclude.label",
    type: "switch",
    tooltipKey: "llmSettings.fields.reasoningExclude.tooltip",
    width: 3,
    defaultValue: false,
  },
];

export const getLlmSettingsFields = (t: TFunction): LLMSettingField[] =>
  llmSettingsFieldDefinitions.map((field) => ({
    ...field,
    label: t(field.labelKey),
    tooltip: t(field.tooltipKey),
    options: field.options?.map((option) => ({
      ...option,
      label: t(option.labelKey),
    })),
  }));

// Events
export const updateLLMSettings = createEvent<Partial<LLMSettingsState>>();
export const resetLLMSettings = createEvent();

// Effects
export const fetchSettingsFx = createEffect(async () => {
  return apiJson<LLMSettingsState>("/settings");
});

export const saveSettingsFx = createEffect(
  async (settings: LLMSettingsState) => {
    return apiJson<LLMSettingsState>("/settings", {
      method: "POST",
      body: JSON.stringify(settings),
    });
  }
);

// Debounced save effect
export const debouncedSaveSettings = debounce({
  source: updateLLMSettings,
  timeout: 1000,
});

// Store
export const $llmSettings = createStore<LLMSettingsState>(defaultSettings);

// Store updates
$llmSettings
  .on(updateLLMSettings, (state, payload) => ({
    ...state,
    ...payload,
  }))
  .on(fetchSettingsFx.doneData, (_, payload) => payload)
  .reset(resetLLMSettings);

sample({
  source: $llmSettings,
  clock: debouncedSaveSettings,
  target: saveSettingsFx,
});
