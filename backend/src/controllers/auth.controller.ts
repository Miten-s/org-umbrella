import { Request, Response, NextFunction } from "express";
import { loginService } from "../services/auth.service";
import { CUSTOM_MESSAGES, isAppError } from "../utils/common.util";
import { logError, logInfo } from "../configs/logger.config";

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = await loginService(req.body);
    res.cookie("accessToken", token);
    res.json({ success: true, message: CUSTOM_MESSAGES.LOGIN_SUCCESSFUL });
    logInfo(CUSTOM_MESSAGES.LOGIN_SUCCESSFUL, null, "auth.controller/login");
  } catch (error: unknown) {
    logError(
      CUSTOM_MESSAGES.SOMETHING_WENT_WRONG,
      null,
      "auth.controller/login"
    );
    res.status(401).json({
      message:
        (isAppError(error) ? error?.message : error) ??
        CUSTOM_MESSAGES.SOMETHING_WENT_WRONG,
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
    res.clearCookie("accessToken");
    logInfo(CUSTOM_MESSAGES.LOGOUT_SUCCESSFUL, null, "auth.controller/logout");
    res.json({ success: true, message: CUSTOM_MESSAGES.LOGOUT_SUCCESSFUL });
  } catch (error) {
    logError(
      CUSTOM_MESSAGES.SOMETHING_WENT_WRONG,
      null,
      "auth.controller/logout"
    );
    res.status(401).json({
      message:
        (isAppError(error) ? error?.message : error) ??
        CUSTOM_MESSAGES.SOMETHING_WENT_WRONG,
    });
    next(error);
  }
};
