import { plainToInstance } from "class-transformer";
import { validate, getMetadataStorage } from "class-validator";
import { Request, Response, NextFunction } from "express";

/**
 * Optional UUID relation fields arrive as `""`, not `undefined` — pickers
 * need a defined value for a controlled input, so "nothing chosen" defaults
 * to an empty string. @IsOptional() only skips validation for null/undefined,
 * so `""` still hits @IsUUID() and fails. Blanket-stripping every empty
 * string would be unsafe (a PATCH clearing a plain text field back to ""
 * would silently no-op), so this targets exactly the fields a DTO declares
 * @IsUUID() on — read once from class-validator's own metadata rather than
 * hand-listed per DTO. Mirrors lims-service/src/middlewares/validate-dto.middleware.ts.
 */
const uuidFieldsByDto = new WeakMap<object, Set<string>>();

const getUuidFields = (dtoClass: any): Set<string> => {
  let fields = uuidFieldsByDto.get(dtoClass);
  if (!fields) {
    fields = new Set(
      getMetadataStorage()
        .getTargetValidationMetadatas(dtoClass, "", true, false)
        .filter((meta) => meta.name === "isUuid")
        .map((meta) => meta.propertyName)
    );
    uuidFieldsByDto.set(dtoClass, fields);
  }
  return fields;
};

const stripEmptyUuidFields = (dtoClass: any, payload: unknown) => {
  if (!payload || typeof payload !== "object") return;
  for (const field of getUuidFields(dtoClass)) {
    if ((payload as Record<string, unknown>)[field] === "") {
      delete (payload as Record<string, unknown>)[field];
    }
  }
};

/** Same field-level validation as `validateDto`, applied to every item of an array field
 * (bulk-copy's `records[]`). `nestedField` validates `items[i][nestedField]` instead of
 * `items[i]` (bulk-update's `payload`). Mirrors lims-service's validateDtoArray. */
export const validateDtoArray = (
  dtoClass: any,
  arrayField: string,
  nestedField?: string
): any => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const items = (req.body as Record<string, unknown>)?.[arrayField];
    if (!Array.isArray(items)) return next();

    const allErrors: string[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i] as Record<string, unknown>;
      const target: any = nestedField ? item?.[nestedField] : item;
      stripEmptyUuidFields(dtoClass, target);
      const dtoObject = plainToInstance(dtoClass, target);
      const errors = await validate(dtoObject);
      if (errors.length > 0) {
        const suffix =
          items.length > 1 ? ` (record ${i + 1} of ${items.length})` : "";
        allErrors.push(
          ...errors.map(
            (e) => `${Object.values(e.constraints || {}).join(", ")}${suffix}`
          )
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

    stripEmptyUuidFields(dtoClass, payloadForValidation);

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
