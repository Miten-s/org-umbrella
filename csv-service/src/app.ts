import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import ENV from "./utils/environment";
import routes from "./routes";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

const allowedOrigins = ENV.CORS_ORIGINS.split(",");
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        ENV.NODE_ENV === "development"
      ) {
        callback(null, true);
      } else {
        callback(new Error("CORS Policy Violation"));
      }
    },
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded evidence static files securely
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Health Check Endpoints
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "csv-service",
    timestamp: new Date()
  });
});

app.get("/api/v1/csv/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "csv-service",
    phase:
      "Phase 8 - Audit Package ZIP Exporter & Periodic Review Maintenance (Complete)"
  });
});

// API Routes
app.use("/api/v1/csv", routes);

// Error Handler Middleware
app.use(errorHandler);

export default app;
