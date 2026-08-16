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

/**
 * Repair one DTO instance in place, then recurse into its nested rows.
 *
 * Keyed off the instance's own constructor, so a nested `AliquotRowDto` is
 * looked up against `AliquotRowDto`'s metadata rather than the parent's.
 */
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
    // An untouched picker or date input submits "", which @IsOptional() does
    // not treat as absent — these types can never legitimately be "".
    //
    // Mapped to null rather than deleted, because the two are not the same on
    // a PATCH: absent means "leave this alone", null means "clear it". Deleting
    // would make a cleared dropdown silently keep its old value. @IsOptional()
    // skips null as well as undefined, so validation is satisfied either way.
    for (const validator of ["isUuid", "isDateString"]) {
      for (const field of getFields(cls, validator)) {
        if (obj[field] === "") obj[field] = null;
      }
    }

    // Numeric inputs always yield strings. `isInt` as well as `isNumber`:
    // counts (aliquotsNumber, replicateCount, leadTimeValue) fail the same way
    // amounts do.
    for (const validator of ["isNumber", "isInt"]) {
      for (const field of getFields(cls, validator)) {
        const value = obj[field];
        if (value === "") {
          obj[field] = null;
        } else if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
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

/**
 * Flattens nested validation errors.
 *
 * A failure inside a sub-form row reports on the parent property with empty
 * `constraints` and the real message under `children` — which surfaced to the
 * user as `errors: [""]`, an error message with no error in it.
 */
const collectMessages = (errors: any[], path = ""): string[] =>
  errors.flatMap((err) => {
    const where = path ? `${path}.${err.property}` : err.property;
    const own = Object.values(err.constraints ?? {}) as string[];
    const nested = err.children?.length ? collectMessages(err.children, where) : [];
    return [...own, ...nested];
  });

/** Mirrors gxp-service/src/middlewares/validate-dto.middleware.ts (same intent, adapted to its multipart handling). */
export const validateDto = (dtoClass: any, type?: "body" | "query" | "params"): any => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const targetType = type ?? "body";
    const target = req[targetType];

    const dtoObject = plainToInstance(dtoClass, target);

    // Repair AFTER transformation, not before: `plainToInstance` has by then
    // turned each nested row into an instance of its own DTO class, so the
    // same metadata lookup works at every depth. Sub-form grids (aliquot rows,
    // consumptions, analysis components) carry exactly the same string-typed
    // numbers as the top level and were failing identically.
    repair(dtoObject);
    const errors = await validate(dtoObject, { whitelist: true, forbidNonWhitelisted: false });

    if (errors.length > 0) {
      const errorMessages = collectMessages(errors);
      return res.status(400).json({ error: "Validation failed", errors: errorMessages });
    }

    req[targetType] = dtoObject;
    next();
  };
};
