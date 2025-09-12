import { JsonFileService } from "@core/services/json-file.service";
import { ChatSession } from "@shared/types/chat";
import { WorldPrimer } from "@shared/types/world-creation";

export const GameSessionsJsonService = new JsonFileService<WorldPrimer>(
  "./data/game-sessions"
);

export const GameSessionsChatJsonService = new JsonFileService<ChatSession>(
  "./data/game-sessions"
);
