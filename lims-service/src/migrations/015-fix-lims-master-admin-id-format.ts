import { QueryInterface } from "sequelize";
import crypto from "crypto";

/**
 * `014-seed-lims-master-admin-role` originally generated its id from a SHA-256 hash rather
 * than a real UUID, so it didn't reliably set the RFC4122 version/variant nibbles —
 * Postgres's `uuid` column accepted it regardless, but this service's own `@IsUUID("4")`
 * validation on bulk-action DTOs rejects it the moment the frontend sends it back for an
 * update/delete/duplicate. 014 itself is fixed to generate a proper id from here on; this
 * corrects the row already inserted by the version of 014 that ran before that fix.
 * Confirmed unreferenced (no lims_user_roles, lims_role_entries, or lims_inspection_personnel
 * rows point at it yet) before writing this, so reassigning its primary key is safe.
 */
export const up = async (queryInterface: QueryInterface) => {
  const sequelize = queryInterface.sequelize;

  await sequelize.query(
    `UPDATE lims_roles SET id = :newId
      WHERE role_id = 'LIMS_MASTER_ADMIN' AND id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'`,
    { replacements: { newId: crypto.randomUUID() } }
  );
};
