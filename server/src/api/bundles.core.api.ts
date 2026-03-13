import express, { type Request } from "express";
import multer from "multer";
import { z } from "zod";

import { asyncHandler } from "@core/middleware/async-handler";
import { HttpError } from "@core/middleware/error-handler";
import { validate } from "@core/middleware/validate";

import { ownerIdSchema } from "../chat-core/schemas";
import { getRequestOwnerId } from "../core/request-context/request-context";
import { exportBundleSelection } from "../services/bundles/export-bundle-selection";
import { importBundleFile } from "../services/bundles/import-bundle-file";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const resourceKindSchema = z.enum([
  "instruction",
  "operation_block",
  "operation_profile",
  "world_info_book",
  "entity_profile",
  "ui_theme_preset",
]);

const exportBodySchema = z
  .object({
    ownerId: ownerIdSchema.optional(),
    source: z.object({
      kind: resourceKindSchema,
      id: z.string().min(1),
    }),
    selections: z
      .array(
        z.object({
          kind: resourceKindSchema,
          id: z.string().min(1),
        })
      )
      .min(1),
    format: z.enum(["json", "archive", "auto"]).optional().default("auto"),
  })
  .strict();

router.post(
  "/bundles/export",
  validate({ body: exportBodySchema }),
  asyncHandler(async (req: Request) => {
    const body = exportBodySchema.parse(req.body);
    const exported = await exportBundleSelection({
      ownerId: getRequestOwnerId(req, body.ownerId),
      source: body.source,
      selections: body.selections,
      format: body.format,
    });

    return {
      data: exported.buffer,
      headers: {
        "Content-Type": exported.contentType,
        "Content-Disposition": `attachment; filename="${exported.fileName}"`,
      },
      raw: true,
    };
  })
);

router.post(
  "/bundles/import",
  upload.single("file"),
  asyncHandler(async (req: Request) => {
    if (!req.file) {
      throw new HttpError(400, "file is required", "VALIDATION_ERROR");
    }
    return {
      data: await importBundleFile({
        ownerId: getRequestOwnerId(req),
        fileName: req.file.originalname,
        buffer: req.file.buffer,
      }),
    };
  })
);

export default router;
