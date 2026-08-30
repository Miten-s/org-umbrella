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

/**
 * Same field-level validation as `validateDto`, applied to EVERY item of an
 * array field on the body (e.g. the Copy flow's batched save, `POST
 * <route>/bulk-copy { records: [...] }`) instead of to the body itself.
 *
 * Without this, a batched save skipped the entity's own `createDto`
 * entirely — `BulkCreateDto` only knows `records` is an array of objects,
 * not what shape each one should be — so a mistyped field (an empty
 * "Target Amount" on a NUMERIC column, say) sailed straight through to the
 * database and came back as a raw Postgres error ("invalid input syntax
 * for type numeric") instead of the same friendly, field-named message a
 * plain Create would have given ("targetAmount must be a number").
 *
 * Every record's errors are collected (not just the first failing one) and
 * prefixed with its 1-based position, so a batch of 10 with 2 bad rows
 * reports both by number rather than making the user resubmit repeatedly
 * to discover each one.
 *
 * `nestedField`, when given, validates `items[i][nestedField]` instead of
 * `items[i]` itself — Bulk Edit's `PATCH <route>/bulk-update` body is
 * `{ updates: [{ id, payload }] }`, so each entry's own `updateDto` checks
 * belong on its `payload`, not on the `{ id, payload }` wrapper.
 */
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
        // Suffixed, not prefixed: the frontend's error formatter
        // (error.utils.ts's `humanizeOne`) only title-cases/splits the
        // FIRST word of each message — e.g. "targetAmount must be a
        // number" -> "Target amount must be a number". Putting "Record N"
        // first would shadow that and leave the actual field name
        // untouched. One record's own errors never need this suffix.
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

/**
 * Mirrors gxp-service/src/middlewares/validate-dto.middleware.ts, including
 * the multipart handling that comment already claimed but never actually
 * carried over: a save with new file attachments arrives as
 * `multipart/form-data` (multer.middleware.ts parses it ahead of this), with
 * the real payload JSON-stringified under a `data` field rather than as the
 * body directly — busboy/multer only knows how to give you form fields as
 * strings. Without unwrapping it here, `target` was `undefined` (nothing
 * upstream parses multipart into `req.body` otherwise) and every field
 * validation ever crashed with a raw `plainToInstance` TypeError before a
 * single entity ever got as far as its own field-level errors.
 */
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

    // Repair happens AFTER `plainToInstance` inside `validateOne`, not
    // before: transformation has by then turned each nested row into an
    // instance of its own DTO class, so the same metadata lookup works at
    // every depth. Sub-form grids (aliquot rows, consumptions, analysis
    // components) carry exactly the same string-typed numbers as the top
    // level and were failing identically.
    const { errors: errorMessages, value: dtoObject } = await validateOne(
      dtoClass,
      payloadForValidation
    );

    if (errorMessages.length > 0) {
      return res
        .status(400)
        .json({ error: "Validation failed", errors: errorMessages });
    }

    // Keep the other multipart fields (multer put files on `req.files`, not
    // here, so there's nothing else on `target` today besides `data` — but
    // preserving it rather than clobbering `req.body` outright costs nothing
    // and matches gxp-service's own version).
    req[targetType] = isMultipartWrapped
      ? { ...(target as Record<string, unknown>), data: dtoObject }
      : dtoObject;
    next();
  };
};
