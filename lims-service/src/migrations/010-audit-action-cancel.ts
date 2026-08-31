import { QueryInterface } from "sequelize";

/** Adds CANCEL/REACTIVATE to the audit action vocabulary. The column was a Postgres ENUM,
 * which can't gain a value inside a transaction — switched to VARCHAR + CHECK instead. */
export const up = async (queryInterface: QueryInterface) => {
  const { sequelize } = queryInterface;

  await sequelize.query(
    `ALTER TABLE lims_audit_logs
       ALTER COLUMN action TYPE VARCHAR(20)
       USING action::text`
  );

  // The enum type is now unreferenced. IF EXISTS keeps this idempotent on a
  // database where an earlier attempt already dropped it.
  await sequelize.query(`DROP TYPE IF EXISTS "enum_lims_audit_logs_action"`);

  await sequelize.query(
    `ALTER TABLE lims_audit_logs
       ADD CONSTRAINT lims_audit_logs_action_check
       CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'CANCEL', 'REACTIVATE'))`
  );
};
