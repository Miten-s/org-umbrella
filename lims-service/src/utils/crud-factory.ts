import {
  IncludeOptions,
  Model,
  ModelStatic,
  Op,
  Transaction,
  WhereOptions
} from "sequelize";
import { NextFunction, Request, Response, Router } from "express";
import asyncHandler from "../middlewares/error.middleware";
import { getListQuery } from "../utils/pagination.util";
import { getSafeFilters } from "../utils/query.util";
import { formatLimsEntity } from "../utils/format.util";
import { writeAudit, AuditActor } from "../utils/audit.util";
import {
  getMessage,
  CUSTOM_MESSAGES,
  friendlyUniqueConflictMessage
} from "../utils/common.util";
import { sequelize } from "../configs/db.sequelize";
import API_ROUTES from "../utils/routes";
import {
  validateDto,
  validateDtoArray
} from "../middlewares/validate-dto.middleware";
import {
  BulkOperationDto,
  BulkCreateDto,
  BulkUpdateDto,
  RestoreOperationDto
} from "../dtos/common.dto";
import { authorize } from "../middlewares/authorize.middleware";
import { LimsAction } from "./permissions";
import { ChildConfig, readChildren, syncAllChildren } from "./nested-children";
import {
  applyBusinessId,
  BusinessIdConfig,
  peekBusinessId
} from "./business-id";
import { registerEntity } from "./entity-registry";
import Attachment from "../models/attachment.model";
import { uploadAttachments } from "../middlewares/multer.middleware";

/**
 * The generic engine behind every one of the 26 LIMS entities (spec §2's ten-endpoint
 * contract) — endpoint shapes, audit writes, soft-delete, group filtering, bulk ops live here once.
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
  /** Human-readable business ID (`LOC-000001`), server-generated — an overridable suggestion
   * for master data, unconditionally for Sample/Test/Result (`locked: true`). */
  businessId?: BusinessIdConfig;
  /** Columns matched by the free-text `search` query param. */
  searchFields: string[];
  /** Sequelize `include` for nested relations — never return bare UUIDs (spec §3). */
  relations?: IncludeOptions[];
  /** Payload relation key → FK column, e.g. `{ parentGroup: "parentGroupId" }` — the frontend
   * sends a bare id under the relation's natural name; this maps it to the real column. */
  relationFields?: Record<string, string>;
  /** Sub-forms sent nested in the parent payload (spec §6). */
  children?: ChildConfig[];
  /** Relation aliases to leave out of the LIST query only (findById still includes everything) —
   * opt-in per relation, only once confirmed the list's own columns don't read it. */
  listExcludeRelations?: string[];
  /** For a relation kept in the list query but whose full shape only the Edit/View form needs:
   * restricts `findAll` to just these columns and drops any nested include. Size to what the list actually renders. */
  listRelationAttributes?: Record<string, string[]>;
  /** Always-applied WHERE fragment, ANDed into every read — e.g. Result's `isLatest: true`
   * so reads never return superseded history. */
  baseWhere?: WhereOptions;
  /** Global reference data (Pick Lists): visible to every group, never stamped with a home
   * group — the only tables allowed a NULL `group_id`. */
  globalReference?: boolean;
  /** Runs first on every create/update, before relation mapping — for accepting more than one
   * client shape for the same data (Role: grid `entries[]` vs. typed `permissions[]`). */
  normalizePayload?: (payload: Record<string, any>) => Record<string, any>;
  /** Runs after any successful mutation, outside the transaction — access-control entities use
   * it to drop cached permission contexts immediately, not on a TTL. */
  afterWrite?: () => Promise<void> | void;
  defaultSortBy?: string;
  /** Mutate/derive the payload before create. Runs in the same transaction as the rest of
   * the create — pass it through to any atomic read-then-write (e.g. a per-parent counter). */
  beforeCreate?: (
    payload: Record<string, any>,
    transaction?: Transaction
  ) => Promise<Record<string, any>> | Record<string, any>;
  /** Mutate/derive the payload before update. */
  beforeUpdate?: (
    payload: Record<string, any>,
    existing: M
  ) => Promise<Record<string, any>> | Record<string, any>;
  /** Reshapes one formatted row after the generic mapping — e.g. nesting flat
   * `owned_by_id`/`owned_by_name` into `ownedBy: {id, name}` for a cross-database reference. */
  postFormat?: (row: Record<string, any>) => Record<string, any>;
}

