import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const logFormat = format.printf(({ level, message, timestamp, ...meta }) => {
  return JSON.stringify({
    timestamp,
    level,
    message,
    ...((meta.functionName as string) && { functionName: meta.functionName }),
    ...((meta.fileName as string) && { fileName: meta.fileName }),
    ...((meta.context as object) && { context: meta.context })
  });
});

const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), logFormat),
  transports: [
    new transports.Console(),

    new DailyRotateFile({
      dirname: "logs",
      filename: "app-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
      level: "info"
    }),

    new DailyRotateFile({
      dirname: "logs",
      filename: "error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d",
      level: "error"
    })
  ]
});

/**
 * This function logs an info message.
 * It takes the message and the context, and logs the message with the level "info".
 */
export function logInfo(
  message: string,
  context?: object | null,
  functionName?: string,
  fileName?: string
) {
  logger.info(message, { context, functionName, fileName });
}

/**
 * This function logs an error message.
 * It takes the message and the context, and logs the message with the level "error".
 */
export function logError(
  message: string,
  context?: object | null,
  functionName?: string,
  fileName?: string
) {
  logger.error(message, { context, functionName, fileName });
}
