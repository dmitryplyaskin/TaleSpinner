import { GameSessionsJsonService } from "./files";

export class GameSessionsService {
  async getAllSessions() {
    const sessions = await GameSessionsJsonService.findFilesByPath(
      "*/main.json"
    );
    const sortedSessions = sessions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sortedSessions;
  }
}
