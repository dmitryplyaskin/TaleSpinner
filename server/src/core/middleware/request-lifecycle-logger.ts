import { structuredLogger } from "../logging/structured-logger";
import { getRequestContext } from "../request-context/request-context";

import type { RequestHandler } from "express";


export const requestLifecycleLogger: RequestHandler = (req, res, next) => {
  const startedAt = Date.now();
  const context = getRequestContext(req);

  structuredLogger.info("request.started", {
    event: "request.started",
    requestId: context.requestId,
    method: req.method,
    path: req.originalUrl || req.path,
  });

  res.on("finish", () => {
    structuredLogger.info("request.finished", {
      event: "request.finished",
      requestId: context.requestId,
      method: req.method,
      path: req.originalUrl || req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
};
