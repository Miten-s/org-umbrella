import {
  IncludeOptions,
  Model,
  ModelStatic,
  Op,
  Transaction,
  WhereOptions
} from "sequelize";
import { Request, Response, Router } from "express";
import asyncHandler from "../middlewares/error.middleware";
import { getListQuery } from "../utils/pagination.util";
import { getSafeFilters } from "../utils/query.util";
import { formatLimsEntity } from "../utils/format.util";
import { writeAudit, AuditActor } from "../utils/audit.util";
import { getMessage, CUSTOM_MESSAGES } from "../utils/common.util";
import { sequelize } from "../configs/db.sequelize";
import API_ROUTES from "../utils/routes";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { BulkOperationDto, RestoreOperationDto } from "../dtos/common.dto";
import { authorize } from "../middlewares/authorize.middleware";
import { LimsAction } from "./permissions";
import { ChildConfig, readChildren, syncAllChildren } from "./nested-children";
import { applyBusinessId, BusinessIdConfig, peekBusinessId } from "./business-id";
import { registerEntity } from "./entity-registry";

/**
 * The generic engine behind every one of the 26 LIMS entities (spec §2's
 * ten-endpoint contract). Each entity's `repo.ts`/`service.ts`/`controller.ts`/
 * `routes.ts` is a thin config wrapper around this — the endpoint shapes,
 * audit-log writes, soft-delete, group filtering and bulk operations live here
 * exactly once so 26 entities can't drift from each other the way the punchlist
 * found (e.g. one controller reading `sortBy`/`filter[]` and another not).
 *
 * A generated entity is not prevented from adding its own extra routes/hooks
 * (e.g. Stock Batch's auto-derived batch number) — see each entity's own
 * files for those.
 */

/** The caller's access scope, resolved by `authorize` and carried on the request. */
export interface AccessScope {
  accessGroupIds: string[];
  homeGroupId: string | null;
  operateAll: boolean;
}

/** Everything a mutation needs to know about who is asking. */
export interface CrudContext {
  actor: AuditActor;
  scope: AccessScope;
}

export interface CrudConfig<M extends Model> {
  model: ModelStatic<M>;
  /** Human label for messages/audit `entityName`, e.g. "Supplier". */
  entityName: string;
  /** Catalogue entity code used for permission checks, e.g. "SUPPLIER". */
  permissionEntity: string;
  /** Business-unique field used to suffix bulk-duplicate copies, e.g. "supplierId". */
  uniqueField?: string;
  /**
   * Human-readable business ID (`LOC-000001`). When set, the field is
   * server-generated: as an overridable suggestion for master data, and
   * unconditionally for Sample/Test/Result (`locked: true`).
   */
  businessId?: BusinessIdConfig;
  /** Columns matched by the free-text `search` query param. */
  searchFields: string[];
  /** Sequelize `include` for nested relations — never return bare UUIDs (spec §3). */
  relations?: IncludeOptions[];
  /**
   * Payload relation key → FK column, e.g. `{ parentGroup: "parentGroupId" }`.
   *
   * The frontend names relations after the thing (`parentGroup`, `locationType`)
   * and sends a bare id; the column is `<name>Id`. Declaring the mapping here
   * is what lets both sides keep their natural naming without a translation
   * shim in the client.
   */
  relationFields?: Record<string, string>;
  /** Sub-forms sent nested in the parent payload (spec §6). */
  children?: ChildConfig[];
  /**
   * Always-applied WHERE fragment, ANDed into every read.
   *
   * Results use it for `isLatest: true` so lists and lookups return the
   * current version of each measurement, never the superseded history — which
   * is also the predicate their partial index is built on.
   */
  baseWhere?: WhereOptions;
  /**
   * Global reference data (Pick Lists): rows are visible to every group and
   * are NOT stamped with the creator's home group. Only these tables may carry
   * a NULL `group_id` — everything audited must belong to exactly one group.
   */
  globalReference?: boolean;
  /**
   * Runs first on every create/update, before relation mapping and before
   * child collections are read off the payload. For accepting more than one
   * client shape for the same data — see the Role entity, where the grid sends
   * `entries[]` and the typed client sends a flat `permissions[]`.
   */
  normalizePayload?: (payload: Record<string, any>) => Record<string, any>;
  /**
   * Runs after any successful mutation, outside the transaction. Used by the
   * access-control entities to drop cached permission contexts — a role change
   * has to take effect immediately, so nothing may be left to a TTL.
   */
  afterWrite?: () => Promise<void> | void;
  defaultSortBy?: string;
  /** Mutate/derive the payload before create (e.g. auto-generated IDs). */
  beforeCreate?: (payload: Record<string, any>) => Promise<Record<string, any>> | Record<string, any>;
  /** Mutate/derive the payload before update. */
  beforeUpdate?: (
    payload: Record<string, any>,
    existing: M
  ) => Promise<Record<string, any>> | Record<string, any>;
  /**
   * Reshapes one formatted row after the generic id/isRemoved/modifiedOn
   * mapping — e.g. nesting flat `owned_by_id`/`owned_by_name` columns into
   * `ownedBy: {id, name}` for a person reference that lives in the separate
   * auth database and can't be a real Sequelize association.
   */
  postFormat?: (row: Record<string, any>) => Record<string, any>;
}

