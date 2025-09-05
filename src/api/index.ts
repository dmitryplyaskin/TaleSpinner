import { worldCreateRouter } from "./world-create";
import { apiSettingsRouter } from "./api-settings.api";
import { gameSessionsRouter } from "./game-sessions";

export const routes = [
  worldCreateRouter,
  apiSettingsRouter,
  gameSessionsRouter,
];
