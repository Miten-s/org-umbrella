import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import ENV from "../utils/environment";
import { IUser } from "../models/user.model";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token =
    req.cookies?.accessToken || req.headers?.authorization?.split(" ")[1];

  if (!token) {
    res.status(404).json({ message: "Token not found" });
    return;
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET!);
    req.user = decoded as IUser;

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
