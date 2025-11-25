import { worldCreateRouter } from "./world-create";
import { apiSettingsRouter } from "./api-settings.api";
import { gameSessionsRouter } from "./game-sessions";
import { openRouterRouter } from "./openrouter.api";
import { worldsRouter } from "./worlds";

export const routes = [
  worldCreateRouter,
  apiSettingsRouter,
  gameSessionsRouter,
  openRouterRouter,
  worldsRouter,
];
