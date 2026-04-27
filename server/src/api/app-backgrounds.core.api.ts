import path from "node:path";

import express, { type Request } from "express";
import multer from "multer";
import { z } from "zod";

import { asyncHandler } from "@core/middleware/async-handler";
import { HttpError } from "@core/middleware/error-handler";
import { validate } from "@core/middleware/validate";

import {
  deleteAppBackground,
  getAppBackgroundCatalog,
  importAppBackground,
  setAppBackgroundActive,
} from "../services/app-backgrounds/app-backgrounds-repository";

const router = express.Router();

const allowedMimesByExtension: Record<string, readonly string[]> = {
  ".png": ["image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".gif": ["image/gif"],
  ".webp": ["image/webp"],
  ".svg": ["image/svg+xml"],
};

function normalizeMimeType(mimeType: string): string {
  return String(mimeType ?? "")
    .toLowerCase()
    .split(";")[0]
    .trim();
}

function isAllowedImageType(params: { originalName: string; mimeType: string }): boolean {
  const extension = path.extname(params.originalName).toLowerCase();
  const allowedMimes = allowedMimesByExtension[extension];
  if (!allowedMimes) return false;
  return allowedMimes.includes(normalizeMimeType(params.mimeType));
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (isAllowedImageType({ originalName: file.originalname, mimeType: file.mimetype })) {
      return cb(null, true);
    }
    cb(new Error("Unsupported file type"));
  },
});

const idParamsSchema = z
  .object({
    id: z.string().min(1),
  })
  .strict();

export const appBackgroundActiveBodySchema = z
  .object({
    activeBackgroundId: z.string().min(1).nullable(),
  })
  .strict();

router.get(
  "/app-backgrounds",
  asyncHandler(async () => {
    const data = await getAppBackgroundCatalog();
    return { data };
  })
);

router.post(
  "/app-backgrounds/import",
  upload.single("image"),
  asyncHandler(async (req: Request) => {
    if (!req.file) {
      throw new HttpError(400, "Image is required", "VALIDATION_ERROR");
    }

    const data = await importAppBackground({
      fileBuffer: req.file.buffer,
      originalName: req.file.originalname,
    });
    return { data };
  })
);

router.put(
  "/app-backgrounds/active",
  validate({ body: appBackgroundActiveBodySchema }),
  asyncHandler(async (req: Request) => {
    const body = appBackgroundActiveBodySchema.parse(req.body);
    const data = await setAppBackgroundActive(body);
    return { data };
  })
);

router.delete(
  "/app-backgrounds/:id",
  validate({ params: idParamsSchema }),
  asyncHandler(async (req: Request) => {
    const params = idParamsSchema.parse(req.params);
    const data = await deleteAppBackground({ id: params.id });
    return { data };
  })
);

export default router;
