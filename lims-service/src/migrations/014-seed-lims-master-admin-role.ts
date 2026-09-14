import { QueryInterface } from "sequelize";
import crypto from "crypto";

/**
 * Mirrors backend/src/migrations/018/019-*-gxp-master-admin-role.ts — every service gets
 * exactly one seeded, ready-made "Master Admin" role so Super Admin doesn't have to
 * hand-build one from scratch to bootstrap the first admin (previously only possible via
 * manually running src/scripts/bootstrap-admin.ts). `operateAll: true` alone is LIMS's
 * existing full-access mechanism (see lims-service/src/services/user-context.service.ts) —
 * no entries needed, matching GXP's wildcard-only role exactly. Assignment already goes
 * through the existing escalation checks in role-escalation.middleware.ts (only Super Admin,
 * or someone who already holds operateAll, can hand this out).
 *
 * `crypto.randomUUID()`, not a deterministic hash-derived id — `role_id`'s own uniqueness
 * (ON CONFLICT below) is what makes this idempotent, so the primary key doesn't need to be.
 * A hand-rolled hash-based id isn't guaranteed to set the RFC4122 version/variant nibbles,
 * which Postgres's `uuid` column accepts regardless but `class-validator`'s `@IsUUID("4")`
 * (used on this service's bulk-action DTOs) does not — it would fail the moment the
 * frontend sent this role's real id back for a bulk update/delete.
 */
export const up = async (queryInterface: QueryInterface) => {
  const sequelize = queryInterface.sequelize;
  const id = crypto.randomUUID();

  await sequelize.query(
    `INSERT INTO lims_roles (id, role_id, name, description, operate_all, is_deleted, created_at, updated_at)
     VALUES (:id, 'LIMS_MASTER_ADMIN', 'LIMS Master Admin',
             'Full LIMS access. Bypasses group filtering; every use is audited.',
             true, false, now(), now())
     ON CONFLICT (role_id) DO NOTHING`,
    { replacements: { id } }
  );
};
