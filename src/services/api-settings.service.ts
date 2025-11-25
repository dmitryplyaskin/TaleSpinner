import { JsonFileService } from "../core/services/json-file.service";
import { ApiSettingsStorage, StoredApiToken } from "@shared/types/api-settings";
import {
  AppSettings,
  ApiToken,
  CreateTokenRequest,
  UpdateTokenRequest,
  LLMOutputLanguage,
  ApiProvider,
} from "@shared/types/settings";
import { v4 as uuidv4 } from "uuid";

// Сервис для хранения настроек API с токенами
const ApiSettingsStorageService = new JsonFileService<ApiSettingsStorage>(
  "./data/api-settings",
  "api-settings"
);

// Инициализация файла настроек с новой структурой
ApiSettingsStorageService.createFile(
  {
    api: {
      provider: "openrouter",
      model: "",
      providerOrder: [],
    },
    tokens: [],
    rag: {
      enabled: false,
      model: "",
    },
    embedding: {
      enabled: false,
      model: "",
    },
    responseGeneration: {
      enabled: false,
      model: "",
    },
    llmOutputLanguage: "ru",
  },
  {
    skipIfExists: true,
  }
);

/**
 * Сервис для работы с настройками API
 * Обеспечивает безопасное хранение токенов
 */
export class ApiSettingsServiceClass {
  /**
   * Получить настройки для фронтенда (без реальных значений токенов)
   */
  async getSettings(): Promise<AppSettings | null> {
    const storage = await ApiSettingsStorageService.readFile("api-settings");
    if (!storage) return null;

    // Преобразуем токены, убирая реальные значения
    const tokens: ApiToken[] = storage.tokens.map((t) => ({
      id: t.id,
      name: t.name,
      isActive: t.isActive,
    }));

    const activeToken = storage.tokens.find((t) => t.isActive);

    return {
      api: {
        provider: ApiProvider.OPEN_ROUTER,
        tokens,
        activeTokenId: activeToken?.id || null,
        model: storage.api.model,
        providerOrder: storage.api.providerOrder || [],
      },
      rag: storage.rag,
      embedding: storage.embedding,
      responseGeneration: storage.responseGeneration,
      llmOutputLanguage: storage.llmOutputLanguage,
    };
  }

  /**
   * Обновить настройки (без токенов - они управляются отдельно)
   */
  async updateSettings(
    settings: Omit<AppSettings, "api"> & {
      api: { model: string; providerOrder: string[] };
    }
  ): Promise<AppSettings | null> {
    const storage = await ApiSettingsStorageService.readFile("api-settings");
    if (!storage) return null;

    const updatedStorage = await ApiSettingsStorageService.patchFile(
      "api-settings",
      {
        api: {
          provider: "openrouter",
          model: settings.api.model,
          providerOrder: settings.api.providerOrder,
        },
        rag: settings.rag,
        embedding: settings.embedding,
        responseGeneration: settings.responseGeneration,
        llmOutputLanguage: settings.llmOutputLanguage,
      }
    );

    if (!updatedStorage) return null;

    return this.getSettings();
  }

  /**
   * Добавить новый токен
   */
  async addToken(request: CreateTokenRequest): Promise<ApiToken | null> {
    const storage = await ApiSettingsStorageService.readFile("api-settings");
    if (!storage) return null;

    const newToken: StoredApiToken = {
      id: uuidv4(),
      name: request.name || `Токен ${storage.tokens.length + 1}`,
      value: request.value,
      isActive: storage.tokens.length === 0, // Первый токен автоматически активен
      createdAt: new Date().toISOString(),
    };

    const updatedTokens = [...storage.tokens, newToken];

    await ApiSettingsStorageService.patchFile("api-settings", {
      tokens: updatedTokens,
    });

    return {
      id: newToken.id,
      name: newToken.name,
      isActive: newToken.isActive,
    };
  }

