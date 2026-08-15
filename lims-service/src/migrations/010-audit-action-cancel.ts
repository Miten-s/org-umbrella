import { QueryInterface } from "sequelize";

/**
 * Adds CANCEL / REACTIVATE to the audit action vocabulary.
 *
 * The column was a Postgres ENUM, which cannot gain a value inside a
 * transaction — and every migration here runs in one. Rather than special-case
 * the runner, the column becomes VARCHAR with a CHECK constraint: same
 * guarantee, and the next action to be added is a one-line constraint swap
 * instead of a fight with the type system. That matters because the spec's
 * configurable-entity feature will keep adding verbs.
 */
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
