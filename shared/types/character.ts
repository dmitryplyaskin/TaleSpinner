import { BaseFileData } from "./base-file";

export interface Character {
  // Основная информация
  name: string;
  race: string;
  gender: string;
  age: number;

  // Внешность
  appearance: {
    height?: string;
    weight?: string;
    hair_color?: string;
    eye_color?: string;
    skin_color?: string;
    distinctive_features?: string;
    description: string;
  };

  // Характер и личность
  personality: {
    traits: string[];
    background: string;
    motivations: string[];
    fears: string[];
    strengths: string[];
    weaknesses: string[];
  };

  // Навыки и способности
  skills: {
    combat_skills: string[];
    social_skills: string[];
    knowledge_skills: string[];
    magical_skills?: string[];
    special_abilities: string[];
  };

  // Экипировка
  equipment: {
    weapons: string[];
    armor: string;
    items: string[];
    clothing: string;
  };

  // История и связи
  background: {
    family: string;
    occupation: string;
    history: string;
    relationships: Array<{
      name: string;
      relation: string;
      description: string;
    }>;
  };

  // Статистика (для ролевых систем)
  stats?: {
    strength?: number;
    agility?: number;
    intelligence?: number;
    charisma?: number;
    endurance?: number;
    luck?: number;
  };

  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterCreationData {
  character: Character;
  worldId?: string;
}
