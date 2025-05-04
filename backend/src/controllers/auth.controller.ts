import { Request, Response, NextFunction } from "express";
import { loginService, registerService } from "../services/auth.service";

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = await loginService(req.body);
    res.json({ success: true, token });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await registerService(req.body);
    res.status(201).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
