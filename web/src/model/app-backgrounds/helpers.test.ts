import { describe, expect, it } from "vitest";

import { resolveActiveAppBackground } from "./helpers";

import type { AppBackgroundAsset } from "@shared/types/app-background";

describe("app background helpers", () => {
  const items: AppBackgroundAsset[] = [
    {
      id: "builtin:default",
      name: "Default background",
      source: "builtin",
      imageUrl: "/defaults/backgrounds/default-bg.png",
      deletable: false,
    },
    {
      id: "upload:1",
      name: "Imported",
      source: "uploaded",
      imageUrl: "/media/images/app-backgrounds/imported.png",
      deletable: true,
    },
  ];

  it("returns matching active background", () => {
    expect(resolveActiveAppBackground(items, "upload:1")?.id).toBe("upload:1");
  });

  it("falls back to built-in background when id is missing", () => {
    expect(resolveActiveAppBackground(items, "upload:missing")?.id).toBe("builtin:default");
  });
});