const applyPostFormat = (formatted: any, postFormat?: (row: Record<string, any>) => Record<string, any>) => {
  if (!postFormat || formatted === null || formatted === undefined) return formatted;
  if (Array.isArray(formatted)) return formatted.map((row) => postFormat(row));
  if (formatted.rows) return { ...formatted, rows: formatted.rows.map((row: any) => postFormat(row)) };
  return postFormat(formatted);
};

/**
 * Every request that reaches a CRUD handler has been through `authorize`, so
 * `req.access` is set. The fallback here is a CLOSED one — no groups, no
 * bypass — so a route accidentally mounted without `authorize` returns nothing
 * rather than everything.
 */
const contextFromRequest = (req: Request): CrudContext => ({
  actor: { id: req.user?.id ?? "system", fullName: req.user?.fullName },
  scope: req.access
    ? {
        accessGroupIds: req.access.accessGroupIds,
        homeGroupId: req.access.homeGroupId,
        operateAll: req.access.operateAll
      }
    : { accessGroupIds: [], homeGroupId: null, operateAll: false }
});

/**
 * Rewrites `{ parentGroup: "<uuid>" }` into `{ parentGroupId: "<uuid>" }` and
 * strips the child collections, which are persisted separately.
 *
 * `null` is preserved — it means "clear this relation" — while `undefined` is
 * left out so a PATCH that omits a field doesn't blank it.
 */
const toColumns = <M extends Model>(
  config: CrudConfig<M>,
  payload: Record<string, any>
): Record<string, any> => {
  const { relationFields = {}, children = [] } = config;
  const data: Record<string, any> = { ...payload };

  for (const [key, column] of Object.entries(relationFields)) {
    if (!(key in data)) continue;
    const value = data[key];
    delete data[key];
    if (value !== undefined) data[column] = value === "" ? null : value;
  }

  for (const child of children) delete data[child.field];
  delete data.changeReason;

  return data;
};

/**
 * The group filter, applied to every read of every entity.
 *
 * Rows whose `group_id` IS NULL are global reference data (Phrases) and are
 * visible to everyone — per the schema, only reference tables allow NULL, so
 * this cannot leak audited lab data.
 *
 * Returns `{}` for models with no `groupId` column, and for OPERATE:ALL.
 */
const groupWhere = <M extends Model>(
  model: ModelStatic<M>,
  scope: AccessScope
): WhereOptions => {
  if (scope.operateAll) return {};
  if (!Object.keys(model.getAttributes()).includes("groupId")) return {};

  return {
    [Op.or]: [{ groupId: scope.accessGroupIds }, { groupId: null }]
  } as WhereOptions;
};

/** Merges the group filter into a where clause without clobbering an existing Op.or. */
const withGroupScope = <M extends Model>(
  model: ModelStatic<M>,
  scope: AccessScope,
  where: WhereOptions
): WhereOptions => {
  const scoped = groupWhere(model, scope);
  if (!Object.keys(scoped).length && !Object.getOwnPropertySymbols(scoped).length) return where;
  return { [Op.and]: [where, scoped] } as WhereOptions;
};

