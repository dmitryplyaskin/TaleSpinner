import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { gunzip, gzip } from "node:zlib";

import { parseTaleSpinnerBundle, type TaleSpinnerBundle } from "@shared/types/bundles";
import { z } from "zod";

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

const archiveFileSchema = z
  .object({
    fileName: z.string().min(1),
    mediaType: z.string().min(1),
    dataBase64: z.string().min(1),
    sha256: z.string().min(1),
  })
  .strict();

const archivePackageSchema = z
  .object({
    manifest: z.unknown(),
    files: z.record(z.string(), archiveFileSchema),
  })
  .strict();

export type BundleArchiveFile = {
  fileName: string;
  mediaType: string;
  data: Buffer;
};

export async function encodeBundleArchive(input: {
  manifest: TaleSpinnerBundle;
  files: Record<string, BundleArchiveFile>;
}): Promise<Buffer> {
  const files = Object.fromEntries(
    Object.entries(input.files).map(([archivePath, file]) => {
      const sha256 = createHash("sha256").update(file.data).digest("hex");
      return [
        archivePath,
        {
          fileName: file.fileName,
          mediaType: file.mediaType,
          dataBase64: file.data.toString("base64"),
          sha256,
        },
      ];
    })
  );

  const payload = Buffer.from(
    JSON.stringify({
      manifest: input.manifest,
      files,
    }),
    "utf8"
  );
  return gzipAsync(payload);
}

export async function decodeBundleArchive(buffer: Buffer): Promise<{
  manifest: TaleSpinnerBundle;
  files: Record<string, BundleArchiveFile>;
}> {
  const decodedText = (await gunzipAsync(buffer)).toString("utf8");
  const parsed = archivePackageSchema.parse(JSON.parse(decodedText) as unknown);
  const manifest = parseTaleSpinnerBundle(parsed.manifest);

  const files = Object.fromEntries(
    Object.entries(parsed.files).map(([archivePath, file]) => {
      const data = Buffer.from(file.dataBase64, "base64");
      const sha256 = createHash("sha256").update(data).digest("hex");
      if (sha256 !== file.sha256) {
        throw new Error(`Archive file checksum mismatch: ${archivePath}`);
      }
      return [
        archivePath,
        {
          fileName: file.fileName,
          mediaType: file.mediaType,
          data,
        },
      ];
    })
  );

  return { manifest, files };
}
