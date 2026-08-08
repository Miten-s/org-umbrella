import { Request, Response, NextFunction } from "express";
import { logError } from "../configs/logger.config";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  logError("Global Error:", { error: err.message, stack: err.stack }, "errorHandler", "error.middleware.ts");

  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({ error: err.errors[0].message });
  }

  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({ error: err.errors.map((e: any) => e.message).join(", ") });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({ error: message });
};

export default function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
