import { RouterBuilder } from "@core/http/router-builder";
import { worldCreateHandler } from "./world-create.api";
import { WorldCreateService } from "@services/world-create";

const routerBuilder = new RouterBuilder();
const worldCreateService = new WorldCreateService();

routerBuilder.addRoute({
  path: "/world/create",
  method: "POST",
  handler: async (req, res) => {
    const result = await worldCreateService.createWorld(req.body);
    res.json(result);
  },
});

routerBuilder.addRoute({
  path: "/world/create/more",
  method: "POST",
  handler: async (req, res) => {
    const result = await worldCreateService.createMoreWorlds(req.body);
    res.json(result);
  },
});

export const worldCreateRouter = routerBuilder.build();
