import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token =
    req.cookies?.accessToken || req.headers?.authorization?.split(" ")[1];

  if (!token) {
    res.status(404).json({ error: "Token not found" });
    return;
  }

  try {
    const fetchedUser = {
      id: new mongoose.Types.ObjectId("68455e2705898d594c374636"),
      email: "mitenpate1234@gmail.com",
      username: "Test user 1",
      roles: ["ADMIN"]
    };

    req.user = fetchedUser;

    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};
