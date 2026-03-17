import { DEFAULT_UI_THEME_PAYLOAD, UI_THEME_BUILT_IN_IDS, type UiThemePresetPayload } from "@shared/types/ui-theme";
import { describe, expect, test } from "vitest";

import { resolveUiThemePresetPayload } from "./ui-theme-built-ins";

describe("ui theme built-ins", () => {
  test("returns canonical payload for built-in presets even when stored payload is stale", () => {
    const stalePayload: UiThemePresetPayload = {
      ...DEFAULT_UI_THEME_PAYLOAD,
      lightTokens: {
        ...DEFAULT_UI_THEME_PAYLOAD.lightTokens,
        "--ts-left-rail-bg":
          "linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(245, 251, 255, 0.66))",
      },
      darkTokens: {
        ...DEFAULT_UI_THEME_PAYLOAD.darkTokens,
        "--ts-left-rail-bg":
          "linear-gradient(180deg, rgba(24, 28, 34, 0.9), rgba(16, 20, 25, 0.88))",
      },
    };

    const resolved = resolveUiThemePresetPayload({
      presetId: UI_THEME_BUILT_IN_IDS.default,
      builtIn: true,
      storedPayload: stalePayload,
    });

    expect(resolved.lightTokens["--ts-left-rail-bg"]).toBe("linear-gradient(180deg, #ffffff, #f5fbff)");
    expect(resolved.darkTokens["--ts-left-rail-bg"]).toBe("linear-gradient(180deg, #181c22, #101419)");
  });

  test("keeps stored payload for non built-in presets", () => {
    const customPayload: UiThemePresetPayload = {
      ...DEFAULT_UI_THEME_PAYLOAD,
      lightTokens: {
        ...DEFAULT_UI_THEME_PAYLOAD.lightTokens,
        "--ts-left-rail-bg": "custom-value",
      },
    };

    const resolved = resolveUiThemePresetPayload({
      presetId: "custom-theme",
      builtIn: false,
      storedPayload: customPayload,
    });

    expect(resolved.lightTokens["--ts-left-rail-bg"]).toBe("custom-value");
  });
});
