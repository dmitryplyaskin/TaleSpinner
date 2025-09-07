import { GameSessionsJsonService } from "./files";

export class GameSessionsService {
  async getAllSessions() {
    try {
      const sessions = await GameSessionsJsonService.findFilesByPath(
        "*/main.json"
      );
      const sortedSessions = sessions.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return sortedSessions;
    } catch (error) {
      console.error("Ошибка получения сессий:", error);
      throw error;
    }
  }

  async deleteSession(id: string) {
    try {
      await GameSessionsJsonService.deleteDirectory(id);
      return true;
    } catch (error) {
      console.error("Ошибка удаления сессии:", error);
      throw error;
    }
  }
}
