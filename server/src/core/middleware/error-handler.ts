import { type NextFunction, type Request, type Response } from "express";

import { type ApiErrorBody } from "@core/http/response";
import { type Logger } from "@core/types/common";
import { getRequestContext } from "../request-context/request-context";

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "HttpError";
  }
}

const toErrorBody = (
  message: string,
  details?: unknown,
  code?: string
): ApiErrorBody => ({
  error: {
    message,
    ...(code ? { code } : {}),
    ...(details !== undefined ? { details } : {}),
  },
});

export const errorHandler = (logger?: Logger) => {
  // Express recognizes error middleware by 4 params: (err, req, res, next)
  return (error: Error, req: Request, res: Response, _next: NextFunction) => {
    const context = getRequestContext(req);
    if (error instanceof HttpError) {
      logger?.error(error.message, {
        event: "request.error",
        requestId: context.requestId,
        statusCode: error.statusCode,
        code: error.code,
        details: error.details,
        method: req.method,
        path: req.path,
      });

      res
        .status(error.statusCode)
        .json(toErrorBody(error.message, error.details, error.code));
    } else {
      logger?.error("Unexpected error", {
        event: "request.error",
        requestId: context.requestId,
        error,
        method: req.method,
        path: req.path,
      });

      res.status(500).json(toErrorBody("Internal Server Error"));
    }
  };
};
