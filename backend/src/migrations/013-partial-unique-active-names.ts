import { QueryInterface } from "sequelize";

/**
 * Soft-delete + uniqueness consistency (MIGRATION.md Rule 1).
 *
 * These tables are `paranoid` (soft-delete via deleted_at) but had a FULL unique
 * index/constraint on their business name — so soft-deleted rows kept occupying
 * the unique namespace, breaking create/clone with "Duplicate value…". We replace
 * the full unique constraint + index with a PARTIAL unique index scoped to active
 * (non-soft-deleted) rows: `UNIQUE (<name>) WHERE deleted_at IS NULL`.
 *
 * DB-level (not app-level) so it is race-safe. Clone name generation already
 * computes the next free name among ACTIVE rows (Sequelize `paranoid` excludes
 * soft-deleted), so it now succeeds. Restore paths must re-check for an active
 * name collision before un-deleting.
 */
const TARGETS: { table: string; column: string; oldIndex: string; oldConstraint: string; newIndex: string }[] = [
  {
    table: "locations",
    column: "location_name",
    oldIndex: "locations_name_idx",
    oldConstraint: "locations_location_name_key",
    newIndex: "locations_location_name_active_uq"
  },
  {
    table: "departments",
    column: "department_name",
    oldIndex: "departments_name_idx",
    oldConstraint: "departments_department_name_key",
    newIndex: "departments_department_name_active_uq"
  },
  {
    table: "designations",
    column: "designation_name",
    oldIndex: "designations_name_idx",
    oldConstraint: "designations_designation_name_key",
    newIndex: "designations_designation_name_active_uq"
  }
];

export const up = async (queryInterface: QueryInterface) => {
  const sequelize = queryInterface.sequelize;
  for (const { table, column, oldIndex, oldConstraint, newIndex } of TARGETS) {
    // Drop the full unique constraint (from column `unique: true`) if present…
    await sequelize.query(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${oldConstraint}";`);
    // …and the named full unique index.
    await sequelize.query(`DROP INDEX IF EXISTS "${oldIndex}";`);
    // Also drop any lingering auto-named unique index on the column, defensively.
    await sequelize.query(
      `DO $$
       DECLARE idx text;
       BEGIN
         FOR idx IN
           SELECT indexrelid::regclass::text
           FROM pg_index i
           JOIN pg_class t ON t.oid = i.indrelid
           JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(i.indkey)
           WHERE t.relname = '${table}' AND a.attname = '${column}'
             AND i.indisunique AND i.indpred IS NULL
         LOOP EXECUTE 'DROP INDEX IF EXISTS ' || idx; END LOOP;
       END $$;`
    );
    // Create the partial unique index: uniqueness only among active rows.
    await sequelize.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "${newIndex}" ON "${table}" ("${column}") WHERE deleted_at IS NULL;`
    );
  }
};
