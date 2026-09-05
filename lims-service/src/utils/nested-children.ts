import { Model, ModelStatic, Transaction } from "sequelize";

/** Nested sub-forms, persisted in the same transaction as the parent for one audit entry.
 * Replace-set semantics: missing rows deleted, new rows inserted, matching rows updated. */
export interface ChildConfig {
  /** Key in the parent payload, e.g. "entries". Also the relation alias. */
  field: string;
  model: ModelStatic<Model>;
  /** FK attribute on the child pointing back at the parent, e.g. "phraseId". */
  foreignKey: string;
  /** Child attributes the client may set. Anything else is ignored. */
  fields: string[];
  /** Recognises "the same row" across a save, so an edit reports as a change, not a
   * delete+insert. Falls back to `id` when the client echoes it back. */
  matchKey?: string;
  /** The children are independent records this parent merely claims, not rows it owns
   * (Batch↔Lot). A dropped row is re-parented (FK cleared), never deleted. */
  detachOnly?: boolean;
  /** Payload key → child column (e.g. `{ instrument: "instrumentId" }`) — without this the
   * key isn't in `fields`, so `pick()` silently drops it. */
  relationFields?: Record<string, string>;
  /** Extra fixed columns stamped on every newly-created child row, for a NOT NULL column
   * this config's own `foreignKey` doesn't cover (Test's `components` needs `sampleId` too). */
  extraFields?: (parent: Record<string, any>) => Record<string, any>;
  /** Extra fixed WHERE on the replace-set's "before" lookup, for a child table two parents
   * both stamp rows into — without it, one parent's save would delete the other's rows. */
  scopeWhere?: Record<string, any>;
}

/** What changed in one child collection — the shape stored on the audit row. */
export interface ChildDelta {
  added: Record<string, any>[];
  removed: Record<string, any>[];
  changed: {
    key: string;
    from: Record<string, any>;
    to: Record<string, any>;
  }[];
}

const pick = (
  row: Record<string, any>,
  fields: string[],
  relationFields: Record<string, string> = {}
) => {
  const mapped: Record<string, any> = { ...row };

  for (const [key, column] of Object.entries(relationFields)) {
    if (!(key in mapped)) continue;
    const value = mapped[key];
    delete mapped[key];
    // "" means the picker was cleared — store NULL, not an empty string in a UUID column.
    if (value !== undefined) mapped[column] = value === "" ? null : value;
  }

  const out: Record<string, any> = {};
  for (const field of fields)
    if (mapped[field] !== undefined) out[field] = mapped[field];
  return out;
};

/** Stable identity for a child row: the match key, else its id. */
const keyOf = (row: Record<string, any>, config: ChildConfig): string => {
  const value = config.matchKey ? row[config.matchKey] : undefined;
  return String(value ?? row.id ?? "");
};

const differs = (
  a: Record<string, any>,
  b: Record<string, any>,
  fields: string[]
) =>
  fields.some((field) => {
    const left = a[field] ?? null;
    const right = b[field] ?? null;
    return JSON.stringify(left) !== JSON.stringify(right);
  });

/** Current children, as plain objects — the "before" half of the audit diff. */
export const readChildren = async (
  config: ChildConfig,
  parentId: string,
  transaction?: Transaction
): Promise<Record<string, any>[]> => {
  const rows = await config.model.findAll({
    where: { [config.foreignKey]: parentId, ...config.scopeWhere } as any,
    transaction
  });
  return rows.map((row) => row.toJSON() as Record<string, any>);
};

/** The caller's group access, structurally — avoids importing `AccessScope` from
 * crud-factory.ts, which itself imports this module. */
export interface ScopeCheck {
  accessGroupIds: string[];
  operateAll: boolean;
}

/** A `detachOnly` claim must target a row the caller can actually reach — otherwise a
 * plain UPDATE permission on the parent would let a user re-parent (and thereby move
 * out of its group) a child row belonging to a group they have no access to. */
