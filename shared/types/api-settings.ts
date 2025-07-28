import { BaseFileData } from "./base-file";

export interface ApiSettings extends BaseFileData {
  api: {
    token: string;
    provider: "openrouter";
    model: string;
  };
  rag: {
    enabled: boolean;
    model: string;
  };
  embedding: {
    enabled: boolean;
    model: string;
  };
  responseGeneration: {
    enabled: boolean;
    model: string;
  };
}
