import { ApiSettingsService } from "../services/api-settings.service";
import { RouterBuilder } from "../core/http/router-builder";
import { CreateTokenRequest, UpdateTokenRequest } from "@shared/types/settings";

const router = new RouterBuilder();

// Получить настройки (без реальных значений токенов)
router.addRoute({
  path: "/api-settings",
  method: "GET",
  handler: async (req, res) => {
    const settings = await ApiSettingsService.getSettings();
    if (!settings) {
      res.status(404).json({ error: "Settings not found" });
      return;
    }
    res.json(settings);
  },
});

// Обновить настройки (без токенов)
router.addRoute({
  path: "/api-settings",
  method: "POST",
  handler: async (req, res) => {
    const settings = await ApiSettingsService.updateSettings(req.body);
    if (!settings) {
      res.status(404).json({ error: "Settings not found" });
      return;
    }
    res.json(settings);
  },
});

// === Управление токенами ===

// Добавить новый токен
router.addRoute({
  path: "/api-settings/tokens",
  method: "POST",
  handler: async (req, res) => {
    const request: CreateTokenRequest = req.body;

    if (!request.value) {
      res.status(400).json({ error: "Token value is required" });
      return;
    }

    const token = await ApiSettingsService.addToken(request);
    if (!token) {
      res.status(500).json({ error: "Failed to add token" });
      return;
    }
    res.json(token);
  },
});

// Обновить токен (только название)
router.addRoute({
  path: "/api-settings/tokens/:id",
  method: "PUT",
  handler: async (req, res) => {
    const tokenId = req.params.id;
    const request: UpdateTokenRequest = req.body;

    const token = await ApiSettingsService.updateToken(tokenId, request);
    if (!token) {
      res.status(404).json({ error: "Token not found" });
      return;
    }
    res.json(token);
  },
});

// Удалить токен
router.addRoute({
  path: "/api-settings/tokens/:id",
  method: "DELETE",
  handler: async (req, res) => {
    const tokenId = req.params.id;

    const success = await ApiSettingsService.deleteToken(tokenId);
    if (!success) {
      res.status(404).json({ error: "Token not found" });
      return;
    }
    res.json({ success: true });
  },
});

// Активировать токен
router.addRoute({
  path: "/api-settings/tokens/:id/activate",
  method: "PUT",
  handler: async (req, res) => {
    const tokenId = req.params.id;

    const token = await ApiSettingsService.activateToken(tokenId);
    if (!token) {
      res.status(404).json({ error: "Token not found" });
      return;
    }
    res.json(token);
  },
});

export const apiSettingsRouter = router.build();
