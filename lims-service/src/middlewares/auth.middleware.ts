import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import ENV from "../utils/environment";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token =
    req.cookies?.accessToken || req.headers?.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Authentication token not found" });
    return;
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET!) as any;

    req.user = {
      id: decoded.id,
      fullName: decoded.fullName,
      email: decoded.email,
      roles: decoded.roles || []
    };

    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
