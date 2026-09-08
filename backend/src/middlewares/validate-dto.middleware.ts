import { plainToInstance } from "class-transformer";
import { validate, ValidatorOptions } from "class-validator";
import { Request, Response, NextFunction } from "express";

export const validateDto = (
  dtoClass: any,
  type?: "body" | "query" | "params",
  validatorOptions?: ValidatorOptions
): any => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const source = req[type ?? "body"];
    const payload =
      typeof source?.data === "string" ? JSON.parse(source.data) : source;
    const dtoObject = plainToInstance(dtoClass, payload);
    const errors = await validate(dtoObject, validatorOptions);

    if (errors.length > 0) {
      const errorMessages = errors.map((err) =>
        Object.values(err.constraints || {}).join(", ")
      );
      return res
        .status(400)
        .json({ error: "Validation failed", errors: errorMessages });
    }

    req[type ?? "body"] = dtoObject;
    next();
  };
};

/**
 * Same field-level validation as `validateDto`, applied to EVERY item of an array field
 * (e.g. bulk-copy's `records[]`) instead of the body itself. `nestedField`, when given,
 * validates `items[i][nestedField]` instead of `items[i]` (bulk-update's `{id, payload}`).
 */
export const validateDtoArray = (
  dtoClass: any,
  arrayField: string,
  nestedField?: string,
  validatorOptions?: ValidatorOptions
): any => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const items = (req.body as Record<string, unknown>)?.[arrayField];
    if (!Array.isArray(items)) return next();

    const allErrors: string[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i] as Record<string, unknown>;
      const target = nestedField ? item?.[nestedField] : item;
      const dtoObject: any = plainToInstance(dtoClass, target as object);
      const errors = await validate(dtoObject, validatorOptions);
      if (errors.length) {
        const suffix =
          items.length > 1 ? ` (record ${i + 1} of ${items.length})` : "";
        allErrors.push(
          ...errors
            .flatMap((err) => Object.values(err.constraints || {}))
            .map((msg) => `${msg}${suffix}`)
        );
      }
      if (nestedField) item[nestedField] = dtoObject;
      else items[i] = dtoObject;
    }

    if (allErrors.length > 0) {
      return res
        .status(400)
        .json({ error: "Validation failed", errors: allErrors });
    }
    next();
  };
};
