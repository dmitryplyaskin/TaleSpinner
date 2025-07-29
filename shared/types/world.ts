import { BaseFileData } from "./base-file";

export type WorldCreateTask = {
  worldType: WorldType;
  userPrompt?: string;
};

export type WorldType = "fantasy" | "cyberpunk" | "everyday" | "custom";
export interface World extends BaseFileData {
  name: string;
  description?: string;
  image?: string;
  worldType: WorldType;
  worldInfo: WorldInfo;
}

export interface WorldInfo {
  instructions: string;
  mainInfo: string;
}
