import { RouterBuilder } from "@core/http/router-builder";
import { WorldCreateService } from "@services/world-creation";
import { AgentWorldService } from "@services/world-creation/agent-world.service";
import type { ClarificationResponse } from "@shared/types/human-in-the-loop";

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
    const result = await agentWorldService.analyzeInput(
      req.body.sessionId,
      req.body.userInput
    );
    res.json(result);
  },
});

// Legacy generate endpoint (без streaming)
routerBuilder.addRoute({
  path: "/world-creation/agent/generate",
  method: "POST",
  handler: async (req, res) => {
    const result = await agentWorldService.generateWorld(req.body.sessionId);
    res.json(result);
  },
});

// Новый endpoint: запуск генерации с поддержкой interrupt
routerBuilder.addRoute({
  path: "/world-creation/agent/generate/:sessionId/start",
  method: "POST",
  handler: async (req, res) => {
    const { sessionId } = req.params;

    try {
      // Pass userInput to startGeneration if provided (it might be needed for initialization)
      // Note: startGeneration service method needs to be updated to accept userInput or we update it separately.
      // Let's update agentWorldService.startGeneration to accept userInput.
      const result = await agentWorldService.startGeneration(
        sessionId,
        req.body.userInput
      );
      res.json(result);
    } catch (error) {
      console.error("Generation start error:", error);
      res.status(500).json({ error: String(error) });
    }
  },
});

// Новый endpoint: продолжение после ответа пользователя
routerBuilder.addRoute({
  path: "/world-creation/agent/generate/:sessionId/continue",
  method: "POST",
  handler: async (req, res) => {
    const { sessionId } = req.params;
    const response: ClarificationResponse = req.body.response;

    try {
      const result = await agentWorldService.continueGeneration(
        sessionId,
        response
      );
      res.json(result);
    } catch (error) {
      console.error("Generation continue error:", error);
      res.status(500).json({ error: String(error) });
    }
  },
});

// SSE streaming endpoint для real-time прогресса
routerBuilder.addRoute({
  path: "/world-creation/agent/generate/:sessionId/stream",
  method: "GET",
  handler: async (req, res) => {
    const { sessionId } = req.params;

    // Настройка SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Для nginx

    // Отправка keep-alive
    const keepAliveInterval = setInterval(() => {
      res.write(": keep-alive\n\n");
    }, 15000);

    try {
      for await (const event of agentWorldService.generateWorldStream(
        sessionId
      )) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);

        // Если есть pending clarification, отправляем и ждём
        if (event.status === "waiting_for_input") {
          // Клиент должен отправить POST на /continue
          break;
        }
      }

      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    } catch (error) {
      res.write(
        `data: ${JSON.stringify({ type: "error", error: String(error) })}\n\n`
      );
    } finally {
      clearInterval(keepAliveInterval);
      res.end();
    }
  },
});

routerBuilder.addRoute({
  path: "/world-creation/agent/submit-answers",
  method: "POST",
  handler: async (req, res) => {
    const result = await agentWorldService.submitAnswers(
      req.body.sessionId,
      req.body.answers
    );
    res.json(result);
  },
});

routerBuilder.addRoute({
  path: "/world-creation/agent/save",
  method: "POST",
  handler: async (req, res) => {
    const result = await agentWorldService.saveWorld(
      req.body.sessionId,
      req.body.worldData
    );
    res.json(result);
  },
});

routerBuilder.addRoute({
  path: "/world-creation/agent/progress",
  method: "GET",
  handler: async (req, res) => {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
      res.status(400).json({ error: "sessionId is required" });
      return;
    }
    const result = await agentWorldService.getGenerationProgress(sessionId);
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
