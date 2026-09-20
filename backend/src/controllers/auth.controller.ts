import { Request, Response, NextFunction } from "express";
import { loginService, ACCESS_TOKEN_TTL_MS } from "../services/auth.service";
import { CUSTOM_MESSAGES, isAppError } from "../utils/common.util";
import { logError, logInfo } from "../configs/logger.config";
import ENV from "../utils/environment";

/** The cookie was previously set with no attributes at all: readable by any script on the
 * page, sent over plain http, and with no expiry. The frontend never reads it from JS — it
 * uses the token from the login response body as a Bearer header — so httpOnly costs
 * nothing here. */
const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: ENV.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: ACCESS_TOKEN_TTL_MS
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = await loginService(req.body);
    res.cookie("accessToken", token, ACCESS_COOKIE_OPTIONS);
    res.json({ message: CUSTOM_MESSAGES.LOGIN_SUCCESSFUL, accessToken: token });
    logInfo(CUSTOM_MESSAGES.LOGIN_SUCCESSFUL, null, "auth.controller/login");
  } catch (error: unknown) {
    logError(
      CUSTOM_MESSAGES.SOMETHING_WENT_WRONG,
      null,
      "auth.controller/login"
    );
    res.status(401).json({
      error:
        (isAppError(error) ? error?.message : error) ??
        CUSTOM_MESSAGES.SOMETHING_WENT_WRONG
    });
    next(error);
  }
};

export const logout = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Same attributes as when it was set — a mismatch leaves the cookie in place.
    res.clearCookie("accessToken", { ...ACCESS_COOKIE_OPTIONS, maxAge: undefined });
    logInfo(CUSTOM_MESSAGES.LOGOUT_SUCCESSFUL, null, "auth.controller/logout");
    res.json({ message: CUSTOM_MESSAGES.LOGOUT_SUCCESSFUL });
  } catch (error) {
    logError(
      CUSTOM_MESSAGES.SOMETHING_WENT_WRONG,
      null,
      "auth.controller/logout"
    );
    res.status(401).json({
      error:
        (isAppError(error) ? error?.message : error) ??
        CUSTOM_MESSAGES.SOMETHING_WENT_WRONG
    });
    next(error);
  }
};
