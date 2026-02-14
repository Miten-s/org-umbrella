import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response, NextFunction } from "express";

export const validateDto = (
  dtoClass: any,
  type?: "body" | "query" | "params"
): any => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const targetType = type ?? "body";
    const target = req[targetType];

    let payloadForValidation: any = target;
    if (
      targetType === "body" &&
      target &&
      typeof target === "object" &&
      "data" in (target as Record<string, unknown>)
    ) {
      const rawData = (target as Record<string, unknown>).data;
      if (typeof rawData !== "string") {
        return res.status(400).json({
          error: "Validation failed",
          errors: ["Invalid payload format"]
        });
      }
      try {
        payloadForValidation = JSON.parse(rawData);
      } catch {
        return res.status(400).json({
          error: "Validation failed",
          errors: ["Invalid payload format"]
        });
      }
    }

    const dtoObject = plainToInstance(dtoClass, payloadForValidation);
    const errors = await validate(dtoObject);

    if (errors.length > 0) {
      const errorMessages = errors.map((err) =>
        Object.values(err.constraints || {}).join(", ")
      );
      return res
        .status(400)
        .json({ error: "Validation failed", errors: errorMessages });
    }

    if (
      targetType === "body" &&
      target &&
      typeof target === "object" &&
      "data" in (target as Record<string, unknown>)
    ) {
      req.body = { ...(target as Record<string, unknown>), data: dtoObject };
    } else {
      req[targetType] = dtoObject;
    }
    next();
  };
};
