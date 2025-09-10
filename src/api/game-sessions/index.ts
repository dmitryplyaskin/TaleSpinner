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

routerBuilder.addRoute({
  path: "/game-sessions/:id",
  method: "GET",
  handler: async (req, res) => {
    const session = await worldCreateService.getSession(req.params.id);
    res.json(session);
  },
});

routerBuilder.addRoute({
  path: "/game-sessions/:id",
  method: "DELETE",
  handler: async (req, res) => {
    const session = await worldCreateService.deleteSession(req.params.id);
    res.json(session);
  },
});

routerBuilder.addRoute({
  path: "/game-sessions/:id",
  method: "PUT",
  handler: async (req, res) => {
    const session = await worldCreateService.updateSession(
      req.params.id,
      req.body
    );
    res.json(session);
  },
});

export const gameSessionsRouter = routerBuilder.build();
