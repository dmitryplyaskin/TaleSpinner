import { describe, expect, test } from "vitest";

import {
  mergeAppSettings,
  normalizeLegacyAppSettings,
} from "./app-settings-repository";

describe("app-settings-repository", () => {
  test("normalizes bind setting from legacy payload", () => {
    expect(
      normalizeLegacyAppSettings({
        data: {
          bindChatCompletionPresetToConnection: true,
        },
      })
    ).toMatchObject({
      bindChatCompletionPresetToConnection: true,
    });
  });

  test("merges bind setting patch", () => {
    expect(
      mergeAppSettings(
        {
          language: "ru",
          openLastChat: false,
          autoSelectCurrentPersona: false,
          bindChatCompletionPresetToConnection: false,
        },
        {
          bindChatCompletionPresetToConnection: true,
        }
      )
    ).toMatchObject({
      bindChatCompletionPresetToConnection: true,
    });
  });
});
