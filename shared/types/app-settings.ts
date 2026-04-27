export interface AppSettings {
  language: "ru" | "en";
  openLastChat: boolean;
  autoSelectCurrentPersona: boolean;
  bindChatCompletionPresetToConnection: boolean;
}

export interface AppSettingsResponse {
  settings: AppSettings;
}
