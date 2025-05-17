import mongoose from "mongoose";

// Syncing models

import '../models/role.model';
import '../models/permission.model';

export const connectDB = async (): Promise<void> => {
  try {

    await mongoose.connect(process.env.MONGO_URI!);
    console.log("MongoDB connected!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
