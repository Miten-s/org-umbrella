import { Request } from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import ENV from "../utils/environment";
import { CUSTOM_MESSAGES } from "../utils/common.util";

/** Counted per signed-in user, not per IP: behind the gateway a whole office can share one
 * address. The gateway's own per-IP limit still caps raw traffic. */
const USER_LIMIT_PER_MINUTE = 600;
const ANONYMOUS_LIMIT_PER_MINUTE = 300;

const verifiedUserIds = new WeakMap<Request, string | null>();

/** Only a token that verifies counts as a user — otherwise any made-up token would get
 * its own fresh quota. */
const userIdFrom = (req: Request): string | null => {
  if (verifiedUserIds.has(req)) return verifiedUserIds.get(req) ?? null;
  const token =
    req.cookies?.accessToken || req.headers?.authorization?.split(" ")[1];
  let userId: string | null = null;
  if (token && ENV.JWT_SECRET) {
    try {
      userId =
        (jwt.verify(token, ENV.JWT_SECRET) as { id?: string }).id ?? null;
    } catch {
      userId = null;
    }
  }
  verifiedUserIds.set(req, userId);
  return userId;
};

export const userRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: (req) =>
    userIdFrom(req) ? USER_LIMIT_PER_MINUTE : ANONYMOUS_LIMIT_PER_MINUTE,
  keyGenerator: (req) => {
    const userId = userIdFrom(req);
    return userId ? `user:${userId}` : `ip:${req.ip}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ message: CUSTOM_MESSAGES.TOO_MANY_REQUESTS });
  }
});

/** Brute-force guard on sign-in, per address and account. Successful sign-ins don't count. */
export const signInRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) =>
    `${req.ip}:${String(req.body?.email ?? "")
      .trim()
      .toLowerCase()}`,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      message:
        "Too many failed sign-in attempts. Please wait 15 minutes and try again."
    });
  }
});
