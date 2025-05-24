import mongoose from "mongoose";
import fs from "fs";
import path from "path";

const syncModels = async (modelsFolderPath: string): Promise<void> => {
  try {
    const modelsPath = path.resolve(modelsFolderPath);
    const files = fs.readdirSync(modelsPath);

    for (const file of files) {
      const fullPath = path.join(modelsPath, file);

      // Ensure we only import .ts/.js files (model files)
      if (fs.statSync(fullPath).isFile() && /\.(ts|js)$/.test(file)) {
        await import(fullPath);
        console.log(`Model synced: ${file}`);
      }
    }
  } catch (error) {
    console.error("Error syncing models:", error);
  }
};

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    await syncModels(path.join(__dirname, "../models"));
    console.log("MongoDB connected!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
