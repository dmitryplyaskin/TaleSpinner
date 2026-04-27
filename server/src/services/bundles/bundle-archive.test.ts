import {
  createBundleResourceId,
  type TaleSpinnerBundle,
} from "@shared/types/bundles";
import { describe, expect, test } from "vitest";

import { decodeBundleArchive, encodeBundleArchive } from "./bundle-archive";

describe("bundle archive", () => {
  test("round-trips manifest and files through .tsbundle archive", async () => {
    const resourceId = createBundleResourceId("entity_profile", "hero");
    const manifest: TaleSpinnerBundle = {
      type: "talespinner.bundle",
      version: 1,
      bundleId: "bundle-1",
      createdAt: "2026-03-13T10:00:00.000Z",
      container: "archive",
      sourceResourceId: resourceId,
      resources: [
        {
          resourceId,
          kind: "entity_profile",
          schemaVersion: 1,
          role: "primary",
          title: "Hero",
          payload: {
            name: "Hero",
            kind: "CharSpec",
            spec: { name: "Hero" },
            isFavorite: false,
            avatarFile: {
              path: "files/hero/avatar.png",
              fileName: "avatar.png",
              mediaType: "image/png",
            },
          },
        },
      ],
    };

    const archive = await encodeBundleArchive({
      manifest,
      files: {
        "files/hero/avatar.png": {
          fileName: "avatar.png",
          mediaType: "image/png",
          data: Buffer.from([1, 2, 3, 4]),
        },
      },
    });
    const decoded = await decodeBundleArchive(archive);

    expect(decoded.manifest).toEqual(manifest);
    expect(decoded.files["files/hero/avatar.png"]?.data).toEqual(Buffer.from([1, 2, 3, 4]));
  });
});
