import { DataManagerService, DataRecord } from "./data-manager.service";
import { AppSettings, DEFAULT_SETTINGS } from "../../../shared/types/settings";

export type SettingsData = AppSettings & DataRecord;

export class SettingsDataService {
  private dataManager: DataManagerService;
  private readonly SETTINGS_ID = "app-settings";

  constructor(basePath?: string) {
    this.dataManager = new DataManagerService({
      basePath,
      defaultFolder: "settings",
    });
  }

  /**
   * Получает настройки приложения. Если настройки не существуют, создает их с дефолтными значениями
   */
  async getSettings(): Promise<SettingsData> {
    let settings = await this.dataManager.read<SettingsData>(this.SETTINGS_ID);

    if (!settings) {
      settings = await this.createDefaultSettings();
    }

    return settings;
  }

  /**
   * Обновляет настройки приложения
   */
  async updateSettings(updates: Partial<AppSettings>): Promise<SettingsData> {
    const existingSettings = await this.getSettings();

    // Глубокое слияние настроек
    const mergedSettings = this.deepMerge(existingSettings, updates);

    return this.dataManager.update<SettingsData>(this.SETTINGS_ID, {
      data: mergedSettings,
    });
  }

  /**
   * Обновляет настройки API
   */
  async updateApiSettings(
    apiUpdates: Partial<AppSettings["api"]>
  ): Promise<SettingsData> {
    const settings = await this.getSettings();

    return this.dataManager.update<SettingsData>(this.SETTINGS_ID, {
      data: {
        api: { ...settings.api, ...apiUpdates },
      },
    });
  }

  /**
   * Обновляет настройки RAG
   */
  async updateRagSettings(
    ragUpdates: Partial<AppSettings["rag"]>
  ): Promise<SettingsData> {
    const settings = await this.getSettings();

    return this.dataManager.update<SettingsData>(this.SETTINGS_ID, {
      data: {
        rag: { ...settings.rag, ...ragUpdates },
      },
    });
  }

  /**
   * Обновляет настройки эмбеддингов
   */
  async updateEmbeddingSettings(
    embeddingUpdates: Partial<AppSettings["embedding"]>
  ): Promise<SettingsData> {
    const settings = await this.getSettings();

    return this.dataManager.update<SettingsData>(this.SETTINGS_ID, {
      data: {
        embedding: { ...settings.embedding, ...embeddingUpdates },
      },
    });
  }

  /**
   * Обновляет настройки генерации ответов
   */
  async updateResponseGenerationSettings(
    responseUpdates: Partial<AppSettings["responseGeneration"]>
  ): Promise<SettingsData> {
    const settings = await this.getSettings();

    return this.dataManager.update<SettingsData>(this.SETTINGS_ID, {
      data: {
        responseGeneration: {
          ...settings.responseGeneration,
          ...responseUpdates,
        },
      },
    });
  }

  /**
   * Сбрасывает настройки к дефолтным значениям
   */
  async resetToDefaults(): Promise<SettingsData> {
    return this.dataManager.update<SettingsData>(this.SETTINGS_ID, {
      data: DEFAULT_SETTINGS,
    });
  }

  /**
   * Создает резервную копию настроек
   */
  async backupSettings(): Promise<SettingsData> {
    const settings = await this.getSettings();
    const backupId = `backup-${Date.now()}`;

    return this.dataManager.create<SettingsData>(
      {
        id: backupId,
        data: { ...settings },
      },
      "settings-backups"
    );
  }

  /**
   * Создает настройки с дефолтными значениями
   */
  private async createDefaultSettings(): Promise<SettingsData> {
    return this.dataManager.create<SettingsData>({
      id: this.SETTINGS_ID,
      data: DEFAULT_SETTINGS,
    });
  }

  /**
   * Глубокое слияние объектов
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }
}
