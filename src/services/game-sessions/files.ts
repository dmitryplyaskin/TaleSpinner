import { JsonFileService } from "@core/services/json-file.service";
import { WorldPrimer } from "@shared/types/world-creation";

export const GameSessionsJsonService = new JsonFileService<WorldPrimer>(
  "./data/game-sessions"
);
