import winston from "winston";
import "winston-daily-rotate-file";
import path from "path";
import fs from "fs";

const logDir = path.resolve(process.cwd(), "logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} [${level}]: ${message} ${
    Object.keys(meta).length ? JSON.stringify(meta) : ""
  }`;
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, "error-%QA.log"),
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxFiles: "14d"
    }),
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, "app-%QA.log"),
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d"
    })
  ]
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), logFormat)
    })
  );
}

export const logError = (msg: string, meta?: any, method?: string, file?: string) => {
  logger.error(msg, { ...meta, method, file });
};

export const logInfo = (msg: string, meta?: any, method?: string, file?: string) => {
  logger.info(msg, { ...meta, method, file });
};
