import { RouterBuilder } from "@core/http/router-builder";
import { WorldsService } from "@services/worlds";

const routerBuilder = new RouterBuilder();
const worldsService = new WorldsService();

routerBuilder.addRoute({
  path: "/worlds",
  method: "GET",
  handler: async (_req, res) => {
    const worlds = await worldsService.getAllWorlds();
    res.json(worlds);
  },
});

routerBuilder.addRoute({
  path: "/worlds/:id",
  method: "GET",
  handler: async (req, res) => {
    const world = await worldsService.getWorldById(req.params.id);
    if (!world) {
      res.status(404).json({ error: "World not found" });
      return;
    }
    res.json(world);
  },
});

routerBuilder.addRoute({
  path: "/worlds/:id",
  method: "DELETE",
  handler: async (req, res) => {
    const deleted = await worldsService.deleteWorld(req.params.id);
    res.json({ success: deleted });
  },
});

routerBuilder.addRoute({
  path: "/worlds/:id/favorite",
  method: "POST",
  handler: async (req, res) => {
    const world = await worldsService.toggleFavorite(req.params.id);
    if (!world) {
      res.status(404).json({ error: "World not found" });
      return;
    }
    res.json(world);
  },
});

export const worldsRouter = routerBuilder.build();

