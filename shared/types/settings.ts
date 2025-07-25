export enum ApiProvider {
  OPEN_ROUTER = "openrouter",
}

export interface ApiSettings {
  provider: ApiProvider;
  token: string;
  model: string;
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
}

export const DEFAULT_SETTINGS: AppSettings = {
  api: {
    provider: ApiProvider.OPEN_ROUTER,
    token: "",
    model: "",
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
};
