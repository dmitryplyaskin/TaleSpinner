import { worldCreateRouter } from "./world-create";
import { apiSettingsRouter } from "./api-settings.api";
import { gameSessionsRouter } from "./game-sessions";
import { openRouterRouter } from "./openrouter.api";

export const routes = [
  worldCreateRouter,
  apiSettingsRouter,
  gameSessionsRouter,
  openRouterRouter,
];