// ---------------------------------------------------------------------------
// Repo layer
// ---------------------------------------------------------------------------

export const buildCrudRepo = <M extends Model>(config: CrudConfig<M>) => {
  const { model, relations = [], searchFields, defaultSortBy = "createdAt" } = config;

  const create = async (data: Record<string, any>, transaction?: Transaction) => {
    const row = await model.create(data as any, { transaction });
    return findByIdUnscoped(row.get("id") as string, transaction);
  };

  /** Bypasses the group filter — only for reading back a row we just wrote. */
  const findByIdUnscoped = async (
    id: string,
    transaction?: Transaction,
    includeRemoved = false
  ): Promise<M | null> => {
    const where: WhereOptions = {
      ...(config.baseWhere ?? {}),
      ...(includeRemoved ? { id } : { id, isDeleted: false })
    };
    return model.findOne({ where, include: relations, transaction });
  };

  const findById = async (
    id: string,
    scope: AccessScope,
    transaction?: Transaction,
    includeRemoved = false
  ): Promise<M | null> => {
    const base: WhereOptions = includeRemoved ? { id } : { id, isDeleted: false };
    return model.findOne({
      where: withGroupScope(model, scope, base),
      include: relations,
      transaction
    });
  };

  const findAll = async (params: {
    skip: number;
    limit: number;
    search?: string;
    includeRemoved: boolean;
    sortBy?: string;
    sortDir: "ASC" | "DESC";
    filters: Record<string, string>;
    scope: AccessScope;
  }) => {
    const { skip, limit, search, includeRemoved, sortBy, sortDir, filters, scope } = params;
    const where: WhereOptions = {
      ...(config.baseWhere ?? {}),
      ...(includeRemoved ? {} : { isDeleted: false }),
      ...getSafeFilters(model, filters)
    };

    if (search && searchFields.length) {
      (where as any)[Op.or] = searchFields.map((field) => ({
        [field]: { [Op.iLike]: `%${search}%` }
      }));
    }

    const orderColumn =
      sortBy && Object.keys(model.getAttributes()).includes(sortBy) ? sortBy : defaultSortBy;

    return model.findAndCountAll({
      where: withGroupScope(model, scope, where),
      include: relations,
      offset: skip,
      limit,
      order: [[orderColumn, sortDir]],
      distinct: true
    });
  };

  const update = async (id: string, data: Record<string, any>, transaction?: Transaction) => {
    await model.update(data as any, { where: { id } as any, transaction });
    return findByIdUnscoped(id, transaction, true);
  };

  const softDelete = async (ids: string[], deletedBy: string, transaction?: Transaction) => {
    return model.update(
      { isDeleted: true, deletedAt: new Date(), deletedBy } as any,
      { where: { id: ids } as any, transaction }
    );
  };

  const restore = async (id: string, transaction?: Transaction) => {
    await model.update(
      { isDeleted: false, deletedAt: null, deletedBy: null } as any,
      { where: { id } as any, transaction }
    );
    return findByIdUnscoped(id, transaction, true);
  };

  return { create, findById, findByIdUnscoped, findAll, update, softDelete, restore };
};

export type CrudRepo<M extends Model> = ReturnType<typeof buildCrudRepo<M>>;

/**
 * Postgres's UNIQUE constraint on a business id is case-sensitive by default,
 * so "GOOGLE-COPY" and "google-copy" sail through as if they were different
 * records. A business id is a human-typed label, not a case-sensitive key —
 * every entity's `uniqueField` goes through this before the DB gets a chance
 * to let the collision through. Same message shape as the raw constraint
 * violation (error.middleware.ts), so callers can't tell which one fired.
 */
