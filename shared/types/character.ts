import { BaseFileData } from "./base-file";

export interface Character {
  // Основная информация
  name: string;
  description: string;

  // Внешность
  appearance: string;

  // Характер
  personality: string;

  // Одежда
  clothing: string;

  // Снаряжение
  equipment: string;

  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterCreationData {
  character: Character;
  worldId?: string;
}
