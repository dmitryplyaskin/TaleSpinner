import { BaseFileData } from "./base-file";

export type LLMOutputLanguage = "ru" | "en";

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

// Токен API с реальным значением (только для бэкенда)
export interface StoredApiToken {
  id: string;
  name: string;
  value: string; // Реальное значение токена
  isActive: boolean;
  createdAt: string;
}

// Хранилище токенов на бэкенде
export interface TokenStorage {
  tokens: StoredApiToken[];
}

export interface ApiSettingsStorage extends BaseFileData {
  api: {
    provider: "openrouter";
    model: string;
    providerOrder: string[];
  };
  tokens: StoredApiToken[];
  rag: {
    enabled: boolean;
    model: string;
  };
  responseGeneration: {
    enabled: boolean;
    model: string;
  };
  embedding: {
    enabled: boolean;
    model: string;
  };
  llmOutputLanguage: LLMOutputLanguage;
}

// Для обратной совместимости
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
  llmOutputLanguage: LLMOutputLanguage;
}
