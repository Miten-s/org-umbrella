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
  /**
   * Digits to pad to. Defaults to 6 (`LOC-000001`), which is right for master
   * data — nobody creates a million storage locations.
   *
   * The execution entities need more, and the difference is not academic:
   * at the stated volumes (10k samples, 100k tests, 1M results per day) a
   * 6-digit counter is exhausted in 100 days, 10 days, and **one day**
   * respectively.
   *
   * Overflowing is not a crash — `padStart` widens rather than truncates, the
   * columns are STRING(100+) and the counter is BIGINT — but the ids stop
   * being fixed-width, and sorting them as text puts `RES-1000000` before
   * `RES-999999`. Sizing the pad for a decade of volume keeps them ordered.
   */
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

/**
 * Claim the next number for an entity. Atomic: the `ON CONFLICT DO UPDATE` runs
 * as a single statement, so concurrent callers are serialised by row lock and
 * cannot receive the same value.
 *
 * Exported (beyond `nextBusinessId`'s own use) for callers that need a bare
 * atomic counter rather than a formatted `PREFIX-000001` business id — e.g.
 * Stock Batch's per-stock `batchNumber`, which needs its own counter per
 * stock rather than one shared across the whole entity. Any string works as
 * `entity` as long as it's unique to the thing being counted; `lims_id_sequences`
 * keys on it.
 */
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
    const value = formatBusinessId(config.prefix, candidate, config.pad);
    const taken = await model.count({
      where: { [config.field]: value } as any,
      paranoid: false
    });
    if (taken === 0) return value;
  }

  return formatBusinessId(config.prefix, candidate, config.pad);
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
