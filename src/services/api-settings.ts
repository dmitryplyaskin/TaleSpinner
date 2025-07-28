import {
  BaseFileData,
  JsonFileService,
} from "../core/services/json-file.service";

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

export interface ApiSettings extends BaseFileData {
  api: {
    token: string;
    provider: "openrouter";
    model: string;
  };
  rag: {
    enabled: boolean;
    model: string;
  };
  embedding: {
    enabled: boolean;
    model: string;
  };
  responseGeneration: {
    enabled: boolean;
    model: string;
  };
}