const assertUniqueCaseInsensitive = async (
  model: ModelStatic<any>,
  field: string,
  value: unknown,
  transaction: Transaction,
  excludeId?: string
) => {
  if (typeof value !== "string" || !value.trim()) return;

  // Plain attribute-keyed where, not col()/fn() — every model here is
  // `underscored: true` (JS `supplierId` -> DB `supplier_id`), and col()
  // takes a raw SQL identifier, so col("supplierId") looks for a column
  // that was never created and 500s. Object-key where clauses map correctly.
  const existing = await model.findOne({
    where: {
      [field]: { [Op.iLike]: value.replace(/[%_\\]/g, "\\$&") },
      ...(excludeId ? { id: { [Op.ne]: excludeId } } : {})
    },
    transaction
  });

  if (existing) {
    throw Object.assign(
      new Error(`A record with this value already exists: "${value}" (${field}).`),
      { statusCode: 400 }
    );
  }
};

/**
 * Same "-(1)", "-(2)" numbering as gxp-service's bulkDuplicate — detect an
 * existing "-(N)" suffix, strip it back to the true base, find the highest N
 * already in use among records sharing that base, and pick the next one.
 * Replaces blindly appending "-COPY" every time, which stacked into
 * "-COPY-COPY" on a second copy and then collided outright.
 */
const nextCopyValue = async (
  model: ModelStatic<any>,
  field: string,
  sourceValue: string,
  transaction: Transaction
): Promise<string> => {
  const match = sourceValue.match(/^(.*)-\((\d+)\)$/);
  const baseName = match ? match[1] : sourceValue;

  const escaped = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = `^${escaped}(?:-\\((\\d+)\\))?$`;

  const rows = await model.findAll({
    attributes: [field],
    where: { [field]: { [Op.iRegexp]: pattern } },
    transaction
  });

  const re = new RegExp(pattern, "i");
  let maxIndex = 0;
  for (const row of rows) {
    const value = String((row as any).get(field) ?? "");
    const found = value.match(re)?.[1];
    if (found) maxIndex = Math.max(maxIndex, parseInt(found, 10));
  }

  return `${baseName}-(${maxIndex + 1})`;
};

// ---------------------------------------------------------------------------
// Service layer — owns transactions + audit-log writes.
// ---------------------------------------------------------------------------

