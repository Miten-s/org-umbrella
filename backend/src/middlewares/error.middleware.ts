import { Request, Response, NextFunction } from "express";
import {
  convertMongooseError,
  CUSTOM_MESSAGES,
  getMessage
} from "../utils/common.util";
import ENV from "../utils/environment";

interface CustomError extends Error {
  statusCode?: number;
  errorResponse?: any;
  response?: any;
  code?: number;
  path?: string;
  value?: string;
  keyValue?: string;
  errors?: { [key: string]: { message?: string } };
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
    console.log(err);
  }

  let statusCode: number;
  let message: string;

  // Handle Sequelize Unique Constraint Error
  if (err?.name === "SequelizeUniqueConstraintError") {
    statusCode = 400;
    const field = (err as any).errors?.[0]?.path || "field";
    message = `Duplicate value for field "${field}".`;
  }
  // Handle Sequelize Validation Error
  else if (err?.name === "SequelizeValidationError") {
    statusCode = 400;
    message = (err as any).errors?.map((e: any) => e.message).join(", ") || err.message;
  }
  // Handle Sequelize Foreign Key Constraint Error
  else if (err?.name === "SequelizeForeignKeyConstraintError") {
    statusCode = 400;
    message = `Foreign key constraint violation: ${(err as any).parent?.detail || err.message}`;
  }

  // Handle Mongoose Validation Error (Backward compatibility)
  else if (err?.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err?.errors ?? {})
      .map((e) => e.message)
      .join(", ");
  }

  // Handle Invalid ObjectId or CastError
  else if (err?.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Handle Duplicate Key Error (E11000)
  else if (err?.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err?.keyValue ?? {})[0];

    message = field
      ? `Duplicate value for field "${field}".`
      : err?.errorResponse?.message;
  }

  // Handle Document Not Found
  else if (err?.name === "DocumentNotFoundError") {
    statusCode = 404;
    message = "Document not found.";
  } else {
    statusCode = err?.statusCode ?? 500;
    message =
      err?.message ??
      (err?.errorResponse
        ? (convertMongooseError({
            code: err?.errorResponse?.code,
            entity: Object.keys(err?.errorResponse?.keyValue)[0]
          }) ?? CUSTOM_MESSAGES.SOMETHING_WENT_WRONG)
        : getMessage(
            err.response?.data?.message ?? CUSTOM_MESSAGES.SOMETHING_WENT_WRONG
          ));
  }

  res.status(statusCode).json({
    message:
      message ??
      (statusCode === 500
        ? CUSTOM_MESSAGES.INTERNAL_SERVER_ERROR
        : CUSTOM_MESSAGES.SOMETHING_WENT_WRONG)
  });
};

/**
 * Wraps an async function inside a try-catch block and returns the caught error.
 * Works for both Express routes and general async operations.
 */
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncHandler;
