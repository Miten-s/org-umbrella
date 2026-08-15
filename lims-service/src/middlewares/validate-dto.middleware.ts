import { plainToInstance } from "class-transformer";
import { validate, getMetadataStorage } from "class-validator";
import { Request, Response, NextFunction } from "express";

/**
 * Two recurring shape mismatches between the frontend and every DTO here,
 * both fixed the same way: read which fields a DTO declares a given
 * validator on (once, from class-validator's own metadata — never hand-listed
 * per DTO, so new fields are covered automatically), then repair the raw
 * value before validation ever sees it.
 *
 *  - @IsUUID() fields: AsyncSelect pickers need a defined value for a
 *    controlled input, so "nothing chosen" arrives as `""`, not `undefined`.
 *    @IsOptional() only skips null/undefined, so `""` still fails @IsUUID().
 *  - @IsNumber() fields: native `<input type="number">` via plain
 *    react-hook-form `register()` always yields a string, so "100" arrives
 *    instead of 100 and fails @IsNumber() (which checks typeof, not content).
 *
 * Blanket-stripping every empty string, or blanket-casting every string to a
 * number, would be unsafe (a PATCH clearing a text field to "" would
 * silently no-op; a genuinely non-numeric string would silently become NaN).
 * So both are scoped to exactly the fields the DTO itself declares.
 */
const fieldsByValidator = new WeakMap<object, Map<string, Set<string>>>();

const getFields = (dtoClass: any, validatorName: string): Set<string> => {
  let byValidator = fieldsByValidator.get(dtoClass);
  if (!byValidator) {
    byValidator = new Map();
    fieldsByValidator.set(dtoClass, byValidator);
  }
  let fields = byValidator.get(validatorName);
  if (!fields) {
    fields = new Set(
      getMetadataStorage()
        .getTargetValidationMetadatas(dtoClass, "", true, false)
        .filter((meta) => meta.name === validatorName)
        .map((meta) => meta.propertyName)
    );
    byValidator.set(validatorName, fields);
  }
  return fields;
};

/** Mirrors gxp-service/src/middlewares/validate-dto.middleware.ts (same intent, adapted to its multipart handling). */
export const validateDto = (dtoClass: any, type?: "body" | "query" | "params"): any => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const targetType = type ?? "body";
    const target = req[targetType];

    if (target && typeof target === "object") {
      const obj = target as Record<string, unknown>;
      for (const field of getFields(dtoClass, "isUuid")) {
        if (obj[field] === "") delete obj[field];
      }
      for (const field of getFields(dtoClass, "isNumber")) {
        const value = obj[field];
        if (value === "") {
          delete obj[field];
        } else if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
          obj[field] = Number(value);
        }
      }
    }

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
