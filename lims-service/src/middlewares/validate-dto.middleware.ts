import { plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { Request, Response, NextFunction } from "express";

export const validateDto = (
  dtoClass: any,
  source: "body" | "query" | "params" = "body"
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data = req[source];
    if (!data) {
      res.status(400).json({ error: "No data provided" });
      return;
    }

    const dtoObject = plainToInstance(dtoClass, data);
    const errors: ValidationError[] = await validate(dtoObject);

    if (errors.length > 0) {
      const errorMessages = errors.map((err) => Object.values(err.constraints || {})).flat();
      res.status(400).json({ error: "Validation failed", details: errorMessages });
      return;
    }

    req[source] = dtoObject;
    next();
  };
};
