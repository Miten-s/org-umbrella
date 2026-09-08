// Must be first: class-transformer's @Type() on the nested sub-form DTOs reads
// design-time metadata, which only exists once this polyfill is loaded.
import "reflect-metadata";
import express, { Application } from "express";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();

import { connectDB, sequelize } from "./configs/db.sequelize";

import API_ROUTES from "./utils/routes";
import cors from "cors";
import ENV from "./utils/environment";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware";
import { securityHeaders } from "./middlewares/security.middleware";
import { requestContext } from "./middlewares/request-context.middleware";
import commonRouter from "./routes/common.router";
import { CUSTOM_MESSAGES } from "./utils/common.util";

const app: Application = express();

// Don't advertise the framework.
app.disable("x-powered-by");

// `filter[field]=value` (spec §3) needs the extended query parser so it lands
// as a nested object (query.filter = { field: value }), not a flat string.
app.set("query parser", "extended");

// Security headers + per-request correlation id & structured access log.
app.use(securityHeaders);
app.use(requestContext);

// Fail closed, not open: `cors({ origin: undefined })` reads as "allow any origin" —
// refusing to boot without `CORS_ORIGINS` set beats silently running wide open.
if (!ENV.CORS_ORIGINS) {
  throw new Error(
    "CORS_ORIGINS is not set. Refusing to start lims-service with an unrestricted CORS policy."
  );
}

app.use(
  cors({
    origin: ENV.CORS_ORIGINS.split(","),
    credentials: true
  })
);

app.use(cookieParser());

connectDB();

app.use(express.json());

// Liveness — is the process up (no dependencies checked).
app.get(API_ROUTES.HEALTH, (_req, res) => {
  res.status(200).json({ message: CUSTOM_MESSAGES.HEALTHY_MESSAGE });
});

// Readiness — can we actually serve traffic (DB reachable)?
app.get("/readyz", async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ status: "ready" });
  } catch {
    res.status(503).json({ status: "not-ready" });
  }
});

// Rate limiter: 200 requests per minute per IP — LIMS pages fan out to more
// endpoints per view (dropdown option fetches) than a typical CRUD screen.
const userRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  keyGenerator: (req) => req.ip!,
  handler: (_req, res) => {
    return res.status(429).json({ message: CUSTOM_MESSAGES.TOO_MANY_REQUESTS });
  }
});

app.use(userRateLimiter);

// Attachments are NOT served from here — the old unauthenticated "/uploads" static mount
// (LIMS_AUDIT C1) is gone; every attachment goes through the checked download route instead.

app.use(API_ROUTES.VERSIONS.v1, commonRouter);

// Global error handler
app.use(errorHandler);

export default app;
