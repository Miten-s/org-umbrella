import express, { Application } from "express";
import dotenv from "dotenv";

dotenv.config();

import { connectDB } from "./configs/db.config";
import authRoutes from "./routes/auth.routes";

const app: Application = express();

connectDB();

app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({ message: "Permissions and roles services are LIVE!" });
})
app.use("/auth", authRoutes);

export default app;