const applyPostFormat = (
  formatted: any,
  postFormat?: (row: Record<string, any>) => Record<string, any>
) => {
  if (!postFormat || formatted === null || formatted === undefined)
    return formatted;
  if (Array.isArray(formatted)) return formatted.map((row) => postFormat(row));
  if (formatted.rows)
    return {
      ...formatted,
      rows: formatted.rows.map((row: any) => postFormat(row))
    };
  return postFormat(formatted);
};

/** Fallback scope is CLOSED (no groups, no bypass) so a route accidentally mounted
 * without `authorize` returns nothing rather than everything. */
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

/** A multipart save's real payload is JSON-stringified under `req.body.data` (multer only
 * gives form fields as strings); `req.files` is the reliable signal for which case this is. */
const payloadFromRequest = (req: Request): Record<string, any> => {
  const body = req.body as Record<string, any> | undefined;
  return req.files && body && typeof body === "object" && "data" in body
    ? (body.data as Record<string, any>)
    : (body ?? {});
};

/** Shaped for the frontend's `toExistingAttachments`. Attachment has no real FK to its parent
 * (migration 005) — just this polymorphic `entityName` + `entityId` pair. */
const attachmentsFor = async (
  entityName: string,
  entityId: string,
  transaction?: Transaction
) => {
  const rows = await Attachment.findAll({
    where: { entityName, entityId, isDeleted: false } as any,
    order: [["createdAt", "DESC"]],
    transaction
  });
  return rows.map((row) => ({
    id: row.id,
    attachment: `/${row.storedName}`,
    fileName: row.fileName,
    comment: row.comment,
    uploadedByName: row.uploadedByName
  }));
};

/** Persists new files, soft-deletes existing ones not in the kept list. `keptAttachmentIds`
 * undefined means the client never touched attachments — existing rows are left alone. */
const reconcileAttachments = async (
  entityName: string,
  entityId: string,
  files: Express.Multer.File[] | undefined,
  keptAttachmentIds: string[] | undefined,
  ctx: CrudContext,
  transaction?: Transaction
): Promise<{ added: string[]; removed: string[] }> => {
  const removed: string[] = [];
  if (keptAttachmentIds !== undefined) {
    const existing = await Attachment.findAll({
      where: { entityName, entityId, isDeleted: false } as any,
      transaction
    });
    for (const row of existing) {
      if (keptAttachmentIds.includes(row.id)) continue;
      row.isDeleted = true;
      row.deletedAt = new Date();
      row.deletedBy = ctx.actor.id;
      await row.save({ transaction });
      removed.push(row.fileName);
    }
  }

  const added: string[] = [];
  for (const file of files ?? []) {
    await Attachment.create(
      {
        entityName,
        entityId,
        fileName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedBy: ctx.actor.id,
        uploadedByName: ctx.actor.fullName ?? null,
        // Same rule every other record's own groupId follows.
        groupId: ctx.scope.homeGroupId ?? null
      } as any,
      { transaction }
    );
    added.push(file.originalname);
  }

  return { added, removed };
};

/** Rewrites relation keys to FK columns and strips child collections (persisted separately).
 * `null` clears a relation; `undefined` is left out so a PATCH omitting a field doesn't blank it. */
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

/** The group filter, applied to every read. A NULL `group_id` is global reference data
 * (Phrases), visible to everyone — only reference tables may be NULL. */
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
  if (
    !Object.keys(scoped).length &&
    !Object.getOwnPropertySymbols(scoped).length
  )
    return where;
  return { [Op.and]: [where, scoped] } as WhereOptions;
};

// ---------------------------------------------------------------------------
// Repo layer
// ---------------------------------------------------------------------------

/** Every soft-deletable relation include gets `isDeleted: false` unless already set — otherwise
 * a deleted parent row (Lab Group, Location) kept showing under its old name everywhere included. */
const scopeSoftDeletableIncludes = (
  relations: IncludeOptions[]
): IncludeOptions[] =>
  relations.map((include) => {
    const target = include.model as ModelStatic<any> | undefined;
    const hasIsDeleted = Boolean(
      target?.getAttributes && "isDeleted" in target.getAttributes()
    );
    const nested = include.include
      ? scopeSoftDeletableIncludes(include.include as IncludeOptions[])
      : include.include;
    return {
      ...include,
      ...(hasIsDeleted && !include.where
        ? { where: { isDeleted: false } }
        : {}),
      ...(nested ? { include: nested } : {})
    };
  });

