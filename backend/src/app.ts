import express, { Application } from "express";
import dotenv from "dotenv";

// Load environment variables from a .env file into process.env
dotenv.config();

import { connectDB } from "./configs/db.config";
import authRoutes from "./routes/auth.routes";
import roleRoutes from "./routes/role.routes";
import permissionRoutes from "./routes/permission.routes";

import API_ROUTES from "./utils/routes";
import cors from "cors";

// Create an Express app
const app: Application = express();

// Connect to the database
connectDB();

// Enable CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Enable JSON parsing of request bodies
app.use(express.json());

// Define a health check endpoint
app.get(API_ROUTES.HEALTH, (_req, res) => {
  res.status(200).json({ message: "Permissions and roles services are LIVE!" });
});

// Mount the authentication routes at /v1/auth

app.use(API_ROUTES.VERSIONS.v1 + API_ROUTES.AUTH, authRoutes);
app.use(API_ROUTES.VERSIONS.v1, roleRoutes);
app.use(API_ROUTES.VERSIONS.v1, permissionRoutes);

export default app;
