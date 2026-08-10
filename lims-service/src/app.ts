import "reflect-metadata";
import express, { Application } from "express";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";

dotenv.config();

import { connectDB } from "./configs/db.sequelize";
import { initKafkaConsumers } from "./services/kafka.service";
import API_ROUTES from "./utils/routes";
import cors from "cors";
import ENV from "./utils/environment";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware";
import commonRouter from "./routes/common.router";
import { CUSTOM_MESSAGES } from "./utils/common.util";

const app: Application = express();

app.use(
  cors({
    origin: ENV.CORS_ORIGINS?.split(","),
    credentials: true
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("query parser", "extended");

connectDB();
initKafkaConsumers();

const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use("/uploads", express.static(uploadDir));

app.get(API_ROUTES.HEALTH, (_req, res) => {
  res.status(200).json({ message: CUSTOM_MESSAGES.HEALTHY_MESSAGE });
});

const userRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  handler: (_req, res) => {
    res.status(429).json({ message: CUSTOM_MESSAGES.TOO_MANY_REQUESTS });
  }
});
app.use(userRateLimiter);

app.use(API_ROUTES.VERSIONS.v1, commonRouter);

app.use(errorHandler as any);

export default app;
