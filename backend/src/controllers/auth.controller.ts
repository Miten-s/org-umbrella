import { Request, Response, NextFunction } from "express";
import { loginService } from "../services/auth.service";
import { CUSTOM_MESSAGES, isAppError } from "../utils/common.util";

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = await loginService(req.body);
    res.cookie("accessToken", token);
    res.json({ success: true, message: CUSTOM_MESSAGES.LOGIN_SUCCESSFUL });
  } catch (error: unknown) {
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
    res.json({ success: true, message: CUSTOM_MESSAGES.LOGOUT_SUCCESSFUL });
  } catch (error) {
    next(error);
  }
};
