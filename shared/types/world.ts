import { BaseFileData } from "./base-file";

export type WorldType = "fantasy";
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
