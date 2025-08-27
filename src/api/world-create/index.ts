import { RouterBuilder } from "@core/http/router-builder";
import { WorldCreateService } from "@services/world-creation";

const routerBuilder = new RouterBuilder();
const worldCreateService = new WorldCreateService();

routerBuilder.addRoute({
  path: "/world-creation/create/draft",
  method: "POST",
  handler: async (req, res) => {
    const result = await worldCreateService.createDraftWorlds(req.body);
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

routerBuilder.addRoute({
  path: "/world-creation/create-world",
  method: "POST",
  handler: async (req, res) => {
    const result = await worldCreateService.createWorld(req.body);
    res.json(result);
  },
});

routerBuilder.addRoute({
  path: "/world-creation/update-world",
  method: "POST",
  handler: async (req, res) => {
    const result = await worldCreateService.updateWorld(req.body);
    res.json(result);
  },
});

routerBuilder.addRoute({
  path: "/world-creation/save-character",
  method: "POST",
  handler: async (req, res) => {
    const result = await worldCreateService.saveCharacter(req.body);
    res.json(result);
  },
});

export const worldCreateRouter = routerBuilder.build();
