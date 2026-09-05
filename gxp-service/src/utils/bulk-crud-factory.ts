import { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Model, ModelStatic } from "sequelize";
import asyncHandler from "../middlewares/error.middleware";
import { resolveUniqueName } from "./bulk-name.util";

export interface BulkCrudConfig {
  /** Omit alongside `nameField` when the entity has no client-facing unique
   * name (e.g. Service Requests, whose id is minted server-side every call) —
   * bulk-copy then skips collision-suffixing entirely. */
  model?: ModelStatic<Model>;
  nameField?: string;
  maxNameLength?: number;
  /** Validated per-record on bulk-copy when provided; the module's existing CreateXDto. */
  createDtoClass?: new () => any;
  createOne: (payload: any, currentUser?: string) => Promise<any>;
  updateOne: (
    id: string,
    payload: any,
    currentUser?: string
  ) => Promise<any | null>;
  /** Omit to leave this module's bulk-restore route unregistered. */
  restore?: (id: string, currentUser?: string) => Promise<any | null>;
  /** Re-links/clones child rows after a copy-created record (e.g. Applications' groups/attachments). */
  afterCopyCreate?: (
    source: any,
    created: any,
    currentUser?: string
  ) => Promise<void>;
}

export const getCurrentUser = (req: Request): string | undefined =>
  (req as any).user?.username ??
  (req as any).user?.id ??
  (req.headers["x-user"] as string | undefined);

const validateRecord = async (
  dtoClass: (new () => any) | undefined,
  payload: any
) => {
  if (!dtoClass) return [];
  const errors = await validate(plainToInstance(dtoClass, payload));
  return errors.map((e) => Object.values(e.constraints || {}).join(", "));
};

/**
 * Bolt-on bulk endpoints (copy-with-review, update, restore) layered on a
 * module's existing single-record service functions — doesn't own the model
 * or touch existing bulkDelete/bulkDuplicate, just adds the 3 missing ops.
 */
export const buildBulkCrudRoutes = (config: BulkCrudConfig) => {
  const bulkCopy = asyncHandler(async (req: Request, res: Response) => {
    const records: any[] = Array.isArray(req.body?.records)
      ? req.body.records
      : [];
    if (records.length === 0) {
      return res
        .status(400)
        .json({ message: "An array of records is required" });
    }

    const currentUser = getCurrentUser(req);
    const created: any[] = [];
    for (const record of records) {
      const errors = await validateRecord(config.createDtoClass, record);
      if (errors.length > 0) {
        return res.status(400).json({ message: "Validation failed", errors });
      }

      const payload = { ...record };
      const rawName = config.nameField ? payload[config.nameField] : undefined;
      if (
        config.model &&
        config.nameField &&
        typeof rawName === "string" &&
        rawName.trim()
      ) {
        payload[config.nameField] = await resolveUniqueName(
          config.model,
          config.nameField,
          rawName,
          config.maxNameLength
        );
      }

      const newRecord = await config.createOne(payload, currentUser);
      if (config.afterCopyCreate)
        await config.afterCopyCreate(record, newRecord, currentUser);
      created.push(newRecord);
    }

    return res.status(201).json(created);
  });

  const bulkUpdate = asyncHandler(async (req: Request, res: Response) => {
    const updates: { id: string; payload: any }[] = Array.isArray(
      req.body?.updates
    )
      ? req.body.updates
      : [];
    if (updates.length === 0) {
      return res
        .status(400)
        .json({ message: "An array of updates is required" });
    }

    const currentUser = getCurrentUser(req);
    const results: { id: string; status: "updated" | "skipped"; data?: any }[] =
      [];
    for (const { id, payload } of updates) {
      const updated = await config.updateOne(id, payload, currentUser);
      results.push(
        updated
          ? { id, status: "updated", data: updated }
          : { id, status: "skipped" }
      );
    }
    return res.status(200).json({ results });
  });

  const bulkRestore = config.restore
    ? asyncHandler(async (req: Request, res: Response) => {
        const ids: string[] = Array.isArray(req.body?.ids) ? req.body.ids : [];
        if (ids.length === 0) {
          return res
            .status(400)
            .json({ message: "An array of ids is required" });
        }
        const currentUser = getCurrentUser(req);
        const restored: any[] = [];
        for (const id of ids) {
          const result = await config.restore!(id, currentUser);
          if (result) restored.push(result);
        }
        return res.status(200).json({
          message: `${restored.length} record(s) restored`,
          count: restored.length,
          data: restored
        });
      })
    : undefined;

  return { bulkCopy, bulkUpdate, bulkRestore };
};
