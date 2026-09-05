import { Request, Response } from "express";
import { Model, ModelStatic, Transaction } from "sequelize";
import asyncHandler from "../middlewares/error.middleware";
import { sequelize } from "../configs/db.sequelize";
import { resolveUniqueName } from "./bulk-name.util";

export interface BulkCrudConfig {
  /** Omit alongside `nameField` when the entity has no client-facing unique
   * name (e.g. Service Requests, whose id is minted server-side every call) —
   * bulk-copy then skips collision-suffixing entirely. */
  model?: ModelStatic<Model>;
  nameField?: string;
  maxNameLength?: number;
  /** The module's existing CreateXDto — documents the shape the route's own
   * `validateDtoArray(createDtoClass, "records")` enforces before this runs. */
  createDtoClass?: new () => any;
  createOne: (
    payload: any,
    currentUser?: string,
    transaction?: Transaction
  ) => Promise<any>;
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
    currentUser?: string,
    transaction?: Transaction
  ) => Promise<void>;
}

/** The authenticated identity only — never a client-supplied header, which
 * would let a caller forge audit attribution. */
export const getCurrentUser = (req: Request): string | undefined =>
  (req as any).user?.username ?? (req as any).user?.id;

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
    // One transaction for the whole batch — a failure partway through rolls back
    // every record created so far instead of leaving earlier ones committed.
    const created = await sequelize.transaction(async (transaction) => {
      const results: any[] = [];
      for (const record of records) {
        const payload = { ...record };
        const rawName = config.nameField
          ? payload[config.nameField]
          : undefined;
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
            config.maxNameLength,
            transaction
          );
        }

        const newRecord = await config.createOne(
          payload,
          currentUser,
          transaction
        );
        if (config.afterCopyCreate)
          await config.afterCopyCreate(
            record,
            newRecord,
            currentUser,
            transaction
          );
        results.push(newRecord);
      }
      return results;
    });

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
