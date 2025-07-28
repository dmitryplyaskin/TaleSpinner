import { JsonFileService } from "../core/services/json-file.service";
import { ApiSettings } from "@shared/types/api-settings";

const ApiSettingsService = new JsonFileService<ApiSettings>(
  "./data/api-settings",
  "api-settings"
);

ApiSettingsService.createFile({
  api: {
    token: "",
    provider: "openrouter",
    model: "qwen/qwen3-235b-a22b-2507:free",
  },
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
});

export { ApiSettingsService };
