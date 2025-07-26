import { DataManagerService, DataRecord } from "./data-manager.service";
import { World, Character, Chats } from "../../../shared/types/world";

// Расширяем типы для добавления обязательных полей DataRecord
export type WorldData = World & DataRecord;
export type CharacterData = Character & DataRecord;
export type ChatsData = Chats & DataRecord;

export class WorldDataService {
  private dataManager: DataManagerService;

  constructor(basePath?: string) {
    this.dataManager = new DataManagerService({
      basePath,
      defaultFolder: "worlds",
    });
  }

  // Методы для работы с мирами
  async createWorld(
    worldData: Omit<World, "id" | "createdAt" | "updatedAt">
  ): Promise<WorldData> {
    return this.dataManager.create<WorldData>({ data: worldData });
  }

  async getWorld(id: string): Promise<WorldData | null> {
    return this.dataManager.read<WorldData>(id);
  }

  async updateWorld(
    id: string,
    updates: Partial<Omit<World, "id" | "createdAt">>
  ): Promise<WorldData> {
    return this.dataManager.update<WorldData>(id, { data: updates });
  }

  async deleteWorld(id: string): Promise<void> {
    await this.dataManager.delete(id);
  }

  async duplicateWorld(originalId: string, newId?: string): Promise<WorldData> {
    return this.dataManager.duplicate<WorldData>(originalId, newId);
  }

  // Методы для работы с персонажами в мире
  async addCharacterToWorld(
    worldId: string,
    character: Omit<Character, "id" | "createdAt" | "updatedAt">
  ): Promise<WorldData> {
    const characterWithMeta: Character = {
      ...character,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.dataManager.append<WorldData>(worldId, {
      field: "characters",
      value: characterWithMeta,
    });
  }

  async updateCharacterInWorld(
    worldId: string,
    characterId: string,
    updates: Partial<Character>
  ): Promise<WorldData> {
    const world = await this.getWorld(worldId);
    if (!world) {
      throw new Error(`World with id ${worldId} not found`);
    }

    const updatedCharacters = world.characters.map((char) =>
      char.id === characterId
        ? { ...char, ...updates, updatedAt: new Date() }
        : char
    );

    return this.dataManager.update<WorldData>(worldId, {
      data: { characters: updatedCharacters },
    });
  }

  async removeCharacterFromWorld(
    worldId: string,
    characterId: string
  ): Promise<WorldData> {
    const world = await this.getWorld(worldId);
    if (!world) {
      throw new Error(`World with id ${worldId} not found`);
    }

    const updatedCharacters = world.characters.filter(
      (char) => char.id !== characterId
    );

    return this.dataManager.update<WorldData>(worldId, {
      data: { characters: updatedCharacters },
    });
  }

  // Методы для работы с чатами в мире
  async addChatToWorld(
    worldId: string,
    chat: Omit<Chats, "id">
  ): Promise<WorldData> {
    const chatWithId: Chats = {
      ...chat,
      id: this.generateId(),
    };

    return this.dataManager.append<WorldData>(worldId, {
      field: "chats",
      value: chatWithId,
    });
  }

  async updateChatInWorld(
    worldId: string,
    chatId: string,
    updates: Partial<Chats>
  ): Promise<WorldData> {
    const world = await this.getWorld(worldId);
    if (!world) {
      throw new Error(`World with id ${worldId} not found`);
    }

    const updatedChats = world.chats.map((chat) =>
      chat.id === chatId ? { ...chat, ...updates } : chat
    );

    return this.dataManager.update<WorldData>(worldId, {
      data: { chats: updatedChats },
    });
  }

  async removeChatFromWorld(
    worldId: string,
    chatId: string
  ): Promise<WorldData> {
    const world = await this.getWorld(worldId);
    if (!world) {
      throw new Error(`World with id ${worldId} not found`);
    }

    const updatedChats = world.chats.filter((chat) => chat.id !== chatId);

    return this.dataManager.update<WorldData>(worldId, {
      data: { chats: updatedChats },
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
