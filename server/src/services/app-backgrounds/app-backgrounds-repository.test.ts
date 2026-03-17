import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, test } from "vitest";

import {
  loadBuiltInAppBackgrounds,
  mergeAppBackgroundAssets,
  resolveActiveBackgroundId,
} from "./app-backgrounds-repository";

import type { AppBackgroundAsset } from "@shared/types/app-background";

describe("app-backgrounds-repository", () => {
  test("loads built-in backgrounds from manifest", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "ts-app-backgrounds-"));
    const backgroundsDir = path.join(rootDir, "default", "backgrounds");

    await fs.mkdir(backgroundsDir, { recursive: true });
    await fs.writeFile(path.join(backgroundsDir, "mist.png"), "fixture");
    await fs.writeFile(
      path.join(backgroundsDir, "manifest.json"),
      JSON.stringify({
        items: [
          {
            id: "builtin:mist",
            name: "Mist",
            fileName: "mist.png",
          },
        ],
      })
    );

    await expect(loadBuiltInAppBackgrounds({ monorepoRoot: rootDir })).resolves.toEqual([
      {
        id: "builtin:mist",
        name: "Mist",
        source: "builtin",
        imageUrl: "/defaults/backgrounds/mist.png",
        deletable: false,
      },
    ]);

    await fs.rm(rootDir, { recursive: true, force: true });
  });

  test("merges built-in assets before uploaded assets", () => {
    const builtIns: AppBackgroundAsset[] = [
      {
        id: "builtin:mist",
        name: "Mist",
        source: "builtin",
        imageUrl: "/defaults/backgrounds/mist.png",
        deletable: false,
      },
    ];
    const uploads: AppBackgroundAsset[] = [
      {
        id: "upload:123",
        name: "User Mist",
        source: "uploaded",
        imageUrl: "/media/images/app-backgrounds/user-mist.png",
        deletable: true,
      },
    ];

    expect(mergeAppBackgroundAssets(builtIns, uploads)).toEqual([...builtIns, ...uploads]);
  });

  test("falls back to first built-in background when active id is missing", () => {
    const items: AppBackgroundAsset[] = [
      {
        id: "builtin:mist",
        name: "Mist",
        source: "builtin",
        imageUrl: "/defaults/backgrounds/mist.png",
        deletable: false,
      },
      {
        id: "upload:123",
        name: "User Mist",
        source: "uploaded",
        imageUrl: "/media/images/app-backgrounds/user-mist.png",
        deletable: true,
      },
    ];

    expect(resolveActiveBackgroundId({ activeBackgroundId: "upload:missing", items })).toBe("builtin:mist");
  });
});
