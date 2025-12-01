import { RouterBuilder } from "@core/http/router-builder";
import {
  WorldCreationV2Service,
  GenreSchema,
  GenreMetadata,
  type ClarificationResponse,
  type WorldSkeleton,
  type GeneratedWorld,
} from "@services/world-creation-v2";

const routerBuilder = new RouterBuilder();
const worldCreationV2Service = new WorldCreationV2Service();

/**
 * GET /api/v2/world-creation/genres
 * Получить список доступных жанров
 */
routerBuilder.addRoute({
  path: "/v2/world-creation/genres",
  method: "GET",
  handler: async (_req, res) => {
    const genres = GenreSchema.options.map((genre) => ({
      id: genre,
      ...GenreMetadata[genre],
    }));
    res.json({ genres });
  },
});

/**
 * POST /api/v2/world-creation/session
 * Создать новую сессию с выбранным жанром
 */
routerBuilder.addRoute({
  path: "/v2/world-creation/session",
  method: "POST",
  handler: async (req, res) => {
    try {
      const { genre } = req.body;

      // Валидация жанра
      const parseResult = GenreSchema.safeParse(genre);
      if (!parseResult.success) {
        res.status(400).json({
          error: "Invalid genre",
          details: parseResult.error.issues,
        });
        return;
      }

      const session = await worldCreationV2Service.createSession(parseResult.data);
      res.json({ session });
    } catch (error) {
      console.error("[API] Error creating session:", error);
      res.status(500).json({ error: String(error) });
    }
  },
});

/**
 * GET /api/v2/world-creation/:sessionId/status
 * Получить полный статус сессии
 */
routerBuilder.addRoute({
  path: "/v2/world-creation/:sessionId/status",
  method: "GET",
  handler: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const status = await worldCreationV2Service.getSessionStatus(sessionId);
      res.json(status);
    } catch (error) {
      console.error("[API] Error getting session status:", error);
      res.status(500).json({ error: String(error) });
    }
  },
});

/**
 * POST /api/v2/world-creation/:sessionId/start
 * Начать генерацию с пользовательским вводом
 */
routerBuilder.addRoute({
  path: "/v2/world-creation/:sessionId/start",
  method: "POST",
  handler: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { userInput } = req.body;

      if (!userInput || typeof userInput !== "string") {
        res.status(400).json({ error: "userInput is required" });
        return;
      }

      const result = await worldCreationV2Service.startGeneration(
        sessionId,
        userInput
      );
      res.json(result);
    } catch (error) {
      console.error("[API] Error starting generation:", error);
      res.status(500).json({ error: String(error) });
    }
  },
});

/**
 * POST /api/v2/world-creation/:sessionId/respond
 * Ответить на уточняющие вопросы
 */
routerBuilder.addRoute({
  path: "/v2/world-creation/:sessionId/respond",
  method: "POST",
  handler: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { requestId, answers, skipped = false } = req.body;

      const response: ClarificationResponse = {
        requestId,
        answers: answers || {},
        skipped,
      };

      const result = await worldCreationV2Service.respondToClarification(
        sessionId,
        response
      );
      res.json(result);
    } catch (error) {
      console.error("[API] Error responding to clarification:", error);
      res.status(500).json({ error: String(error) });
    }
  },
});

/**
 * POST /api/v2/world-creation/:sessionId/approve-skeleton
 * Одобрить скелет и начать генерацию элементов
 */
routerBuilder.addRoute({
  path: "/v2/world-creation/:sessionId/approve-skeleton",
  method: "POST",
  handler: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { editedSkeleton } = req.body as { editedSkeleton?: WorldSkeleton };

      const result = await worldCreationV2Service.approveSkeleton(
        sessionId,
        editedSkeleton
      );
      res.json(result);
    } catch (error) {
      console.error("[API] Error approving skeleton:", error);
      res.status(500).json({ error: String(error) });
    }
  },
});

/**
 * POST /api/v2/world-creation/:sessionId/save
 * Сохранить финальный мир
 */
routerBuilder.addRoute({
  path: "/v2/world-creation/:sessionId/save",
  method: "POST",
  handler: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { editedWorld } = req.body as { editedWorld?: GeneratedWorld };

      const result = await worldCreationV2Service.saveWorld(sessionId, editedWorld);
      res.json(result);
    } catch (error) {
      console.error("[API] Error saving world:", error);
      res.status(500).json({ error: String(error) });
    }
  },
});

export const worldCreationV2Router = routerBuilder.build();

