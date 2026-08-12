import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { logError, logInfo } from "../configs/logger.config";

/**
 * Correlation id + one structured request log line per response. Mirrors
 * gxp-service — never logs body/headers/query, only method/path/status/duration.
 */
export const requestContext = (req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers["x-request-id"] as string) || randomUUID();
  (req as Request & { id?: string }).id = requestId;
  res.setHeader("X-Request-Id", requestId);

  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Math.round(Number(process.hrtime.bigint() - start) / 1e6);
    const meta = {
      requestId,
      method: req.method,
      path: req.originalUrl.split("?")[0],
      status: res.statusCode,
      durationMs
    };
    if (res.statusCode >= 500) logError("request", meta);
    else logInfo("request", meta);
  });

  next();
};
