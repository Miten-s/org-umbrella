import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import ENV from "../utils/environment";
import { IUser, User } from "../models/user.model";
import API_ROUTES from "../utils/routes";

const userCache = new Map<string, IUser>();

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

  if (
    req.route?.path?.includes(API_ROUTES.LOGOUT) ||
    req.route?.path?.includes(API_ROUTES.LOGIN)
  ) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET!) as IUser;

    const userId = decoded.id;

    // if (userCache.has(userId)) {
    //   req.user = userCache.get(userId)!;
    //   return next();
    // }

    const fetchedUser = await User.findById(userId)
      .populate("roles", ["permissions"])
      .lean();
    if (!fetchedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Cache and attach user
    // userCache.set(userId, fetchedUser);
    req.user = fetchedUser;

    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

export const clearCache = (): void => {
  userCache.clear();
};
