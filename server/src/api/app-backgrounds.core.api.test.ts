import { describe, expect, test } from "vitest";

import { appBackgroundActiveBodySchema } from "./app-backgrounds.core.api";

describe("app background route schemas", () => {
  test("accepts active background id patch", () => {
    const parsed = appBackgroundActiveBodySchema.safeParse({
      activeBackgroundId: "builtin:mist",
    });

    expect(parsed.success).toBe(true);
  });

  test("accepts clearing active background id", () => {
    const parsed = appBackgroundActiveBodySchema.safeParse({
      activeBackgroundId: null,
    });

    expect(parsed.success).toBe(true);
  });

  test("rejects unknown patch keys", () => {
    const parsed = appBackgroundActiveBodySchema.safeParse({
      activeBackgroundId: "builtin:mist",
      injected: true,
    });

    expect(parsed.success).toBe(false);
  });
});
