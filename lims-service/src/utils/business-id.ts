import { Model, ModelStatic, QueryTypes, Transaction } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * Human-readable business IDs (`LOC-000001`) — the code a lab actually says
 * out loud, as distinct from the UUID primary key.
 *
 * Two behaviours, per the agreed rule:
 *
 *  - **Master data** (`locked: false`) — the server generates a suggestion the
 *    form pre-fills, and the user may overwrite it with something meaningful
 *    (`PROJ-2026-STABILITY`). Whatever arrives is honoured; uniqueness is
 *    enforced by the column's unique index.
 *  - **Lab executions** (`locked: true`) — Sample/Test/Result are always
 *    server-generated and any client value is discarded. At 1M results a day
 *    nobody is typing these, and a duplicated sample number is a data-integrity
 *    incident rather than an inconvenience.
 */
export interface BusinessIdConfig {
  /** Payload/column field holding the ID, e.g. "locationId". */
  field: string;
  /** Short prefix, e.g. "LOC" → LOC-000001. */
  prefix: string;
  /** true = always server-generated, client value discarded. */
  locked?: boolean;
}

const PAD = 6;

/** How many times to skip ahead when a generated number is already taken. */
const MAX_COLLISION_RETRIES = 50;

export const formatBusinessId = (prefix: string, value: number | string): string =>
  `${prefix}-${String(value).padStart(PAD, "0")}`;

/**
 * Claim the next number for an entity. Atomic: the `ON CONFLICT DO UPDATE` runs
 * as a single statement, so concurrent callers are serialised by row lock and
 * cannot receive the same value.
 */
const claimNextValue = async (
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

/**
 * The next free business ID for an entity.
 *
 * Skips over numbers already taken by hand-entered IDs — a user who types
 * `LOC-000007` before the counter reaches it must not cause a later create to
 * fail on the unique index.
 */
export const nextBusinessId = async <M extends Model>(
  model: ModelStatic<M>,
  entity: string,
  config: BusinessIdConfig,
  transaction?: Transaction
): Promise<string> => {
  for (let attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt += 1) {
    const candidate = formatBusinessId(config.prefix, await claimNextValue(entity, config.prefix, transaction));

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

/**
 * The value the create form should pre-fill, without consuming it.
 *
 * Deliberately non-consuming: browsing a create form must not burn IDs. The
 * consequence is that two users opening the form at the same moment see the
 * same suggestion and the second save hits the unique index — a clear 409 they
 * resolve by saving again, which is a better trade than gaps every time
 * somebody opens a form and closes it.
 */
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
    const value = formatBusinessId(config.prefix, candidate);
    const taken = await model.count({ where: { [config.field]: value } as any, paranoid: false });
    if (taken === 0) return value;
  }

  return formatBusinessId(config.prefix, candidate);
};

/**
 * Settle the business ID on a create payload.
 *
 * Locked entities always get a fresh server value. Unlocked ones keep whatever
 * the client sent and are only generated for when the field is absent or blank.
 */
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
