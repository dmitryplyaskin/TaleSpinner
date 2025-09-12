import { WorldPrimer } from "@shared/types/world-creation";
import { GameSessionsChatJsonService, GameSessionsJsonService } from "./files";
import { v4 as uuidv4 } from "uuid";
import { ChatRole } from "@shared/types/chat";

export class GameSessionsService {
  async getSession(id: string) {
    try {
      const session = await GameSessionsJsonService.readFile(id + "/main");
      return session;
    } catch (error) {
      console.error("Ошибка получения сессии:", error);
      throw error;
    }
  }

  async getAllSessions() {
    try {
      const sessions = await GameSessionsJsonService.findFilesByPath(
        "*/main.json"
      );
      const sortedSessions = sessions.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      return sortedSessions;
    } catch (error) {
      console.error("Ошибка получения сессий:", error);
      throw error;
    }
  }

  async deleteSession(id: string) {
    try {
      await GameSessionsJsonService.deleteDirectory(id + "/main");
      return true;
    } catch (error) {
      console.error("Ошибка удаления сессии:", error);
      throw error;
    }
  }

  async addToFavorites(id: string) {
    try {
      await GameSessionsJsonService.updateFile(id + "/main", {
        //@ts-ignore
        favorites: true,
      });
    } catch (error) {
      console.error("Ошибка добавления в избранное:", error);
      throw error;
    }
  }

  async updateSession(id: string, data: WorldPrimer) {
    try {
      await GameSessionsJsonService.updateFile(id + "/main", data);
      return data;
    } catch (error) {
      console.error("Ошибка обновления сессии:", error);
      throw error;
    }
  }

  async initGameSessions(data: WorldPrimer) {
    try {
      const chatId = uuidv4();
      await GameSessionsJsonService.createDirectory(data.id);
      await GameSessionsJsonService.createFile(
        { ...data, currentChatSessionId: chatId },
        {
          filename: data.id + `/main`,
        }
      );
      await GameSessionsChatJsonService.createFile(
        {
          messages: [
            {
              id: uuidv4(),
              role: ChatRole.ASSISTANT,
              content: data.first_message,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
        {
          filename: data.id + `/chat/${chatId}`,
          id: chatId,
        }
      );
      return data;
    } catch (error) {
      console.error("Ошибка инициализации сессии:", error);
      throw error;
    }
  }
}
