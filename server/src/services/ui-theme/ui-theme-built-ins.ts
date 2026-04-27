import { BUILT_IN_UI_THEME_PRESETS, type UiThemePresetPayload } from "@shared/types/ui-theme";

const BUILT_IN_PAYLOAD_BY_ID = new Map(
  BUILT_IN_UI_THEME_PRESETS.map((preset) => [preset.id, preset.payload]),
);

function clonePayload(payload: UiThemePresetPayload): UiThemePresetPayload {
  return {
    ...payload,
    lightTokens: { ...payload.lightTokens },
    darkTokens: { ...payload.darkTokens },
    typography: { ...payload.typography },
    markdown: { ...payload.markdown },
  };
}

export function resolveUiThemePresetPayload(params: {
  presetId: string;
  builtIn: boolean;
  storedPayload: UiThemePresetPayload;
}): UiThemePresetPayload {
  if (!params.builtIn) {
    return clonePayload(params.storedPayload);
  }

  const builtInPayload = BUILT_IN_PAYLOAD_BY_ID.get(params.presetId);
  return builtInPayload ? clonePayload(builtInPayload) : clonePayload(params.storedPayload);
}
