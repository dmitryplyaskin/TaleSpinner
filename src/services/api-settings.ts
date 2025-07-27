import { JsonFileService } from "../core/services/json-file.service";

const ApiSettingsService = new JsonFileService<ApiSettings>(
  "./data/api-settings",
  "api-settings"
);

ApiSettingsService.createFile({
  apiKey: "",
  provider: "openrouter",
  model: "gpt-4o-mini",
});

export { ApiSettingsService };

export interface ApiSettings {
  apiKey: string;
  provider: "openrouter";
  model: string;
}
