import { RouterBuilder } from "@core/http/router-builder";
import { WorldCreateService } from "@services/world-creation";

const routerBuilder = new RouterBuilder();
const worldCreateService = new WorldCreateService();

routerBuilder.addRoute({
  path: "/world-creation/create",
  method: "POST",
  handler: async (req, res) => {
    const result = await worldCreateService.createWorlds(req.body);
    res.json(result);
  },
});

routerBuilder.addRoute({
  path: "/world-creation/create/more",
  method: "POST",
  handler: async (req, res) => {
    const result = await worldCreateService.createMoreWorlds(req.body);
    res.json(result);
  },
});

routerBuilder.addRoute({
  path: "/world-creation/select",
  method: "POST",
  handler: async (req, res) => {
    const result = await worldCreateService.selectWorld(req.body);
    res.json(result);
  },
});

routerBuilder.addRoute({
  path: "/world-creation/add-to-favorites",
  method: "POST",
  handler: async (req, res) => {
    const result = await worldCreateService.addWorldToFavorites(req.body);
    res.json(result);
  },
});

export const worldCreateRouter = routerBuilder.build();
