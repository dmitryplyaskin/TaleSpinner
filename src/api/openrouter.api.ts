import { RouterBuilder } from "../core/http/router-builder";
import { ApiSettingsService } from "../services/api-settings.service";
import { OpenRouterModelsResponse } from "@shared/types/settings";

const router = new RouterBuilder();

// Получить список моделей OpenRouter
router.addRoute({
  path: "/openrouter/models",
  method: "GET",
  handler: async (req, res) => {
    const token = await ApiSettingsService.getActiveToken();

    if (!token) {
      res.status(400).json({ error: "No active API token configured" });
      return;
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        res.status(response.status).json({
          error: `OpenRouter API error: ${response.statusText}`,
          details: errorText,
        });
        return;
      }

      const data = (await response.json()) as OpenRouterModelsResponse;

      // Сортируем модели по имени для удобства
      data.data.sort((a, b) => a.name.localeCompare(b.name));

      res.json(data);
    } catch (error) {
      console.error("Failed to fetch OpenRouter models:", error);
      res.status(500).json({
        error: "Failed to fetch models from OpenRouter",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
});

export const openRouterRouter = router.build();