export const buildCrudService = <M extends Model>(config: CrudConfig<M>) => {
  // So anything holding only the permission code (attachments) can write audit
  // rows under the same entityName this service uses.
  registerEntity(config.permissionEntity, config.entityName);

  const repo = buildCrudRepo(config);
  const { model, entityName, uniqueField, beforeCreate, beforeUpdate, postFormat } = config;
  const shape = (formatted: any) => applyPostFormat(formatted, postFormat);
  const hasGroupColumn = Object.keys(model.getAttributes()).includes("groupId");

  const create = async (raw: Record<string, any>, ctx: CrudContext) => {
    const payload = config.normalizePayload ? config.normalizePayload(raw) : raw;
    return sequelize.transaction(async (transaction) => {
      const mapped = toColumns(config, payload);

      // Business ID before `beforeCreate`, so an entity that derives something
      // from it (Stock Batch's `stockId/batchNumber`) sees the settled value.
      const withBusinessId = config.businessId
        ? await applyBusinessId(model, config.permissionEntity, config.businessId, mapped, transaction)
        : mapped;

      const data = beforeCreate ? await beforeCreate(withBusinessId) : withBusinessId;

      // Stamp the creator's home group when the caller didn't pick one. This is
      // what keeps data partitioned without the user choosing a group by hand
      // on every single record.
      if (hasGroupColumn && !config.globalReference && !data.groupId && ctx.scope.homeGroupId) {
        data.groupId = ctx.scope.homeGroupId;
      }

      if (uniqueField) {
        await assertUniqueCaseInsensitive(model, uniqueField, data[uniqueField], transaction);
      }

      const created = await repo.create(data, transaction);
      const parentId = created!.get("id") as string;

      // Sub-forms go in the same transaction, so the parent and its rows are
      // never half-saved.
      const { newChildren, deltas } = await syncAllChildren(
        config.children,
        parentId,
        payload,
        transaction
      );

      await writeAudit({
        entityName,
        entityId: parentId,
        action: "CREATE",
        newValue: { ...created!.toJSON(), ...newChildren },
        childChanges: Object.keys(deltas).length ? deltas : null,
        changeReason: payload.changeReason,
        actor: ctx.actor,
        transaction
      });

      const reloaded = await repo.findByIdUnscoped(parentId, transaction);
      return shape(formatLimsEntity(reloaded ?? created));
    }).then(async (result) => {
      await afterWrite();
      return result;
    });
  };

  const afterWrite = async () => {
    if (config.afterWrite) await config.afterWrite();
  };

  const getById = async (id: string, ctx: CrudContext) =>
    shape(formatLimsEntity(await repo.findById(id, ctx.scope)));

  const getAll = async (
    query: {
      skip: number;
      limit: number;
      search?: string;
      includeRemoved: boolean;
      sortBy?: string;
      sortDir: "ASC" | "DESC";
      filters: Record<string, string>;
    },
    ctx: CrudContext
  ) => shape(formatLimsEntity(await repo.findAll({ ...query, scope: ctx.scope })));

  const update = async (id: string, raw: Record<string, any>, ctx: CrudContext) => {
    const payload = config.normalizePayload ? config.normalizePayload(raw) : raw;
    return sequelize.transaction(async (transaction) => {
      // Scoped lookup: a record outside the caller's groups is not theirs to edit.
      const existing = await repo.findById(id, ctx.scope, transaction, true);
      if (!existing) return null;
      const oldValue = existing.toJSON();
      const mapped = toColumns(config, payload);

      // A locked business ID is the record's identity in the lab's paperwork —
      // Sample SMP-000042 must still be SMP-000042 tomorrow. Silently drop any
      // attempt to change it rather than 400, so an edit that round-trips the
      // whole record (which every form does) still succeeds.
      if (config.businessId?.locked) delete mapped[config.businessId.field];

      const data = beforeUpdate ? await beforeUpdate(mapped, existing) : mapped;

      if (uniqueField && data[uniqueField] !== undefined) {
        await assertUniqueCaseInsensitive(model, uniqueField, data[uniqueField], transaction, id);
      }

      const updated = await repo.update(id, { ...data, modifiedBy: ctx.actor.id }, transaction);

      const { oldChildren, newChildren, deltas } = await syncAllChildren(
        config.children,
        id,
        payload,
        transaction
      );

      await writeAudit({
        entityName,
        entityId: id,
        action: "UPDATE",
        oldValue: { ...oldValue, ...oldChildren },
        newValue: { ...updated!.toJSON(), ...newChildren },
        childChanges: Object.keys(deltas).length ? deltas : null,
        changeReason: payload.changeReason,
        actor: ctx.actor,
        transaction
      });

      const reloaded = await repo.findByIdUnscoped(id, transaction, true);
      return shape(formatLimsEntity(reloaded ?? updated));
    }).then(async (result) => {
      await afterWrite();
      return result;
    });
  };

  const remove = async (id: string, changeReason: string | undefined, ctx: CrudContext) => {
    return sequelize.transaction(async (transaction) => {
      const existing = await repo.findById(id, ctx.scope, transaction);
      if (!existing) return null;
      await repo.softDelete([id], ctx.actor.id, transaction);
      await writeAudit({
        entityName,
        entityId: id,
        action: "DELETE",
        oldValue: existing.toJSON(),
        changeReason,
        actor: ctx.actor,
        transaction
      });
      return formatLimsEntity(existing);
    }).then(async (result) => {
      await afterWrite();
      return result;
    });
  };

  const bulkDelete = async (ids: string[], changeReason: string | undefined, ctx: CrudContext) => {
    return sequelize.transaction(async (transaction) => {
      // Filter to the ids actually in scope, so a bulk call can't be used to
      // delete records the caller could not have seen one at a time.
      const permitted: string[] = [];
      for (const id of ids) {
        const row = await repo.findById(id, ctx.scope, transaction);
        if (row) permitted.push(id);
      }
      if (!permitted.length) return 0;

      await repo.softDelete(permitted, ctx.actor.id, transaction);
      await Promise.all(
        permitted.map((id) =>
          writeAudit({
            entityName,
            entityId: id,
            action: "DELETE",
            changeReason,
            actor: ctx.actor,
            transaction
          })
        )
      );
      return permitted.length;
    }).then(async (result) => {
      await afterWrite();
      return result;
    });
  };

  const bulkDuplicate = async (ids: string[], ctx: CrudContext) => {
    return sequelize.transaction(async (transaction) => {
      const created: any[] = [];
      for (const id of ids) {
        const source = await repo.findById(id, ctx.scope, transaction, true);
        if (!source) continue;
        const clone = source.toJSON() as Record<string, any>;
        delete clone.id;
        delete clone._id;
        delete clone.createdAt;
        delete clone.updatedAt;
        delete clone.isDeleted;
        delete clone.deletedAt;
        delete clone.deletedBy;
        if (uniqueField && clone[uniqueField]) {
          clone[uniqueField] = await nextCopyValue(model, uniqueField, String(clone[uniqueField]), transaction);
        }
        const row = await repo.create(clone, transaction);
        await writeAudit({
          entityName,
          entityId: row!.get("id") as string,
          action: "CREATE",
          newValue: row!.toJSON(),
          changeReason: "Copied from existing record",
          actor: ctx.actor,
          transaction
        });
        created.push(row);
      }
      return created.length;
    }).then(async (result) => {
      await afterWrite();
      return result;
    });
  };

  const restore = async (id: string, changeReason: string | undefined, ctx: CrudContext) => {
    return sequelize.transaction(async (transaction) => {
      const existing = await repo.findById(id, ctx.scope, transaction, true);
      if (!existing) return null;
      const restored = await repo.restore(id, transaction);
      await writeAudit({
        entityName,
        entityId: id,
        action: "RESTORE",
        newValue: restored!.toJSON(),
        changeReason,
        actor: ctx.actor,
        transaction
      });
      return shape(formatLimsEntity(restored));
    }).then(async (result) => {
      await afterWrite();
      return result;
    });
  };

  const getAuditLogs = async (entityId: string, page: number, limit: number, ctx: CrudContext) => {
    // Audit history is as protected as the record it describes.
    const record = await repo.findById(entityId, ctx.scope, undefined, true);
    if (!record) return null;

    const AuditLog = (await import("../models/audit-log.model")).default;
    const { count, rows } = await AuditLog.findAndCountAll({
      where: { entityName, entityId },
      order: [["performedAt", "DESC"]],
      offset: (page - 1) * limit,
      limit
    });
    return { logs: formatLimsEntity(rows), total: count };
  };

  return { create, getById, getAll, update, remove, bulkDelete, bulkDuplicate, restore, getAuditLogs };
};

