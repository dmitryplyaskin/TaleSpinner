import { JsonFileService } from "@core/services/json-file.service";

export const GameSessionsJsonService = new JsonFileService(
  "./data/game-sessions"
);
