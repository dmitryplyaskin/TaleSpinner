import { GameSessionsJsonService } from "./files";

export class GameSessionsService {
  getAllSessions() {
    const sessions = GameSessionsJsonService.getAllFiles();
    return sessions;
  }
}