export type CrudService<M extends Model> = ReturnType<typeof buildCrudService<M>>;

// ---------------------------------------------------------------------------
// Controller layer
// ---------------------------------------------------------------------------

export const buildCrudController = <M extends Model>(
  service: CrudService<M>,
  entityName: string
) => ({
  create: asyncHandler(async (req: Request, res: Response) => {
    const created = await service.create(req.body, contextFromRequest(req));
    res.status(201).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, entityName), data: created });
  }),

  getAll: asyncHandler(async (req: Request, res: Response) => {
    const query = getListQuery(req.query);
    const result = await service.getAll(query, contextFromRequest(req));
    res.status(200).json({
      data: result.rows,
      metadata: {
        totalCount: result.count,
        currentPage: query.page,
        limit: query.limit,
        totalPages: Math.ceil(result.count / query.limit)
      }
    });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const item = await service.getById(req.params.id as string, contextFromRequest(req));
    if (!item) return res.status(404).json({ message: getMessage(CUSTOM_MESSAGES.NOT_FOUND, entityName) });
    res.status(200).json({ data: item });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const updated = await service.update(req.params.id as string, req.body, contextFromRequest(req));
    if (!updated) return res.status(404).json({ message: getMessage(CUSTOM_MESSAGES.NOT_FOUND, entityName) });
    res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, entityName), data: updated });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const changeReason = (req.body as { changeReason?: string })?.changeReason;
    const removed = await service.remove(req.params.id as string, changeReason, contextFromRequest(req));
    if (!removed) return res.status(404).json({ message: getMessage(CUSTOM_MESSAGES.NOT_FOUND, entityName) });
    res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, entityName) });
  }),

  bulkDelete: asyncHandler(async (req: Request, res: Response) => {
    const { ids, changeReason } = req.body as BulkOperationDto;
    const count = await service.bulkDelete(ids, changeReason, contextFromRequest(req));
    res.status(200).json({ message: `${count} record(s) removed`, count });
  }),

  bulkDuplicate: asyncHandler(async (req: Request, res: Response) => {
    const { ids } = req.body as BulkOperationDto;
    const count = await service.bulkDuplicate(ids, contextFromRequest(req));
    res.status(201).json({ message: `${count} record(s) copied`, count });
  }),

  restore: asyncHandler(async (req: Request, res: Response) => {
    const { changeReason } = req.body as RestoreOperationDto;
    const restored = await service.restore(req.params.id as string, changeReason, contextFromRequest(req));
    if (!restored) return res.status(404).json({ message: getMessage(CUSTOM_MESSAGES.NOT_FOUND, entityName) });
    res.status(200).json({ message: getMessage(CUSTOM_MESSAGES.ENTITY_RESTORED, entityName), data: restored });
  }),

  getAuditLogs: asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const result = await service.getAuditLogs(
      req.params.id as string,
      page,
      limit,
      contextFromRequest(req)
    );
    if (!result) return res.status(404).json({ message: getMessage(CUSTOM_MESSAGES.NOT_FOUND, entityName) });
    res.status(200).json({ audit: result.logs, total: result.total });
  })
});

