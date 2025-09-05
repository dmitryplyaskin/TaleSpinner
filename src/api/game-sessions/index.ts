import { RouterBuilder } from "@core/http/router-builder";
import { GameSessionsService } from "@services/game-sessions/game-sessions.service";

const routerBuilder = new RouterBuilder();
const worldCreateService = new GameSessionsService();

routerBuilder.addRoute({
  path: "/game-sessions",
  method: "GET",
  handler: async (req, res) => {
    const sessions = await worldCreateService.getAllSessions();
    res.json(sessions);
  },
});

export const gameSessionsRouter = routerBuilder.build();
