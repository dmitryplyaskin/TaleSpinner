import { BaseFileData } from "./base-file";

export type WorldCreateTask = {
  worldType: WorldType;
  userPrompt?: string;
  lastWorldGenerationId?: string;
};

export interface CreatedWorldDraft {
  id: string;
  title: string;
  genre: string;
  tone: string[];
  unique_feature: string;
  synopsis: string;
  isFavorite?: boolean;
}

export interface PromptMessage {
  role: "user" | "assistant";
  content: string;
}

export type WorldType = "fantasy" | "cyberpunk" | "everyday" | "custom";
export interface WorldCreation extends BaseFileData {
  data: CreatedWorldDraft[];
  prompt: PromptMessage[];
  worldType: WorldType;
}
