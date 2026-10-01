import { QueryInterface, DataTypes } from "sequelize";

/** Ledger for the LIMS role migration (src/scripts/migrate-lims-roles.ts): one row per LIMS
 * role the script moved into backend.
 *
 * - Idempotency: a LIMS role with a row here is synced on re-runs, never created twice.
 * - Rollback: records which backend roles a run created (as opposed to mapped onto an
 *   existing one), so a rollback removes exactly those and nothing else.
 * - Traceability: every migrated backend role traces back to the LIMS role it came from. */
export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable("lims_role_migration_map", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    run_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    lims_role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true
    },
    lims_label: {
      type: DataTypes.STRING,
      allowNull: true
    },
    backend_role_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    // 'created' — the script inserted the backend role; rollback removes it.
    // 'mapped_to_existing' — pointed at a role that already existed (LIMS Master Admin);
    // rollback must NOT remove it.
    disposition: {
      type: DataTypes.STRING,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  await queryInterface.addIndex("lims_role_migration_map", ["run_id"], {
    name: "lims_role_migration_map_run_idx"
  });
};
