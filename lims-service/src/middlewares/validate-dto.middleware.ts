import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response, NextFunction } from "express";

/** Mirrors gxp-service/src/middlewares/validate-dto.middleware.ts exactly. */
export const validateDto = (dtoClass: any, type?: "body" | "query" | "params"): any => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const targetType = type ?? "body";
    const target = req[targetType];

    const dtoObject = plainToInstance(dtoClass, target);
    const errors = await validate(dtoObject, { whitelist: true, forbidNonWhitelisted: false });

    if (errors.length > 0) {
      const errorMessages = errors.map((err) => Object.values(err.constraints || {}).join(", "));
      return res.status(400).json({ error: "Validation failed", errors: errorMessages });
    }

    req[targetType] = dtoObject;
    next();
  };
};
