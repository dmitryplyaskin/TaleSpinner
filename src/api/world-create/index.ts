import { RouterBuilder } from "@core/http/router-builder";
import { WorldCreateService } from "@services/world-creation";
import { AgentWorldService } from "@services/world-creation/agent-world.service";

const routerBuilder = new RouterBuilder();
const worldCreateService = new WorldCreateService();
const agentWorldService = new AgentWorldService();

routerBuilder.addRoute({
  path: "/world-creation/agent/start",
  method: "POST",
  handler: async (req, res) => {
    const result = await agentWorldService.startSession(req.body.setting);
    res.json(result);
  },
});

routerBuilder.addRoute({
  path: "/world-creation/agent/analyze",
  method: "POST",
  handler: async (req, res) => {
    const result = await agentWorldService.analyzeInput(req.body.sessionId, req.body.userInput);
    res.json(result);
  },
});

routerBuilder.addRoute({
  path: "/world-creation/agent/generate",
  method: "POST",
  handler: async (req, res) => {
    const result = await agentWorldService.generateWorld(req.body.sessionId);
    res.json(result);
  },
});

routerBuilder.addRoute({
  path: "/world-creation/agent/submit-answers",
  method: "POST",
  handler: async (req, res) => {
    const result = await agentWorldService.submitAnswers(req.body.sessionId, req.body.answers);
    res.json(result);
  },
});

routerBuilder.addRoute({
  path: "/world-creation/agent/save",
  method: "POST",
  handler: async (req, res) => {
    const result = await agentWorldService.saveWorld(req.body.sessionId, req.body.worldData);
    res.json(result);
  },
});

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

routerBuilder.addRoute({
  path: "/world-creation/complete-world",
  method: "POST",
  handler: async (req, res) => {
    const result = await worldCreateService.completeWorldCreation(req.body);
    res.json(result);
  },
});

export const worldCreateRouter = routerBuilder.build();
