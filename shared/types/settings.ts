export enum ApiProvider {
  OPEN_ROUTER = "openrouter",
}

export type LLMOutputLanguage = "ru" | "en";

// Токен API (без реального значения для безопасности)
export interface ApiToken {
  id: string;
  name: string; // Название токена (например "Рабочий", "Личный")
  isActive: boolean; // Активный ли токен
}

// Запрос на создание нового токена
export interface CreateTokenRequest {
  name: string;
  value: string; // Реальное значение токена (отправляется только при создании)
}

// Запрос на обновление токена
export interface UpdateTokenRequest {
  name?: string;
}

// Список провайдеров для provider.order в OpenRouter
export const OPENROUTER_PROVIDERS = [
  "OpenAI",
  "Anthropic",
  "Google",
  "Amazon Bedrock",
  "Azure",
  "Groq",
  "Mistral",
  "Together",
  "Fireworks",
  "DeepInfra",
  "Lepton",
  "Novita",
  "Avian",
  "Lambda",
  "AnyScale",
  "Replicate",
  "Perplexity",
  "Recursal",
  "OctoAI",
  "DeepSeek",
  "Infermatic",
  "AI21",
  "Featherless",
  "Mancer",
  "Mancer 2",
  "Lynn 2",
  "Lynn",
] as const;

export type OpenRouterProviderName = (typeof OPENROUTER_PROVIDERS)[number];

export interface ApiSettings {
  provider: ApiProvider;
  tokens: ApiToken[]; // Массив токенов (без реальных значений)
  activeTokenId: string | null; // ID активного токена
  model: string;
  providerOrder: string[]; // Массив провайдеров для provider.order
}

export interface RagSettings {
  enabled: boolean;
  model: string;
}

export interface EmbeddingSettings {
  enabled: boolean;
  model: string;
}

export interface ResponseGenerationSettings {
  enabled: boolean;
  model: string;
}

export interface AppSettings {
  api: ApiSettings;
  rag: RagSettings;
  embedding: EmbeddingSettings;
  responseGeneration: ResponseGenerationSettings;
  llmOutputLanguage: LLMOutputLanguage;
}

export const DEFAULT_SETTINGS: AppSettings = {
  api: {
    provider: ApiProvider.OPEN_ROUTER,
    tokens: [],
    activeTokenId: null,
    model: "",
    providerOrder: [],
  },
  rag: {
    enabled: false,
    model: "",
  },
  embedding: {
    enabled: false,
    model: "",
  },
  responseGeneration: {
    enabled: false,
    model: "",
  },
  llmOutputLanguage: "ru",
};

// Модель OpenRouter
export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  top_provider?: {
    max_completion_tokens?: number;
    is_moderated: boolean;
  };
}

export interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}