const assertClaimInScope = async (
  config: ChildConfig,
  claimId: string,
  scope: ScopeCheck | undefined,
  transaction?: Transaction
) => {
  if (!scope || scope.operateAll) return;
  const candidate = await config.model.findOne({
    where: { id: claimId } as any,
    transaction
  });
  const candidateGroupId = candidate?.get?.("groupId") as
    | string
    | null
    | undefined;
  if (candidate && candidateGroupId && !scope.accessGroupIds.includes(candidateGroupId)) {
    throw Object.assign(new Error("That record is outside your groups."), {
      statusCode: 403
    });
  }
};

/** Applies the incoming child set and returns what changed. `undefined` means "not
 * mentioned" — left alone. An empty array means "delete them all", a real instruction. */
export const syncChildren = async (
  config: ChildConfig,
  parentId: string,
  incoming: Record<string, any>[] | undefined,
  transaction?: Transaction,
  parent: Record<string, any> = {},
  scope?: ScopeCheck
): Promise<{
  before: Record<string, any>[];
  after: Record<string, any>[];
  delta: ChildDelta;
} | null> => {
  if (incoming === undefined) return null;

  const before = await readChildren(config, parentId, transaction);
  const beforeByKey = new Map(before.map((row) => [keyOf(row, config), row]));
  const seen = new Set<string>();

  const delta: ChildDelta = { added: [], removed: [], changed: [] };

  for (const raw of incoming) {
    const data = pick(raw, config.fields, config.relationFields);
    const key = keyOf(raw, config);
    const existing = key ? beforeByKey.get(key) : undefined;

    if (existing) {
      seen.add(key);
      if (differs(existing, data, config.fields)) {
        await config.model.update(data as any, {
          where: { id: existing.id } as any,
          transaction
        });
        delta.changed.push({
          key,
          from: pick(existing, config.fields, config.relationFields),
          to: data
        });
      }
    } else if (config.detachOnly) {
      // Claim an existing record rather than creating one.
      const claimId = raw.id ?? key;
      if (claimId) {
        await assertClaimInScope(config, claimId, scope, transaction);
        await config.model.update({ [config.foreignKey]: parentId } as any, {
          where: { id: claimId } as any,
          transaction
        });
        delta.added.push({ id: claimId });
      }
    } else {
      const extra = config.extraFields ? config.extraFields(parent) : {};
      await config.model.create(
        { ...data, ...extra, [config.foreignKey]: parentId } as any,
        { transaction }
      );
      delta.added.push(data);
    }
  }

  const orphans = before.filter((row) => !seen.has(keyOf(row, config)));
  for (const orphan of orphans) {
    if (config.detachOnly) {
      // Release, don't destroy — the record outlives this parent.
      await config.model.update({ [config.foreignKey]: null } as any, {
        where: { id: orphan.id } as any,
        transaction
      });
    } else {
      await config.model.destroy({
        where: { id: orphan.id } as any,
        transaction
      });
    }
    delta.removed.push(pick(orphan, config.fields, config.relationFields));
  }

  return {
    before,
    after: await readChildren(config, parentId, transaction),
    delta
  };
};

/** Runs every child collection for one save and folds results into the audit snapshots —
 * full before/after arrays (the regulatory requirement) plus a readable per-collection delta. */
export const syncAllChildren = async (
  children: ChildConfig[] | undefined,
  parentId: string,
  payload: Record<string, any>,
  transaction?: Transaction,
  parent: Record<string, any> = {},
  scope?: ScopeCheck
): Promise<{
  oldChildren: Record<string, any>;
  newChildren: Record<string, any>;
  deltas: Record<string, ChildDelta>;
}> => {
  const oldChildren: Record<string, any> = {};
  const newChildren: Record<string, any> = {};
  const deltas: Record<string, ChildDelta> = {};

  for (const config of children ?? []) {
    const result = await syncChildren(
      config,
      parentId,
      payload[config.field],
      transaction,
      parent,
      scope
    );
    if (!result) continue;

    oldChildren[config.field] = result.before;
    newChildren[config.field] = result.after;

    if (
      result.delta.added.length ||
      result.delta.removed.length ||
      result.delta.changed.length
    ) {
      deltas[config.field] = result.delta;
    }
  }

  return { oldChildren, newChildren, deltas };
};
