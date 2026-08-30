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
   * Relation aliases (matching a `relations` entry's `as`) to leave out of
   * the LIST query specifically — findById still includes everything. Only
   * for a sub-form grid CONFIRMED not read by that entity's list columns
   * (directly, or via `postFormat`); several entities' lists do render
   * something derived from a child grid, so this is opt-in per relation,
   * checked one at a time, not a blanket "children are list-only" rule.
   */
  listExcludeRelations?: string[];
  /**
   * For a relation kept in the list query (not in `listExcludeRelations`)
   * but whose full shape — every column, any nested include — is only
   * needed by the Edit/View form: restricts it to just these columns for
   * `findAll` specifically, and drops any nested `include` on it entirely
   * (the list never needs a relation of a relation). `findById` always uses
   * the relation exactly as declared in `relations`, unchanged.
   *
   * Standing rule for anyone adding a relation here later: size it to what
   * the list actually renders. A `.length` count needs only `["id"]`; a tag
   * list of names needs `["id", <the one label column it reads>]`. The full
   * shape belongs in `relations`, for the form — this is the list's diet.
   */
  listRelationAttributes?: Record<string, string[]>;
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
  /**
   * Mutate/derive the payload before create (e.g. auto-generated IDs). The
   * transaction is the same one the rest of the create runs in — pass it
   * through to anything that needs its own atomic read-then-write (e.g. a
   * per-parent counter) instead of reading outside the transaction, which is
   * exactly the race Stock Batch's `batchNumber` used to have.
   */
  beforeCreate?: (
    payload: Record<string, any>,
    transaction?: Transaction
  ) => Promise<Record<string, any>> | Record<string, any>;
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
 * A save with new file attachments arrives as `multipart/form-data`: the real
 * payload is JSON-stringified under a `data` field (multer only gives you
 * form fields as strings) and files land on `req.files` separately.
 * `validateDto` already unwraps `data` into a validated DTO instance and
 * leaves it at `req.body.data`; a plain JSON request is untouched, so
 * `req.body` is still the payload directly there. `req.files` is the
 * reliable signal for which case this is — nothing else sets it.
 */
const payloadFromRequest = (req: Request): Record<string, any> => {
  const body = req.body as Record<string, any> | undefined;
  return req.files && body && typeof body === "object" && "data" in body
    ? (body.data as Record<string, any>)
    : (body ?? {});
};

/**
 * Attachments for one record, shaped for `toExistingAttachments` on the
 * frontend (`attachment` is its first-checked path key). `entityName` here is
 * the same human label `writeAudit` already uses everywhere else in this
 * engine — Attachment has no real foreign key to its parent (see migration
 * 005), just this polymorphic `entityName` + `entityId` pair.
 */
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

/**
 * The write half: persists any newly-uploaded files as Attachment rows, and
 * on an update, soft-deletes whichever existing ones weren't in the kept
 * list — the same replace-set idea every other sub-form in this engine uses,
 * just against a polymorphic table instead of a real child association.
 * `keptAttachmentIds` undefined means "the client didn't touch attachments
 * at all" (a create, or an update that never opened that field) — leave
 * existing rows alone entirely, same convention as `syncChildren`.
 *
 * Returns the file names added/removed so the caller can fold them into the
 * same audit row as the rest of the update — see `childChanges.attachments`
 * in `update` below.
 */
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

/**
 * Every soft-deletable relation include gets `isDeleted: false` unless the
 * config already set its own `where` — the include has no such filter by
 * default, so a still-referenced but removed row (a deleted Lab Group, a
 * deleted parent Location) kept showing up under its old name, everywhere
 * that relation is included, until someone spotted it. One place to fix it
 * for every entity rather than a `where` added by hand to each of the ~90
 * `{ model, as, ... }` includes across the route configs.
 */
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

  // A sub-form grid's full child array (Sample's Test windows, Aliquot's
  // list of aliquots, ...) is only ever needed by the Edit/View form — EXCEPT
  // where the list table renders something derived from it too (Lab Roles'
  // Permissions column reads `entries` via postFormat, Batches' list column
  // reads `lots` directly, and several others — verified per entity, not
  // assumed, since it's wrong more often than not). `relations` stays the
  // shared source both findAll and findById read from; this only opts
  // specific, checked relations out of the LIST query specifically.
  const listRelations = relations
    .filter(
      (r) => !(config.listExcludeRelations ?? []).includes(r.as as string)
    )
    .map((r) => {
      const attrs = config.listRelationAttributes?.[r.as as string];
      if (!attrs) return r;
      // A relation kept for the list but only needed at a fraction of its
      // full shape (e.g. a `.length` count, or one label column of a tag
      // list) — drop any nested include with it, since the list never needs
      // a relation of a relation either.
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

/**
 * Postgres's UNIQUE constraint on a business id is case-sensitive by default,
 * so "GOOGLE-COPY" and "google-copy" sail through as if they were different
 * records. A business id is a human-typed label, not a case-sensitive key —
 * every entity's `uniqueField` goes through this before the DB gets a chance
 * to let the collision through. Same message shape as the raw constraint
 * violation (error.middleware.ts), so callers can't tell which one fired.
 */
/**
 * Trim the fields that identify a record.
 *
 * `"spec id "` and `"spec id"` are different strings, so the unique index
 * accepts both and the list then shows two rows that look identical — the user
 * has no way to tell them apart, and no way to see why the duplicate was
 * allowed. Whitespace is never meaningful in an identifier, so it is removed
 * before both the uniqueness check and the write.
 *
 * Applies to the business ID and to `uniqueField`; other strings (names,
 * descriptions) are left exactly as typed.
 */
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

/**
 * Plain attribute-keyed where, not col()/fn() — every model here is
 * `underscored: true` (JS `supplierId` -> DB `supplier_id`), and col()
 * takes a raw SQL identifier, so col("supplierId") looks for a column that
 * was never created and 500s. Object-key where clauses map correctly.
 * Returns the colliding row, or null — callers decide reject vs. warn.
 */
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
    // Never a raw UUID or column name in a user-facing toast — e.g. Lab
    // User's `userId` is a foreign key to the platform user, not something
    // a lab analyst typed, so it must not be echoed back verbatim.
    throw Object.assign(
      new Error(friendlyUniqueConflictMessage([field], [value])),
      {
        statusCode: 400
      }
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

/**
 * The human-readable label field, e.g. "name"/"customerName" — whichever
 * `searchFields` entry looks like a display name and isn't the id field
 * already being suffixed. `undefined` when the entity has none (e.g. Stock
 * Batch, which is identified purely by its business id).
 */
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

  /**
   * The guts of a single create, minus its own transaction — shared by
   * `create` (one record, one transaction, reject-on-collision) and
   * `bulkCreate` (N records, one shared transaction, warn-on-collision) so
   * business-ID minting, `beforeCreate`, group stamping, identifier trimming
   * and child sub-form sync can't drift between the two callers. Collision
   * handling is the only thing that varies:
   *  - "reject" (default): today's behavior, 400s on a case-insensitive hit.
   *  - "warn": auto-suffixes with the same "-(N)" scheme `bulkDuplicate`
   *    already uses (`nextCopyValue`), and reports it back instead of
   *    failing the save — for the Copy flow, where re-submitting an
   *    untouched name is expected, not an error.
   */
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

    // Business ID before `beforeCreate`, so an entity that derives something
    // from it (Stock Batch's `stockId/batchNumber`) sees the settled value.
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

    // Stamp the creator's home group when the caller didn't pick one. This is
    // what keeps data partitioned without the user choosing a group by hand
    // on every single record.
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

    // Sub-forms go in the same transaction, so the parent and its rows are
    // never half-saved.
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

  /**
   * The Copy flow's save: the frontend already reviewed/edited N full
   * record payloads client-side (see CopyStepper) and sends them together
   * once — this is what turns that batch into N real creates in one
   * transaction, each going through the exact same business-ID/child-sync
   * path as a normal single create, just with collisions warned-and-suffixed
   * instead of rejected.
   */
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

  /**
   * The guts of a single update, minus its own transaction — shared by
   * `update` (one record, one transaction) and `bulkUpdate` (N records, one
   * shared transaction) the same way `createOne` is shared by `create` and
   * `bulkCreate`. Returns `null` when the record isn't found or out of the
   * caller's scope — `bulkUpdate` uses that to mark the entry skipped
   * instead of failing the whole batch.
   */
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

    // A locked business ID is the record's identity in the lab's paperwork —
    // Sample SMP-000042 must still be SMP-000042 tomorrow. Silently drop any
    // attempt to change it rather than 400, so an edit that round-trips the
    // whole record (which every form does) still succeeds.
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

    // Attachments are a polymorphic side table, not a real child
    // association — `keptAttachmentIds` only ever appears on a DTO whose
    // entity actually carries `LimsAttachmentsField`, so this is a no-op
    // for every other entity. Reconciled here (inside the same
    // transaction, before the audit write) rather than in the
    // controller, so an add/remove shows up in this same audit row
    // instead of vanishing silently.
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

  /**
   * Bulk Edit's save: the frontend already reviewed N real records
   * client-side (see EditStepper) — only the ones actually changed, unlike
   * Copy where every record needs a payload — and sends them together once.
   * One shared transaction, one `updateOne` per entry, the same shared
   * `changeReason` stamped on every entry's own audit row (folded into each
   * entry's payload before calling `updateOne`, so its existing
   * `payload.changeReason` → `writeAudit` path needs no changes). An id
   * that's missing or out of scope by the time the batch runs is skipped,
   * not fatal to the rest of the batch — mirrors `bulkDelete`'s permitted-ids
   * filtering.
   */
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
          // A copy of a system record (Phrase's `isSystem`, currently the
          // only entity with a flag like this) is never itself protected —
          // it's a user-made row that happens to start identical to one.
          // Carrying `isSystem: true` over made a clone permanently stuck:
          // un-removable (blockSystemDelete) AND un-renameable (the code-
          // frozen check) even though its own "-(N)" suffixed code already
          // fails the very same code format the system list was seeded
          // with. Harmless no-op delete on any entity without this field.
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

            // The id gets a "-(N)" suffix above; the display Name did not, so a
            // cloned row was indistinguishable from its source in any list or
            // picker showing only the (often-truncated) Name column. Carry the
            // same suffix onto the name field, when this entity has one.
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

          // Clone owned child sub-forms too. Not `detachOnly` ones — those are
          // claimed, not owned, records (Batch's Lots, Lot's Samples); blindly
          // "cloning" them would re-parent someone else's rows onto the copy
          // rather than actually duplicate anything. Without this, "Copy"
          // silently dropped every nested grid on the cloned record (Pick
          // List Values, Aliquot rows, Role permission entries, ...) — this
          // engine never touched `config.children` here at all.
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
    /*
     * `who` / `when` / `uniqueId` alias the stored columns, because that is
     * what the audit dialog reads. The originals are kept for API callers.
     * Without them the trail rendered with empty Who and When columns.
     */
    const logs = (formatLimsEntity(rows) as Record<string, any>[]).map(
      (row) => ({
        ...row,
        uniqueId: row.id,
        // Name only — never the raw id. A uuid in a "Who" column tells a reader
        // nothing; blank at least reads as "not recorded". `performedBy` stays on
        // the row for anyone who needs to resolve it.
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
  /**
   * Whether this entity's form actually carries `LimsAttachmentsField` —
   * gates both the extra `attachmentsFor` read on every getById/create/update
   * and the write-side reconcile, so the ~13 entities that never had an
   * attachments section don't pay for a query that will always come back
   * empty (Results/Tests alone are 1M+/100k rows a day).
   */
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
    // `service.update` reconciles attachments itself now (inside the same
    // transaction as the rest of the save) so the add/remove lands in the
    // same audit row — see `childChanges.attachments` there.
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
  // No-op for a plain JSON request — multer only engages for an actual
  // multipart body, so this is safe on every route regardless of whether
  // this particular save happens to include new files.
  const parseAttachments = hasAttachments
    ? uploadAttachments.array("attachments")
    : (_req: Request, _res: Response, next: () => void) => next();

  // Suggestion for the create form. Non-consuming, so opening a form and
  // abandoning it doesn't burn a number. Locked entities don't expose it —
  // there is nothing for the user to pre-fill.
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
    // Validates each record in `records[]` against this entity's own
    // createDto — same field-level checks (and the same "" -> null/number
    // repair) a plain create already gets, so a batched save can't reach
    // the database with something that would 400 anywhere else. Skipped
    // only for the rare entity that never declared a createDto.
    createDto
      ? validateDtoArray(createDto, "records")
      : (_req, _res, next) => next(),
    controller.bulkCreate
  );

  // Registered BEFORE the single-record PARAMS patch below: both are
  // one-segment PATCH routes ("/bulk-update" vs "/:id"), so if PARAMS went
  // first, "PATCH /bulk-update" would match it with id="bulk-update" and
  // never reach this route at all.
  router.patch(
    API_ROUTES.BULK_UPDATE,
    can("UPDATE"),
    validateDto(BulkUpdateDto),
    // Fold the shared top-level `changeReason` into every entry's own
    // `payload` before per-entry validation runs. `bulkUpdate()` below does
    // this same fold, but only once validation has already passed — so an
    // entity like Result, whose updateDto requires `payload.changeReason`,
    // rejected every row of a bulk edit even though the shared reason was
    // right there on the request body.
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
    // Same idea as BULK_COPY's per-record createDto check, against each
    // entry's `payload` instead of the entry itself (see `validateDtoArray`'s
    // optional nested-field param).
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
