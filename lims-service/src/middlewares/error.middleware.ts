import { Request, Response, NextFunction } from "express";
import { CUSTOM_MESSAGES, getMessage } from "../utils/common.util";
import ENV from "../utils/environment";

interface CustomError extends Error {
  statusCode?: number;
  response?: any;
  errors?: any[];
}

export const errorHandler = (
  err: CustomError,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(err);
  }

  if (ENV.NODE_ENV === "development") {
    console.error(err);
  }

  let statusCode: number;
  let message: string;

  if (err?.name === "SequelizeUniqueConstraintError") {
    statusCode = 400;
    const errors = (err as any).errors || [];
    const conflict = errors
      .map((e: any) => e?.value)
      .filter((v: unknown) => v !== undefined && v !== null && v !== "")
      .join(", ");
    const fields = errors.map((e: any) => e?.path).filter(Boolean).join(", ") || "field";
    message = conflict
      ? `A record with this value already exists: "${conflict}" (${fields}).`
      : `Duplicate value for field "${fields}".`;
  } else if (err?.name === "SequelizeValidationError") {
    statusCode = 400;
    const errors = (err as any).errors || [];
    message = errors.map((e: any) => e.message).join(", ");
  } else if (err?.name === "SequelizeForeignKeyConstraintError") {
    statusCode = 400;
    message = "This record is referenced by another record and cannot be removed.";
  } else {
    statusCode = err?.statusCode ?? 500;
    message = err?.message ?? getMessage(CUSTOM_MESSAGES.SOMETHING_WENT_WRONG);
  }

  res.status(statusCode).json({
    message:
      message ??
      (statusCode === 500
        ? CUSTOM_MESSAGES.INTERNAL_SERVER_ERROR
        : CUSTOM_MESSAGES.SOMETHING_WENT_WRONG)
  });
};

/** Wraps an async route handler so a rejected promise reaches errorHandler. */
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncHandler;
