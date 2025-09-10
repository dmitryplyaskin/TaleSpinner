import { BaseFileData } from "./base-file";
import { Character } from "./character";

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

export type WorldCustomizationData = {
  title: string;
  genre: string;
  toneText: string;
  synopsis: string;
  unique_feature: string;

  racesEnabled?: boolean;
  racesCount?: number;
  racesDescription?: string;

  timelineEnabled?: boolean;
  timelineDescription?: string;

  magicEnabled?: boolean;
  magicDescription?: string;

  locationsEnabled?: boolean;
  locationsCount?: number;
  locationsDescription?: string;

  factionsEnabled?: boolean;
  factionsCount?: number;
  factionsDescription?: string;
};

export type WorldPrimer = {
  name: string;
  genre: string;
  tone: string;
  world_primer: string;
  locations?: Array<{
    name: string;
    description: string;
  }>;
  races?: Array<{
    name: string;
    description: string;
  }>;
  factions?: Array<{
    name: string;
    description: string;
  }>;
  history?: string;
  detailed_elements: {
    races?: {
      races: Array<{
        name: string;
        description: string;
        relationship_to_conflict: string;
        special_abilities: string;
        social_structure: string;
      }>;
    };
    timeline?: {
      historical_events: Array<{
        name: string;
        timeframe: string;
        description: string;
        impact_on_present: string;
      }>;
    };
    locations?: {
      locations: Array<{
        name: string;
        type: string;
        appearance: string;
        history: string;
        inhabitants: string;
        significance: string;
        features_and_secrets: string;
        adventure_opportunities: string;
      }>;
    };
    factions?: {
      factions: Array<{
        name: string;
        type: string;
        ideology_and_goals: string;
        structure: string;
        key_leaders: string;
        methods: string;
        relationships: string;
        role_in_conflict: string;
        resources_and_influence: string;
      }>;
    };
  };
  characters?: {
    userCharacter?: Character;
  };
  id: string;
  createdAt: string;
  updatedAt: string;
};
