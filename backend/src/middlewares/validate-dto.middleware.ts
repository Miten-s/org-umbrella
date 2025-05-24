import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response, NextFunction } from "express";

export const validateDto = (
  dtoClass: any,
  type?: "body" | "query" | "params"
): any => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dtoObject = plainToInstance(dtoClass, req[type ?? "body"]);
    const errors = await validate(dtoObject);

    if (errors.length > 0) {
      const errorMessages = errors.map((err) =>
        Object.values(err.constraints || {}).join(", ")
      );
      return res
        .status(400)
        .json({ message: "Validation failed", errors: errorMessages });
    }

    req.body = dtoObject;
    next();
  };
};
