// Must load before anything that imports a class-validator/class-transformer
// DTO — class-transformer's @Type() calls Reflect.getMetadata directly (no
// guard), unlike tsc's own emitDecoratorMetadata helper which no-ops without
// this polyfill. Without it, the first DTO using @Type()/@ValidateNested()
// crashes the whole process at import time, not just at request time.
import "reflect-metadata";
import express, { Application } from "express";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();

import { connectDB, sequelize } from "./configs/db.sequelize";

import API_ROUTES from "./utils/routes";
import cors from "cors";
import ENV from "./utils/environment";
import cookierParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware";
import { securityHeaders } from "./middlewares/security.middleware";
import { requestContext } from "./middlewares/request-context.middleware";
import commonRouter from "./routes/common.router";
import { CUSTOM_MESSAGES } from "./utils/common.util";

const app: Application = express();

// Don't advertise the framework.
app.disable("x-powered-by");

// Security headers + per-request correlation id & structured access log.
app.use(securityHeaders);
app.use(requestContext);

// Enable CORS
app.use(
  cors({
    origin: ENV.CORS_ORIGINS?.split(","),
    credentials: true
  })
);

// import "./configs/redis.config";

app.use(cookierParser());

// Connect to the database

connectDB();

app.use(express.json());

// app.use(express.urlencoded({ extended: true }));

// Liveness — is the process up (no dependencies checked).
app.get(API_ROUTES.HEALTH, (_req, res) => {
  res.status(200).json({ message: CUSTOM_MESSAGES.HEALTHY_MESSAGE });
});

// Readiness — can we actually serve traffic (DB reachable)? Load balancers /
// orchestrators should route only when this is 200.
app.get("/readyz", async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ status: "ready" });
  } catch {
    res.status(503).json({ status: "not-ready" });
  }
});

// Rate limiter: 50 requests per 1 minute per user

const userRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50,
  keyGenerator: (req) => {
    return req.ip!;
  },
  handler: (_req, res) => {
    return res.status(429).json({ message: CUSTOM_MESSAGES.TOO_MANY_REQUESTS });
  }
});

app.use(userRateLimiter);

// Mount the authentication routes at /v1/auth

app.use("/uploads", express.static("uploads"));

app.use(API_ROUTES.VERSIONS.v1, commonRouter);

// Global error handler
app.use(errorHandler);

export default app;
