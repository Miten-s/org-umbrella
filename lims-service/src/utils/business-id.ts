import { Model, ModelStatic, QueryTypes, Transaction } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/** Human-readable business IDs (`LOC-000001`). Master data (`locked: false`): a pre-filled
 * suggestion the user may overwrite. Lab executions (`locked: true`): always server-generated. */
export interface BusinessIdConfig {
  /** Payload/column field holding the ID, e.g. "locationId". */
  field: string;
  /** Short prefix, e.g. "LOC" → LOC-000001. */
  prefix: string;
  /** true = always server-generated, client value discarded. */
  locked?: boolean;
  /** Digits to pad to (default 6). Execution entities need more — at 1M results/day a
   * 6-digit counter exhausts in a day, and overflow breaks text-sort ordering. */
  pad?: number;
}

const DEFAULT_PAD = 6;

/** How many times to skip ahead when a generated number is already taken. */
const MAX_COLLISION_RETRIES = 50;

export const formatBusinessId = (
  prefix: string,
  value: number | string,
  pad: number = DEFAULT_PAD
): string => `${prefix}-${String(value).padStart(pad, "0")}`;

/** Claims the next number for an entity, atomically (`ON CONFLICT DO UPDATE`, serialised by
 * row lock). Exported for callers needing a bare counter, e.g. Stock Batch's per-stock `batchNumber`. */
export const claimNextValue = async (
  entity: string,
  prefix: string,
  transaction?: Transaction
): Promise<number> => {
  const [row] = await sequelize.query<{ last_value: string }>(
    `INSERT INTO lims_id_sequences (entity, prefix, last_value, created_at, updated_at)
     VALUES (:entity, :prefix, 1, NOW(), NOW())
     ON CONFLICT (entity) DO UPDATE
       SET last_value = lims_id_sequences.last_value + 1, updated_at = NOW()
     RETURNING last_value`,
    { replacements: { entity, prefix }, type: QueryTypes.SELECT, transaction }
  );

  return Number(row.last_value);
};

/** The next free business ID for an entity — skips numbers already taken by hand-entered
 * IDs, so a user who typed `LOC-000007` ahead of the counter can't collide with it later. */
export const nextBusinessId = async <M extends Model>(
  model: ModelStatic<M>,
  entity: string,
  config: BusinessIdConfig,
  transaction?: Transaction
): Promise<string> => {
  for (let attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt += 1) {
    const candidate = formatBusinessId(
      config.prefix,
      await claimNextValue(entity, config.prefix, transaction),
      config.pad
    );

    const taken = await model.count({
      where: { [config.field]: candidate } as any,
      transaction,
      paranoid: false
    });

    if (taken === 0) return candidate;
  }

  throw Object.assign(
    new Error(
      `Could not allocate a free ${config.field} after ${MAX_COLLISION_RETRIES} attempts — ` +
        "the counter is far behind the hand-entered IDs in this table."
    ),
    { statusCode: 409 }
  );
};

/** The value the create form should pre-fill, without consuming it — two users opening the
 * form at once may see the same suggestion; a resulting 409 beats gaps from unclaimed forms. */
export const peekBusinessId = async <M extends Model>(
  model: ModelStatic<M>,
  entity: string,
  config: BusinessIdConfig
): Promise<string> => {
  const [row] = await sequelize.query<{ last_value: string }>(
    "SELECT last_value FROM lims_id_sequences WHERE entity = :entity",
    { replacements: { entity }, type: QueryTypes.SELECT }
  );

  let candidate = Number(row?.last_value ?? 0);

  for (let attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt += 1) {
    candidate += 1;
    const value = formatBusinessId(config.prefix, candidate, config.pad);
    const taken = await model.count({
      where: { [config.field]: value } as any,
      paranoid: false
    });
    if (taken === 0) return value;
  }

  return formatBusinessId(config.prefix, candidate, config.pad);
};

/** Settles the business ID on a create payload — locked entities always get a fresh server
 * value; unlocked ones keep what the client sent, generated only when absent or blank. */
export const applyBusinessId = async <M extends Model>(
  model: ModelStatic<M>,
  entity: string,
  config: BusinessIdConfig,
  payload: Record<string, any>,
  transaction?: Transaction
): Promise<Record<string, any>> => {
  const supplied = payload[config.field];
  const hasSupplied = typeof supplied === "string" && supplied.trim() !== "";

  if (!config.locked && hasSupplied) {
    return { ...payload, [config.field]: supplied.trim() };
  }

  return {
    ...payload,
    [config.field]: await nextBusinessId(model, entity, config, transaction)
  };
};
