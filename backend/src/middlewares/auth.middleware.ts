import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import ENV from "../utils/environment";
import { IUser, User } from "../models/user.model";
import API_ROUTES from "../utils/routes";
// import { cacheResponse, getCachedResponse } from "../configs/redis.config";

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

    // Attempt to fetch the user from Redis
    // const cachedUser = await getCachedResponse(userId);
    // if (cachedUser) {
    //   req.user = JSON.parse(cachedUser) as IUser;
    //   return next();
    // }
    // const cachedUser = await getCachedResponse(userId);
    // if (cachedUser) {
    //   req.user = JSON.parse(cachedUser) as IUser;
    //   return next();
    // }

    const fetchedUser = await User.findById(userId)
      .populate("roles", ["permissions"])
      .lean();

    if (!fetchedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Cache the user data in Redis
    // await cacheResponse({ key: userId, value: JSON.stringify(fetchedUser) });
    req.user = fetchedUser;

    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};
