import { DEFAULT_UI_THEME_MARKDOWN, DEFAULT_UI_THEME_PAYLOAD, DEFAULT_UI_THEME_TYPOGRAPHY } from "@shared/types/ui-theme";
import { describe, expect, it } from "vitest";

import { THEME_MARKDOWN_META, THEME_TOKEN_META, THEME_TYPOGRAPHY_META } from "./theme-field-metadata";

describe("theme field metadata", () => {
  it("covers every light theme token", () => {
    expect(Object.keys(THEME_TOKEN_META).sort()).toEqual(
      Object.keys(DEFAULT_UI_THEME_PAYLOAD.lightTokens).sort(),
    );
  });

  it("covers every typography field", () => {
    expect(Object.keys(THEME_TYPOGRAPHY_META).sort()).toEqual(
      Object.keys(DEFAULT_UI_THEME_TYPOGRAPHY).sort(),
    );
  });

  it("covers every markdown field", () => {
    expect(Object.keys(THEME_MARKDOWN_META).sort()).toEqual(
      Object.keys(DEFAULT_UI_THEME_MARKDOWN).sort(),
    );
  });
});
