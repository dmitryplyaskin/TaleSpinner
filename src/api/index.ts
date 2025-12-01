import { worldCreateRouter } from "./world-create";
import { worldCreationV2Router } from "./world-creation-v2";
import { apiSettingsRouter } from "./api-settings.api";
import { gameSessionsRouter } from "./game-sessions";
import { openRouterRouter } from "./openrouter.api";
import { worldsRouter } from "./worlds";

export const routes = [
  worldCreateRouter,
  worldCreationV2Router,
  apiSettingsRouter,
  gameSessionsRouter,
  openRouterRouter,
  worldsRouter,
];
