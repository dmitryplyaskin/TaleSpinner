import { ConfigService } from "@core/services/config-service";
// @ts-ignore
import { Settings } from "@types";

class SettingsService extends ConfigService<Settings> {
  constructor() {
    super("settings.json", { logger: console });
  }

  protected getDefaultConfig(): Settings {
    return {
      temperature: 0.7,
      maxTokens: 2000,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    };
  }
}

export default new SettingsService();
