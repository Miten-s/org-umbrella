import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import ENV from "../utils/environment";

/** Verifies the platform's JWT (shared JWT_SECRET) — gxp-service only ever verifies it,
 * never issues or refreshes tokens itself. Mirrors lims-service/src/middlewares/auth.middleware.ts. */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token =
    req.cookies?.accessToken || req.headers?.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Authentication token not found" });
    return;
  }

  if (!ENV.JWT_SECRET) {
    res
      .status(500)
      .json({ message: "Server misconfigured: JWT_SECRET not set" });
    return;
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;

    req.user = {
      id: decoded.id,
      email: decoded.email
    };

    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
