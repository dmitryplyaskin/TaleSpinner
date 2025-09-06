import { GameSessionsJsonService } from "./files";

export class GameSessionsService {
  getAllSessions() {
    const sessions = GameSessionsJsonService.findFilesByPath("*/main.json");
    return sessions;
  }
}