export const buildCrudRepo = <M extends Model>(config: CrudConfig<M>) => {
  const { model, searchFields, defaultSortBy = "createdAt" } = config;
  const relations = scopeSoftDeletableIncludes(config.relations ?? []);

  // A sub-form grid's full child array is normally Edit/View-only, EXCEPT where the list
  // renders something derived from it (Lab Roles' Permissions, Batches' `lots`, ...) — checked per entity.
  const listRelations = relations
    .filter(
      (r) => !(config.listExcludeRelations ?? []).includes(r.as as string)
    )
    .map((r) => {
      const attrs = config.listRelationAttributes?.[r.as as string];
      if (!attrs) return r;
      // Kept for the list at only a fraction of its full shape — drop any nested include too.
      const trimmed = { ...r, attributes: attrs };
      delete trimmed.include;
      return trimmed;
    });

  const create = async (
    data: Record<string, any>,
    transaction?: Transaction
  ) => {
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
    const base: WhereOptions = includeRemoved
      ? { id }
      : { id, isDeleted: false };
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
    const {
      skip,
      limit,
      search,
      includeRemoved,
      sortBy,
      sortDir,
      filters,
      scope
    } = params;
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
      sortBy && Object.keys(model.getAttributes()).includes(sortBy)
        ? sortBy
        : defaultSortBy;

    return model.findAndCountAll({
      where: withGroupScope(model, scope, where),
      include: listRelations,
      offset: skip,
      limit,
      order: [[orderColumn, sortDir]],
      distinct: true
    });
  };

  const update = async (
    id: string,
    data: Record<string, any>,
    transaction?: Transaction
  ) => {
    await model.update(data as any, { where: { id } as any, transaction });
    return findByIdUnscoped(id, transaction, true);
  };

  const softDelete = async (
    ids: string[],
    deletedBy: string,
    transaction?: Transaction
  ) => {
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

  return {
    create,
    findById,
    findByIdUnscoped,
    findAll,
    update,
    softDelete,
    restore
  };
};

export type CrudRepo<M extends Model> = ReturnType<typeof buildCrudRepo<M>>;

/** Whitespace is never meaningful in an identifier — `"spec id "` vs `"spec id"` would
 * otherwise pass the unique index as two indistinguishable rows. Applies to the business ID and `uniqueField` only. */
const trimIdentifiers = <M extends Model>(
  config: CrudConfig<M>,
  data: Record<string, any>
): Record<string, any> => {
  for (const field of [config.uniqueField, config.businessId?.field]) {
    if (field && typeof data[field] === "string")
      data[field] = data[field].trim();
  }
  return data;
};

/** Catches a case-insensitive collision Postgres's UNIQUE constraint wouldn't reject on its own.
 * Attribute-keyed where, not col()/fn() — every model is `underscored: true`. */
const findUniqueCollision = async (
  model: ModelStatic<any>,
  field: string,
  value: unknown,
  transaction: Transaction,
  excludeId?: string
) => {
  if (typeof value !== "string" || !value.trim()) return null;
  return model.findOne({
    where: {
      [field]: { [Op.iLike]: value.replace(/[%_\\]/g, "\\$&") },
      ...(excludeId ? { id: { [Op.ne]: excludeId } } : {})
    },
    transaction
  });
};

const assertUniqueCaseInsensitive = async (
  model: ModelStatic<any>,
  field: string,
  value: unknown,
  transaction: Transaction,
  excludeId?: string
) => {
  const existing = await findUniqueCollision(
    model,
    field,
    value,
    transaction,
    excludeId
  );

  if (existing) {
    // Never a raw UUID/column name in a user-facing toast (e.g. Lab User's `userId` FK).
    throw Object.assign(
      new Error(friendlyUniqueConflictMessage([field], [value])),
      {
        statusCode: 400
      }
    );
  }
};

/** "-(1)", "-(2)" numbering: strip an existing suffix, find the highest N sharing that base,
 * pick the next one — avoids "-COPY-COPY" stacking and eventual collision. */
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

/** The display-name field (e.g. "customerName"), if any — `undefined` for an entity
 * identified purely by its business id (Stock Batch). */
const inferNameField = <M extends Model>(
  config: CrudConfig<M>,
  uniqueField?: string
): string | undefined =>
  config.searchFields.find(
    (field) => field !== uniqueField && /name$/i.test(field)
  );

// ---------------------------------------------------------------------------
// Service layer — owns transactions + audit-log writes.
// ---------------------------------------------------------------------------

export const buildCrudService = <M extends Model>(config: CrudConfig<M>) => {
  // So anything holding only the permission code (attachments) can write audit
  // rows under the same entityName this service uses.
  registerEntity(config.permissionEntity, config.entityName);

  const repo = buildCrudRepo(config);
  const {
    model,
    entityName,
    uniqueField,
    beforeCreate,
    beforeUpdate,
    postFormat
  } = config;
  const shape = (formatted: any) => applyPostFormat(formatted, postFormat);
  const hasGroupColumn = Object.keys(model.getAttributes()).includes("groupId");

  /** Single-create guts minus its own transaction, shared by `create` (reject-on-collision)
   * and `bulkCreate` (warn + auto-suffix, for Copy re-submitting an untouched name). */
  const createOne = async (
    raw: Record<string, any>,
    ctx: CrudContext,
    transaction: Transaction,
    opts?: { collisionMode?: "reject" | "warn" }
  ): Promise<{ result: any; warning?: string }> => {
    const payload = config.normalizePayload
      ? config.normalizePayload(raw)
      : raw;
    const mapped = toColumns(config, payload);

    // Before `beforeCreate`, so anything deriving from it (Stock Batch's `batchNumber`) sees the settled value.
    const withBusinessId = config.businessId
      ? await applyBusinessId(
          model,
          config.permissionEntity,
          config.businessId,
          mapped,
          transaction
        )
      : mapped;

    const data = beforeCreate
      ? await beforeCreate(withBusinessId, transaction)
      : withBusinessId;

    // Stamp the creator's home group when the caller didn't pick one — keeps data
    // partitioned without the user choosing a group by hand every time.
    if (
      hasGroupColumn &&
      !config.globalReference &&
      !data.groupId &&
      ctx.scope.homeGroupId
    ) {
      data.groupId = ctx.scope.homeGroupId;
    }

    trimIdentifiers(config, data);

    let warning: string | undefined;
    if (uniqueField) {
      if (opts?.collisionMode === "warn") {
        const collision = await findUniqueCollision(
          model,
          uniqueField,
          data[uniqueField],
          transaction
        );
        if (collision) {
          const original = String(data[uniqueField]);
          const suffixed = await nextCopyValue(
            model,
            uniqueField,
            original,
            transaction
          );
          const suffix = suffixed.match(/-\(\d+\)$/)?.[0];
          const nameField = inferNameField(config, uniqueField);
          if (
            nameField &&
            suffix &&
            typeof data[nameField] === "string" &&
            data[nameField] &&
            !data[nameField].endsWith(suffix)
          ) {
            data[nameField] = `${data[nameField]}${suffix}`;
          }
          data[uniqueField] = suffixed;
          warning = `"${original}" is already in use — saved as "${suffixed}".`;
        }
      } else {
        await assertUniqueCaseInsensitive(
          model,
          uniqueField,
          data[uniqueField],
          transaction
        );
      }
    }

    const created = await repo.create(data, transaction);
    const parentId = created!.get("id") as string;

    // Same transaction as the parent, so the two are never half-saved.
    const { newChildren, deltas } = await syncAllChildren(
      config.children,
      parentId,
      payload,
      transaction,
      created!.toJSON()
    );

    await writeAudit({
      entityName,
      entityId: parentId,
      action: "CREATE",
      newValue: { ...created!.toJSON(), ...newChildren },
      childChanges: Object.keys(deltas).length ? deltas : null,
      changeReason:
        payload.changeReason ??
        (warning ? "Copied from existing record" : undefined),
      actor: ctx.actor,
      transaction
    });

    const reloaded = await repo.findByIdUnscoped(parentId, transaction);
    return { result: shape(formatLimsEntity(reloaded ?? created)), warning };
  };

  const create = async (raw: Record<string, any>, ctx: CrudContext) => {
    return sequelize
      .transaction((transaction) => createOne(raw, ctx, transaction))
      .then(async ({ result }) => {
        await afterWrite();
        return result;
      });
  };

  /** The Copy flow's save: N reviewed payloads (see CopyStepper) become N real creates in one
   * transaction, same path as a normal create, just warn-and-suffix instead of reject. */
  const bulkCreate = async (
    records: Record<string, any>[],
    ctx: CrudContext
  ) => {
    return sequelize
      .transaction(async (transaction) => {
        const results: { id: string; warning?: string }[] = [];
        for (const raw of records) {
          const { result, warning } = await createOne(raw, ctx, transaction, {
            collisionMode: "warn"
          });
          results.push({ id: result?.id ?? result?._id, warning });
        }
        return results;
      })
      .then(async (results) => {
        await afterWrite();
        return results;
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
  ) =>
    shape(formatLimsEntity(await repo.findAll({ ...query, scope: ctx.scope })));

  /** Single-update guts minus its own transaction, shared by `update` and `bulkUpdate`.
   * Returns `null` when not found/out of scope — `bulkUpdate` marks that entry skipped. */
  const updateOne = async (
    id: string,
    raw: Record<string, any>,
    ctx: CrudContext,
    transaction: Transaction,
    files?: Express.Multer.File[]
  ) => {
    const payload = config.normalizePayload
      ? config.normalizePayload(raw)
      : raw;

    // Scoped lookup: a record outside the caller's groups is not theirs to edit.
    const existing = await repo.findById(id, ctx.scope, transaction, true);
    if (!existing) return null;
    const oldValue = existing.toJSON();
    const mapped = toColumns(config, payload);

    // A locked business ID is the record's identity — silently drop any change attempt
    // rather than 400, so a round-tripping edit (every form does this) still succeeds.
    if (config.businessId?.locked) delete mapped[config.businessId.field];

    const data = beforeUpdate ? await beforeUpdate(mapped, existing) : mapped;

    trimIdentifiers(config, data);

    if (uniqueField && data[uniqueField] !== undefined) {
      await assertUniqueCaseInsensitive(
        model,
        uniqueField,
        data[uniqueField],
        transaction,
        id
      );
    }

    const updated = await repo.update(
      id,
      { ...data, modifiedBy: ctx.actor.id },
      transaction
    );

    const { oldChildren, newChildren, deltas } = await syncAllChildren(
      config.children,
      id,
      payload,
      transaction,
      { ...oldValue, ...updated!.toJSON() }
    );

    // Reconciled here (same transaction, before the audit write) so an add/remove shows up
    // in this same audit row instead of vanishing silently. No-op for entities without attachments.
    const keptAttachmentIds = Array.isArray(payload.keptAttachmentIds)
      ? (payload.keptAttachmentIds as string[])
      : undefined;
    let attachmentsBefore:
      Awaited<ReturnType<typeof attachmentsFor>> | undefined;
    let attachmentsAfter:
      Awaited<ReturnType<typeof attachmentsFor>> | undefined;
    if (files?.length || keptAttachmentIds !== undefined) {
      attachmentsBefore = await attachmentsFor(entityName, id, transaction);
      const attachmentDelta = await reconcileAttachments(
        entityName,
        id,
        files,
        keptAttachmentIds,
        ctx,
        transaction
      );
      attachmentsAfter = await attachmentsFor(entityName, id, transaction);
      if (attachmentDelta.added.length || attachmentDelta.removed.length) {
        deltas.attachments = {
          added: attachmentDelta.added.map((fileName) => ({ fileName })),
          removed: attachmentDelta.removed.map((fileName) => ({ fileName })),
          changed: []
        };
      }
    }

    await writeAudit({
      entityName,
      entityId: id,
      action: "UPDATE",
      oldValue: {
        ...oldValue,
        ...oldChildren,
        ...(attachmentsBefore ? { attachments: attachmentsBefore } : {})
      },
      newValue: {
        ...updated!.toJSON(),
        ...newChildren,
        ...(attachmentsAfter ? { attachments: attachmentsAfter } : {})
      },
      childChanges: Object.keys(deltas).length ? deltas : null,
      changeReason: payload.changeReason,
      actor: ctx.actor,
      transaction
    });

    const reloaded = await repo.findByIdUnscoped(id, transaction, true);
    return shape(formatLimsEntity(reloaded ?? updated));
  };

  const update = async (
    id: string,
    raw: Record<string, any>,
    ctx: CrudContext,
    files?: Express.Multer.File[]
  ) => {
    return sequelize
      .transaction((transaction) => updateOne(id, raw, ctx, transaction, files))
      .then(async (result) => {
        await afterWrite();
        return result;
      });
  };

  /** Bulk Edit's save (see EditStepper): only actually-changed records, one shared transaction,
   * shared `changeReason` folded into each entry. A missing/out-of-scope id is skipped, not fatal. */
  const bulkUpdate = async (
    updates: { id: string; payload: Record<string, any> }[],
    changeReason: string | undefined,
    ctx: CrudContext
  ) => {
    return sequelize
      .transaction(async (transaction) => {
        const results: { id: string; skipped?: boolean }[] = [];
        for (const { id, payload } of updates) {
          const updated = await updateOne(
            id,
            { ...payload, changeReason },
            ctx,
            transaction
          );
          results.push(updated === null ? { id, skipped: true } : { id });
        }
        return results;
      })
      .then(async (results) => {
        await afterWrite();
        return results;
      });
  };

  const remove = async (
    id: string,
    changeReason: string | undefined,
    ctx: CrudContext
  ) => {
    return sequelize
      .transaction(async (transaction) => {
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
      })
      .then(async (result) => {
        await afterWrite();
        return result;
      });
  };

  const bulkDelete = async (
    ids: string[],
    changeReason: string | undefined,
    ctx: CrudContext
  ) => {
    return sequelize
      .transaction(async (transaction) => {
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
      })
      .then(async (result) => {
        await afterWrite();
        return result;
      });
  };

  const bulkDuplicate = async (ids: string[], ctx: CrudContext) => {
    return sequelize
      .transaction(async (transaction) => {
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
          // A copy of a system record (Phrase's `isSystem`) is never itself protected —
          // carrying it over made a clone permanently un-removable/un-renameable.
          delete clone.isSystem;
          if (config.businessId) {
            delete clone[config.businessId.field];
            Object.assign(
              clone,
              await applyBusinessId(
                model,
                config.permissionEntity,
                config.businessId,
                clone,
                transaction
              )
            );
          } else if (uniqueField && clone[uniqueField]) {
            const copiedId = await nextCopyValue(
              model,
              uniqueField,
              String(clone[uniqueField]),
              transaction
            );
            clone[uniqueField] = copiedId;

            // The id gets a "-(N)" suffix above; carry the same suffix onto the name field
            // (if any), or a cloned row is indistinguishable from its source in any picker.
            const nameField = inferNameField(config, uniqueField);
            const suffix = copiedId.match(/-\(\d+\)$/)?.[0];
            if (
              nameField &&
              suffix &&
              typeof clone[nameField] === "string" &&
              clone[nameField]
            ) {
              clone[nameField] = `${clone[nameField]}${suffix}`;
            }
          }
          const prepared = beforeCreate ? await beforeCreate(clone) : clone;

          const row = await repo.create(prepared, transaction);
          const newParentId = row!.get("id") as string;

          // Clone owned child sub-forms too, but not `detachOnly` ones (claimed, not owned,
          // records like Batch's Lots) — cloning those would re-parent someone else's rows.
          for (const child of config.children ?? []) {
            if (child.detachOnly) continue;
            const sourceRows = await readChildren(child, id, transaction);
            for (const childRow of sourceRows) {
              const data: Record<string, any> = { ...childRow };
              delete data.id;
              delete data.createdAt;
              delete data.updatedAt;
              delete data[child.foreignKey];
              const extra = child.extraFields
                ? child.extraFields(row!.toJSON())
                : {};
              await child.model.create(
                { ...data, ...extra, [child.foreignKey]: newParentId } as any,
                { transaction }
              );
            }
          }

          await writeAudit({
            entityName,
            entityId: newParentId,
            action: "CREATE",
            newValue: row!.toJSON(),
            changeReason: "Copied from existing record",
            actor: ctx.actor,
            transaction
          });
          created.push(row);
        }
        return created.length;
      })
      .then(async (result) => {
        await afterWrite();
        return result;
      });
  };

  const restore = async (
    id: string,
    changeReason: string | undefined,
    ctx: CrudContext
  ) => {
    return sequelize
      .transaction(async (transaction) => {
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
      })
      .then(async (result) => {
        await afterWrite();
        return result;
      });
  };

  const getAuditLogs = async (
    entityId: string,
    page: number,
    limit: number,
    ctx: CrudContext
  ) => {
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
    // `who`/`when`/`uniqueId` alias the stored columns for the audit dialog; originals kept for API callers.
    const logs = (formatLimsEntity(rows) as Record<string, any>[]).map(
      (row) => ({
        ...row,
        uniqueId: row.id,
        // Name only, never the raw id — a uuid tells a reader nothing; blank at least reads as "not recorded".
        who: row.performedByName ?? null,
        when: row.performedAt ?? null
      })
    );

    return { logs, total: count };
  };

  return {
    create,
    bulkCreate,
    getById,
    getAll,
    update,
    bulkUpdate,
    remove,
    bulkDelete,
    bulkDuplicate,
    restore,
    getAuditLogs
  };
};

export type CrudService<M extends Model> = ReturnType<
  typeof buildCrudService<M>
>;

// ---------------------------------------------------------------------------
// Controller layer
// ---------------------------------------------------------------------------

export const buildCrudController = <M extends Model>(
  service: CrudService<M>,
  entityName: string,
  /** Gates the extra `attachmentsFor` read and write-side reconcile, so entities without
   * an attachments section (Results/Tests alone are 1M+/100k rows a day) don't pay for it. */
  hasAttachments = false
) => ({
  create: asyncHandler(async (req: Request, res: Response) => {
    const payload = hasAttachments ? payloadFromRequest(req) : req.body;
    const ctx = contextFromRequest(req);
    const created = await service.create(payload, ctx);
    if (hasAttachments) {
      const id = (created as any)?.id as string;
      const files = req.files as Express.Multer.File[] | undefined;
      if (files?.length)
        await reconcileAttachments(entityName, id, files, undefined, ctx);
      (created as any).attachments = await attachmentsFor(entityName, id);
    }
    res.status(201).json({
      message: getMessage(CUSTOM_MESSAGES.ENTITY_CREATED, entityName),
      data: created
    });
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
    const item = await service.getById(
      req.params.id as string,
      contextFromRequest(req)
    );
    if (!item)
      return res
        .status(404)
        .json({ message: getMessage(CUSTOM_MESSAGES.NOT_FOUND, entityName) });
    if (hasAttachments) {
      (item as any).attachments = await attachmentsFor(
        entityName,
        req.params.id as string
      );
    }
    res.status(200).json({ data: item });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const payload = hasAttachments ? payloadFromRequest(req) : req.body;
    const ctx = contextFromRequest(req);
    // `service.update` reconciles attachments itself (same transaction) so the add/remove lands in the same audit row.
    const files = hasAttachments
      ? (req.files as Express.Multer.File[] | undefined)
      : undefined;
    const updated = await service.update(
      req.params.id as string,
      payload,
      ctx,
      files
    );
    if (!updated)
      return res
        .status(404)
        .json({ message: getMessage(CUSTOM_MESSAGES.NOT_FOUND, entityName) });
    if (hasAttachments) {
      (updated as any).attachments = await attachmentsFor(
        entityName,
        req.params.id as string
      );
    }
    res.status(200).json({
      message: getMessage(CUSTOM_MESSAGES.ENTITY_UPDATED, entityName),
      data: updated
    });
  }),

  bulkUpdate: asyncHandler(async (req: Request, res: Response) => {
    const { updates, changeReason } = req.body as BulkUpdateDto;
    const results = await service.bulkUpdate(
      updates,
      changeReason,
      contextFromRequest(req)
    );
    res.status(200).json({
      message: `${results.length} record(s) updated`,
      count: results.length,
      results
    });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const changeReason = (req.body as { changeReason?: string })?.changeReason;
    const removed = await service.remove(
      req.params.id as string,
      changeReason,
      contextFromRequest(req)
    );
    if (!removed)
      return res
        .status(404)
        .json({ message: getMessage(CUSTOM_MESSAGES.NOT_FOUND, entityName) });
    res.status(200).json({
      message: getMessage(CUSTOM_MESSAGES.ENTITY_DELETED, entityName)
    });
  }),

  bulkDelete: asyncHandler(async (req: Request, res: Response) => {
    const { ids, changeReason } = req.body as BulkOperationDto;
    const count = await service.bulkDelete(
      ids,
      changeReason,
      contextFromRequest(req)
    );
    res.status(200).json({ message: `${count} record(s) removed`, count });
  }),

  bulkDuplicate: asyncHandler(async (req: Request, res: Response) => {
    const { ids } = req.body as BulkOperationDto;
    const count = await service.bulkDuplicate(ids, contextFromRequest(req));
    res.status(201).json({ message: `${count} record(s) copied`, count });
  }),

  bulkCreate: asyncHandler(async (req: Request, res: Response) => {
    const { records } = req.body as BulkCreateDto;
    const results = await service.bulkCreate(records, contextFromRequest(req));
    res.status(201).json({
      message: `${results.length} record(s) copied`,
      count: results.length,
      results
    });
  }),

  restore: asyncHandler(async (req: Request, res: Response) => {
    const { changeReason } = req.body as RestoreOperationDto;
    const restored = await service.restore(
      req.params.id as string,
      changeReason,
      contextFromRequest(req)
    );
    if (!restored)
      return res
        .status(404)
        .json({ message: getMessage(CUSTOM_MESSAGES.NOT_FOUND, entityName) });
    res.status(200).json({
      message: getMessage(CUSTOM_MESSAGES.ENTITY_RESTORED, entityName),
      data: restored
    });
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
    if (!result)
      return res
        .status(404)
        .json({ message: getMessage(CUSTOM_MESSAGES.NOT_FOUND, entityName) });
    res.status(200).json({ audit: result.logs, total: result.total });
  })
});

// ---------------------------------------------------------------------------
// Router layer
// ---------------------------------------------------------------------------

/** Every route carries an explicit `authorize(entity, action)` — the HTTP verb lies
 * (`POST /bulk-delete` deletes, `PATCH /restore/:id` isn't an update). */
export const buildCrudRouter = <M extends Model>(params: {
  service: CrudService<M>;
  entityName: string;
  permissionEntity: string;
  createDto?: any;
  updateDto?: any;
  /** Both required to expose `GET /next-id` for the create form's prefill. */
  model?: ModelStatic<M>;
  businessId?: BusinessIdConfig;
  /** This entity's form carries `LimsAttachmentsField` — see buildCrudController. */
  hasAttachments?: boolean;
}): Router => {
  const {
    service,
    entityName,
    permissionEntity,
    createDto,
    updateDto,
    model,
    businessId,
    hasAttachments = false
  } = params;
  const controller = buildCrudController(service, entityName, hasAttachments);
  const router = Router();
  const can = (action: LimsAction) => authorize(permissionEntity, action);
  // No-op for a plain JSON request — multer only engages for an actual multipart body.
  const parseAttachments = hasAttachments
    ? uploadAttachments.array("attachments")
    : (_req: Request, _res: Response, next: () => void) => next();

  // Suggestion for the create form, non-consuming; locked entities don't expose it.
  if (model && businessId && !businessId.locked) {
    router.get(
      API_ROUTES.NEXT_ID,
      can("CREATE"),
      asyncHandler(async (_req: Request, res: Response) => {
        res.status(200).json({
          data: {
            [businessId.field]: await peekBusinessId(
              model,
              permissionEntity,
              businessId
            )
          }
        });
      })
    );
  }

  router.get(
    API_ROUTES.PARAMS + "/audit",
    can("VIEW"),
    controller.getAuditLogs
  );
  router.get(API_ROUTES.ROOT, can("VIEW"), controller.getAll);
  router.get(API_ROUTES.PARAMS, can("VIEW"), controller.getById);

  router.post(
    API_ROUTES.ROOT,
    can("CREATE"),
    parseAttachments,
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
  router.post(
    API_ROUTES.BULK_COPY,
    can("CREATE"),
    validateDto(BulkCreateDto),
    // Same field-level checks a plain create gets, per record in `records[]`.
    createDto
      ? validateDtoArray(createDto, "records")
      : (_req, _res, next) => next(),
    controller.bulkCreate
  );

  // Registered BEFORE the single-record PARAMS patch: both are one-segment PATCH routes,
  // so PARAMS going first would match "/bulk-update" as id="bulk-update".
  router.patch(
    API_ROUTES.BULK_UPDATE,
    can("UPDATE"),
    validateDto(BulkUpdateDto),
    // Fold the shared `changeReason` into each entry's payload before validation — otherwise
    // Result's updateDto (requires `payload.changeReason`) rejected every row of a bulk edit.
    (req: Request, _res: Response, next: NextFunction) => {
      const { updates, changeReason } = req.body as BulkUpdateDto;
      if (changeReason && Array.isArray(updates)) {
        for (const entry of updates) {
          if (entry?.payload && entry.payload.changeReason === undefined) {
            entry.payload.changeReason = changeReason;
          }
        }
      }
      next();
    },
    // Same idea as BULK_COPY's check, against each entry's `payload` instead of the entry itself.
    updateDto
      ? validateDtoArray(updateDto, "updates", "payload")
      : (_req, _res, next) => next(),
    controller.bulkUpdate
  );
  router.patch(
    API_ROUTES.PARAMS,
    can("UPDATE"),
    parseAttachments,
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