  /**
   * Обновить токен (только название)
   */
  async updateToken(
    tokenId: string,
    request: UpdateTokenRequest
  ): Promise<ApiToken | null> {
    const storage = await ApiSettingsStorageService.readFile("api-settings");
    if (!storage) return null;

    const tokenIndex = storage.tokens.findIndex((t) => t.id === tokenId);
    if (tokenIndex === -1) return null;

    const updatedTokens = [...storage.tokens];
    if (request.name !== undefined) {
      updatedTokens[tokenIndex] = {
        ...updatedTokens[tokenIndex],
        name: request.name,
      };
    }

    await ApiSettingsStorageService.patchFile("api-settings", {
      tokens: updatedTokens,
    });

    const token = updatedTokens[tokenIndex];
    return {
      id: token.id,
      name: token.name,
      isActive: token.isActive,
    };
  }

  /**
   * Удалить токен
   */
  async deleteToken(tokenId: string): Promise<boolean> {
    const storage = await ApiSettingsStorageService.readFile("api-settings");
    if (!storage) return false;

    const tokenIndex = storage.tokens.findIndex((t) => t.id === tokenId);
    if (tokenIndex === -1) return false;

    const wasActive = storage.tokens[tokenIndex].isActive;
    const updatedTokens = storage.tokens.filter((t) => t.id !== tokenId);

    // Если удаляемый токен был активным, активируем первый оставшийся
    if (wasActive && updatedTokens.length > 0) {
      updatedTokens[0].isActive = true;
    }

    await ApiSettingsStorageService.patchFile("api-settings", {
      tokens: updatedTokens,
    });

    return true;
  }

  /**
   * Активировать токен
   */
  async activateToken(tokenId: string): Promise<ApiToken | null> {
    const storage = await ApiSettingsStorageService.readFile("api-settings");
    if (!storage) return null;

    const tokenIndex = storage.tokens.findIndex((t) => t.id === tokenId);
    if (tokenIndex === -1) return null;

    // Деактивируем все токены и активируем выбранный
    const updatedTokens = storage.tokens.map((t) => ({
      ...t,
      isActive: t.id === tokenId,
    }));

    await ApiSettingsStorageService.patchFile("api-settings", {
      tokens: updatedTokens,
    });

    const token = updatedTokens[tokenIndex];
    return {
      id: token.id,
      name: token.name,
      isActive: token.isActive,
    };
  }

  /**
   * Получить активный токен (только для внутреннего использования на бэкенде)
   */
  async getActiveToken(): Promise<string | null> {
    const storage = await ApiSettingsStorageService.readFile("api-settings");
    if (!storage) return null;

    const activeToken = storage.tokens.find((t) => t.isActive);
    return activeToken?.value || null;
  }

  /**
   * Получить полные настройки для внутреннего использования (включая токен)
   */
  async getInternalSettings(): Promise<{
    token: string;
    model: string;
    providerOrder: string[];
    llmOutputLanguage: LLMOutputLanguage;
  } | null> {
    const storage = await ApiSettingsStorageService.readFile("api-settings");
    if (!storage) return null;

    const activeToken = storage.tokens.find((t) => t.isActive);

    return {
      token: activeToken?.value || "",
      model: storage.api.model,
      providerOrder: storage.api.providerOrder || [],
      llmOutputLanguage: storage.llmOutputLanguage || "ru",
    };
  }

  /**
   * Миграция старых настроек (если есть старый формат с одним токеном)
   */
  async migrateOldSettings(): Promise<void> {
    const storage = await ApiSettingsStorageService.readFile("api-settings");
    if (!storage) return;

    // Проверяем, есть ли старый формат с полем api.token
    const oldApi = storage.api as unknown as {
      token?: string;
      provider?: string;
      model?: string;
    };

    // Проверяем, есть ли старый токен и нет ли уже новых токенов
    const hasOldToken = oldApi.token && oldApi.token.length > 0;
    const hasNewTokens = Array.isArray(storage.tokens) && storage.tokens.length > 0;

    if (hasOldToken && !hasNewTokens) {
      // Мигрируем старый токен в новую структуру
      const newToken: StoredApiToken = {
        id: uuidv4(),
        name: "Основной токен",
        value: oldApi.token!,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      await ApiSettingsStorageService.patchFile("api-settings", {
        api: {
          provider: "openrouter",
          model: oldApi.model || "",
          providerOrder: [],
        },
        tokens: [newToken],
      });
    }
  }
}

export const ApiSettingsService = new ApiSettingsServiceClass();

// Запускаем миграцию при старте
ApiSettingsService.migrateOldSettings().catch(console.error);
