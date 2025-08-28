import { BaseFileData } from "./base-file";

export type ProviderSettings = {
  temperature: number;
  topP: number;
  topK: number;
  maxTokens: number;
  frequencyPenalty: number;
  presencePenalty: number;
};

export type OpenRouterProvider = {
  type: "openrouter";
  model: string;
  token: string;
  settings: ProviderSettings;
};

export type AnthropicProvider = {
  type: "anthropic";
  model: string;
  token: string;
  settings: ProviderSettings;
};

export type OpenAIProvider = {
  type: "openai";
  model: string;
  token: string;
  settings: ProviderSettings;
};

export type CustomOpenAIProvider = {
  type: "custom-openai";
  url: string;
  model?: string;
  token?: string;
  settings: ProviderSettings;
};

export type OllamaProvider = {
  type: "ollama";
  url: string;
  model?: string;
  token?: string;
  settings: ProviderSettings;
};

export type Provider =
  | OpenRouterProvider
  | AnthropicProvider
  | OpenAIProvider
  | CustomOpenAIProvider
  | OllamaProvider;

export interface ApiSettings extends BaseFileData {
  api: Provider;
  rag: {
    enabled: boolean;
    api: Provider;
  };
  responseGeneration: {
    enabled: boolean;
    api: Provider;
  };
  embedding: {
    enabled: boolean;
    model: string;
  };
}
