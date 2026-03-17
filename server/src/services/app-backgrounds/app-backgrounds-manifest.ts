import fs from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import { resolveMonorepoRoot } from "../../config/path-resolver";

import type { AppBackgroundAsset } from "@shared/types/app-background";

const backgroundManifestSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            id: z.string().min(1),
            name: z.string().min(1).max(256),
            fileName: z.string().min(1),
          })
          .strict()
      )
      .min(1),
  })
  .strict();

export function resolveBuiltInBackgroundsDir(monorepoRoot: string = resolveMonorepoRoot()): string {
  return path.join(monorepoRoot, "default", "backgrounds");
}

function toBuiltInImageUrl(fileName: string): string {
  return `/defaults/backgrounds/${encodeURIComponent(fileName)}`;
}

export async function loadBuiltInAppBackgrounds(params?: {
  monorepoRoot?: string;
}): Promise<AppBackgroundAsset[]> {
  const monorepoRoot = params?.monorepoRoot ?? resolveMonorepoRoot();
  const backgroundsDir = resolveBuiltInBackgroundsDir(monorepoRoot);
  const manifestPath = path.join(backgroundsDir, "manifest.json");
  const parsed = backgroundManifestSchema.parse(
    JSON.parse(await fs.readFile(manifestPath, "utf8")) as unknown
  );

  await Promise.all(
    parsed.items.map(async (item) => {
      await fs.access(path.join(backgroundsDir, item.fileName));
    })
  );

  return parsed.items.map((item) => ({
    id: item.id,
    name: item.name,
    source: "builtin" as const,
    imageUrl: toBuiltInImageUrl(item.fileName),
    deletable: false,
  }));
}