// ---------------------------------------------------------------------------
// Router layer
// ---------------------------------------------------------------------------

/**
 * Every route carries an explicit `authorize(entity, action)`. The action is
 * passed rather than derived from the HTTP verb because the verb lies —
 * `POST /bulk-delete` deletes, and `PATCH /restore/:id` is not an update.
 */
export const buildCrudRouter = <M extends Model>(params: {
  service: CrudService<M>;
  entityName: string;
  permissionEntity: string;
  createDto?: any;
  updateDto?: any;
  /** Both required to expose `GET /next-id` for the create form's prefill. */
  model?: ModelStatic<M>;
  businessId?: BusinessIdConfig;
}): Router => {
  const { service, entityName, permissionEntity, createDto, updateDto, model, businessId } = params;
  const controller = buildCrudController(service, entityName);
  const router = Router();
  const can = (action: LimsAction) => authorize(permissionEntity, action);

  // Suggestion for the create form. Non-consuming, so opening a form and
  // abandoning it doesn't burn a number. Locked entities don't expose it —
  // there is nothing for the user to pre-fill.
  if (model && businessId && !businessId.locked) {
    router.get(
      API_ROUTES.NEXT_ID,
      can("CREATE"),
      asyncHandler(async (_req: Request, res: Response) => {
        res.status(200).json({ data: { [businessId.field]: await peekBusinessId(model, permissionEntity, businessId) } });
      })
    );
  }

  router.get(API_ROUTES.PARAMS + "/audit", can("VIEW"), controller.getAuditLogs);
  router.get(API_ROUTES.ROOT, can("VIEW"), controller.getAll);
  router.get(API_ROUTES.PARAMS, can("VIEW"), controller.getById);

  router.post(
    API_ROUTES.ROOT,
    can("CREATE"),
    createDto ? validateDto(createDto) : (_req, _res, next) => next(),
    controller.create
  );
  router.post(
    API_ROUTES.BULK_DELETE,
    can("DELETE"),
    validateDto(BulkOperationDto),
    controller.bulkDelete
  );
  router.post(
    API_ROUTES.BULK_DUPLICATE,
    can("CREATE"),
    validateDto(BulkOperationDto),
    controller.bulkDuplicate
  );

  router.patch(
    API_ROUTES.PARAMS,
    can("UPDATE"),
    updateDto ? validateDto(updateDto) : (_req, _res, next) => next(),
    controller.update
  );
  router.patch(
    API_ROUTES.RESTORE,
    can("UPDATE"),
    validateDto(RestoreOperationDto),
    controller.restore
  );

  router.delete(API_ROUTES.PARAMS, can("DELETE"), controller.remove);

  return router;
};
