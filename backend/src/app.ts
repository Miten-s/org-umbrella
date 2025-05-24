import express, { Application } from "express";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();

import { connectDB } from "./configs/db.config";

import API_ROUTES from "./utils/routes";
import cors from "cors";
import ENV from "./utils/environment";
import cookierParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware";
import commonRouter from "./routes/common.router";

const app: Application = express();

// Enable CORS
app.use(
  cors({
    origin: ENV.CORS_ORIGINS?.split(","),
    credentials: true
  })
);

app.use(cookierParser());

// Connect to the database
connectDB();

app.use(express.json());

app.get(API_ROUTES.HEALTH, (_req, res) => {
  res.status(200).json({ message: "Permissions and roles services are LIVE!" });
});

// Rate limiter: 20 requests per 1 minute per user

const userRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50,
  keyGenerator: (req) => {
    return req.ip!;
  },
  handler: (_req, res) => {
    return res
      .status(429)
      .json({ message: "Too many requests. Please try again later." });
  }
});

app.use(userRateLimiter);

// Mount the authentication routes at /v1/auth

app.use(API_ROUTES.VERSIONS.v1, commonRouter);

// Global error handler
app.use(errorHandler);

export default app;
