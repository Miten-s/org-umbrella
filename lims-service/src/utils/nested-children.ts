import { Model, ModelStatic, Transaction } from "sequelize";

/**
 * Nested sub-forms. The frontend sends child rows inside the parent payload
 * (`entries[]`, `components[]`, `limits[]`…), so they are persisted in the same
 * transaction as the parent and produce ONE audit entry, not five.
 *
 * Semantics are replace-set: whatever the client sends becomes the complete
 * set of children. Rows missing from the payload are deleted, new rows are
 * inserted, matching rows are updated. That mirrors how the grid behaves —
 * the user edits a list and saves it whole.
 */
export interface ChildConfig {
  /** Key in the parent payload, e.g. "entries". Also the relation alias. */
  field: string;
  model: ModelStatic<Model>;
  /** FK attribute on the child pointing back at the parent, e.g. "phraseId". */
  foreignKey: string;
  /** Child attributes the client may set. Anything else is ignored. */
  fields: string[];
  /**
   * Attribute used to recognise "the same row" across a save, so an edit is
   * reported as a change rather than a delete plus an insert. Falls back to
   * `id` when the client echoes it back.
   */
  matchKey?: string;
}

/** What changed in one child collection — the shape stored on the audit row. */
export interface ChildDelta {
  added: Record<string, any>[];
  removed: Record<string, any>[];
  changed: { key: string; from: Record<string, any>; to: Record<string, any> }[];
}

const pick = (row: Record<string, any>, fields: string[]) => {
  const out: Record<string, any> = {};
  for (const field of fields) if (row[field] !== undefined) out[field] = row[field];
  return out;
};

/** Stable identity for a child row: the match key, else its id. */
const keyOf = (row: Record<string, any>, config: ChildConfig): string => {
  const value = config.matchKey ? row[config.matchKey] : undefined;
  return String(value ?? row.id ?? "");
};

const differs = (a: Record<string, any>, b: Record<string, any>, fields: string[]) =>
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
    where: { [config.foreignKey]: parentId } as any,
    transaction
  });
  return rows.map((row) => row.toJSON() as Record<string, any>);
};

/**
 * Applies the incoming child set and returns what changed.
 *
 * `undefined` means "the client did not mention this collection" — left alone.
 * An empty array means "delete them all", which is a real instruction.
 */
export const syncChildren = async (
  config: ChildConfig,
  parentId: string,
  incoming: Record<string, any>[] | undefined,
  transaction?: Transaction
): Promise<{ before: Record<string, any>[]; after: Record<string, any>[]; delta: ChildDelta } | null> => {
  if (incoming === undefined) return null;

  const before = await readChildren(config, parentId, transaction);
  const beforeByKey = new Map(before.map((row) => [keyOf(row, config), row]));
  const seen = new Set<string>();

  const delta: ChildDelta = { added: [], removed: [], changed: [] };

  for (const raw of incoming) {
    const data = pick(raw, config.fields);
    const key = keyOf(raw, config);
    const existing = key ? beforeByKey.get(key) : undefined;

    if (existing) {
      seen.add(key);
      if (differs(existing, data, config.fields)) {
        await config.model.update(data as any, { where: { id: existing.id } as any, transaction });
        delta.changed.push({
          key,
          from: pick(existing, config.fields),
          to: data
        });
      }
    } else {
      await config.model.create({ ...data, [config.foreignKey]: parentId } as any, { transaction });
      delta.added.push(data);
    }
  }

  const orphans = before.filter((row) => !seen.has(keyOf(row, config)));
  for (const orphan of orphans) {
    await config.model.destroy({ where: { id: orphan.id } as any, transaction });
    delta.removed.push(pick(orphan, config.fields));
  }

  return { before, after: await readChildren(config, parentId, transaction), delta };
};

/**
 * Runs every child collection for one save and folds the results into the
 * audit snapshots.
 *
 * Both the full before/after arrays AND an explicit per-collection delta are
 * recorded. The arrays are the regulatory requirement (the complete prior
 * state must stay retrievable); the delta is what makes an audit screen
 * readable without diffing two arrays by eye.
 */
export const syncAllChildren = async (
  children: ChildConfig[] | undefined,
  parentId: string,
  payload: Record<string, any>,
  transaction?: Transaction
): Promise<{
  oldChildren: Record<string, any>;
  newChildren: Record<string, any>;
  deltas: Record<string, ChildDelta>;
}> => {
  const oldChildren: Record<string, any> = {};
  const newChildren: Record<string, any> = {};
  const deltas: Record<string, ChildDelta> = {};

  for (const config of children ?? []) {
    const result = await syncChildren(config, parentId, payload[config.field], transaction);
    if (!result) continue;

    oldChildren[config.field] = result.before;
    newChildren[config.field] = result.after;

    if (result.delta.added.length || result.delta.removed.length || result.delta.changed.length) {
      deltas[config.field] = result.delta;
    }
  }

  return { oldChildren, newChildren, deltas };
};
