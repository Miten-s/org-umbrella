import { Request, Response, NextFunction } from "express";
import {
  convertMongooseError,
  CUSTOM_MESSAGES,
  getMessage
} from "../utils/common.util";

interface CustomError extends Error {
  statusCode?: number;
  errorResponse?: any;
  response?: any;
}

export const errorHandler = (
  err: CustomError,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(err); // If response is already sent, do nothing
  }

  const statusCode = err.statusCode ?? 500;
  const message = err?.errorResponse
    ? convertMongooseError({
        code: err?.errorResponse?.code,
        entity: Object.keys(err?.errorResponse?.keyValue)[0]
      })
    : getMessage(
        err.response?.data?.message ?? CUSTOM_MESSAGES.SOMETHING_WENT_WRONG
      );

  res.status(statusCode).json({
    success: false,
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
