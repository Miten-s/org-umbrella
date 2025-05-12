import express, { Application } from "express";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

// Load environment variables from a .env file into process.env
dotenv.config();

import { connectDB } from "./configs/db.config";
import authRoutes from "./routes/auth.routes";
import roleRoutes from "./routes/role.routes";
import permissionRoutes from "./routes/permission.routes";

import API_ROUTES from "./utils/routes";
import cors from "cors";
import ENV from "./utils/environment";
import cookierParser from 'cookie-parser'

// Create an Express app
const app: Application = express();

// Enable CORS
app.use(
  cors({
    origin: ENV.CORS_ORIGINS?.split(","),
    credentials: true,
  })
);

app.use(cookierParser());

// Connect to the database
connectDB();

// Enable JSON parsing of request bodies
app.use(express.json());

// Define a health check endpoint
app.get(API_ROUTES.HEALTH, (_req, res) => {
  res.status(200).json({ message: "Permissions and roles services are LIVE!" });
});

// Rate limiter: 20 requests per 1 minute per user

const userRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50,
  keyGenerator: (req, res) => {
    return req.ip!;
  },
  handler: (_req, res) => {
    return res
      .status(429)
      .json({ message: "Too many requests. Please try again later." });
  },
});

app.use(userRateLimiter);

// Mount the authentication routes at /v1/auth

app.use(API_ROUTES.VERSIONS.v1 + API_ROUTES.AUTH, authRoutes);
app.use(API_ROUTES.VERSIONS.v1, roleRoutes);
app.use(API_ROUTES.VERSIONS.v1, permissionRoutes);

export default app;
