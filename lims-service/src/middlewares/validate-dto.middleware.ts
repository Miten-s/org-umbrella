import { plainToInstance } from "class-transformer";
import { validate, getMetadataStorage } from "class-validator";
import { Request, Response, NextFunction } from "express";

/** Repairs two recurring frontend/DTO shape mismatches before validation, scoped to exactly
 * the fields each DTO declares (from class-validator's own metadata, never hand-listed):
 * @IsUUID() fields arrive as `""` from an unchosen picker; @IsNumber() fields arrive as strings
 * from `<input type="number">`. Blanket-stripping/casting would be unsafe (silent no-ops/NaN). */
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

/** Repair one DTO instance in place, then recurse into nested rows — keyed off the instance's
 * own constructor, so a nested `AliquotRowDto` uses its own metadata, not the parent's. */
const repair = (instance: unknown, seen = new Set<unknown>()): void => {
  if (!instance || typeof instance !== "object") return;
  if (seen.has(instance)) return;
  seen.add(instance);

  if (Array.isArray(instance)) {
    for (const item of instance) repair(item, seen);
    return;
  }

  const obj = instance as Record<string, unknown>;
  const cls = (instance as { constructor?: unknown }).constructor;

  // Plain objects (no DTO class) have no metadata to drive a repair.
  if (cls && cls !== Object) {
    // Mapped to null, not deleted — absent means "leave alone" on a PATCH, null means "clear it".
    for (const validator of ["isUuid", "isDateString"]) {
      for (const field of getFields(cls, validator)) {
        if (obj[field] === "") obj[field] = null;
      }
    }

    // Numeric inputs always yield strings — `isInt` too, counts fail the same way amounts do.
    for (const validator of ["isNumber", "isInt"]) {
      for (const field of getFields(cls, validator)) {
        const value = obj[field];
        if (value === "") {
          obj[field] = null;
        } else if (
          typeof value === "string" &&
          value.trim() !== "" &&
          !Number.isNaN(Number(value))
        ) {
          obj[field] = Number(value);
        }
      }
    }

    // Checkboxes may arrive as "true"/"false".
    for (const field of getFields(cls, "isBoolean")) {
      const value = obj[field];
      if (value === "") obj[field] = null;
      else if (value === "true") obj[field] = true;
      else if (value === "false") obj[field] = false;
    }
  }

  for (const value of Object.values(obj)) {
    if (value && typeof value === "object") repair(value, seen);
  }
};

/** Flattens nested validation errors — a sub-form row failure reports on the parent property
 * with empty `constraints` and the real message under `children`. */
const collectMessages = (errors: any[], path = ""): string[] =>
  errors.flatMap((err) => {
    const where = path ? `${path}.${err.property}` : err.property;
    const own = Object.values(err.constraints ?? {}) as string[];
    const nested = err.children?.length
      ? collectMessages(err.children, where)
      : [];
    return [...own, ...nested];
  });

/** Shared by `validateDto` and `validateDtoArray` — repair, transform, validate one payload. */
const validateOne = async (
  dtoClass: any,
  rawPayload: unknown
): Promise<{ errors: string[]; value: any }> => {
  const dtoObject: any = plainToInstance(dtoClass, rawPayload as object);
  repair(dtoObject);
  const errors = await validate(dtoObject, {
    whitelist: true,
    forbidNonWhitelisted: false
  });
  return { errors: collectMessages(errors), value: dtoObject };
};

/** Same field-level validation as `validateDto`, applied to EVERY item of an array field
 * (`bulk-copy`'s `records[]`). Errors are collected and numbered. `nestedField` validates
 * `items[i][nestedField]` instead of `items[i]` (Bulk Edit's `payload`). */
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
      const target = nestedField ? item?.[nestedField] : item;
      const { errors, value } = await validateOne(dtoClass, target);
      if (errors.length) {
        // Suffixed, not prefixed: the frontend's formatter title-cases the FIRST word of
        // each message, so a leading "Record N" would shadow the actual field name.
        const suffix =
          items.length > 1 ? ` (record ${i + 1} of ${items.length})` : "";
        allErrors.push(...errors.map((msg) => `${msg}${suffix}`));
      }
      if (nestedField) item[nestedField] = value;
      else items[i] = value;
    }

    if (allErrors.length > 0) {
      return res
        .status(400)
        .json({ error: "Validation failed", errors: allErrors });
    }
    next();
  };
};

/** A save with new attachments arrives as `multipart/form-data` (multer.middleware.ts parses
 * it first), with the real payload JSON-stringified under `data` — unwrapped here or `target` is `undefined`. */
export const validateDto = (
  dtoClass: any,
  type?: "body" | "query" | "params"
): any => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const targetType = type ?? "body";
    const target = req[targetType];

    let payloadForValidation: any = target;
    const isMultipartWrapped =
      targetType === "body" &&
      target &&
      typeof target === "object" &&
      "data" in target;

    if (isMultipartWrapped) {
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

    // Repair happens AFTER `plainToInstance` (inside `validateOne`), so each nested row is
    // already its own DTO class instance and the same metadata lookup works at every depth.
    const { errors: errorMessages, value: dtoObject } = await validateOne(
      dtoClass,
      payloadForValidation
    );

    if (errorMessages.length > 0) {
      return res
        .status(400)
        .json({ error: "Validation failed", errors: errorMessages });
    }

    // Preserve other multipart fields rather than clobbering `req.body` outright.
    req[targetType] = isMultipartWrapped
      ? { ...(target as Record<string, unknown>), data: dtoObject }
      : dtoObject;
    next();
  };
};
