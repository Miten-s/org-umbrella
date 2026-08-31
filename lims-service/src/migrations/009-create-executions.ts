import { QueryInterface, DataTypes } from "sequelize";

/** Lab executions: Batch → Lot → Sample → Test → Result, plus Schedulers. Cancel≠Remove; Results
 * are insert-only (`version`/`is_latest`, Part 11) and carry a partial index for 1M rows/day. */

const softDeleteFields = {
  is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  deleted_at: { type: DataTypes.DATE, allowNull: true },
  deleted_by: { type: DataTypes.STRING(100), allowNull: true },
  modified_by: { type: DataTypes.STRING(100), allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
};

/**
 * Executions must belong to a group — unlike reference data, "which lab owns
 * this sample" can never be ambiguous.
 */
const requiredGroupRef = {
  type: DataTypes.UUID,
  allowNull: true,
  references: { model: "lims_groups", key: "id" },
  onUpdate: "CASCADE" as const,
  onDelete: "SET NULL" as const
};

const phraseEntryRef = {
  type: DataTypes.UUID,
  allowNull: true,
  references: { model: "lims_phrase_entries", key: "id" },
  onUpdate: "CASCADE" as const,
  onDelete: "SET NULL" as const
};

/** Open | Cancelled | Complete — a business state, independent of soft delete. */
const statusColumn = {
  type: DataTypes.STRING(20),
  allowNull: false,
  defaultValue: "Open"
};

export const up = async (queryInterface: QueryInterface) => {
  // ─── lims_batches ─────────────────────────────────────────────────────────
  await queryInterface.createTable("lims_batches", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    batch_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    batch_name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: statusColumn,
    cancelled_at: { type: DataTypes.DATE, allowNull: true },
    cancelled_by: { type: DataTypes.STRING(100), allowNull: true },
    group_id: requiredGroupRef,
    ...softDeleteFields
  });
  await queryInterface.addIndex("lims_batches", ["group_id"]);
  await queryInterface.addIndex("lims_batches", ["status"]);

  // ─── lims_lots ────────────────────────────────────────────────────────────
  // A lot belongs to at most one batch; the client picks lots when editing a batch.
  await queryInterface.createTable("lims_lots", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    lot_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    lot_name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    batch_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_batches", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    status: statusColumn,
    cancelled_at: { type: DataTypes.DATE, allowNull: true },
    cancelled_by: { type: DataTypes.STRING(100), allowNull: true },
    group_id: requiredGroupRef,
    ...softDeleteFields
  });
  await queryInterface.addIndex("lims_lots", ["batch_id"]);
  await queryInterface.addIndex("lims_lots", ["group_id"]);

  // ─── lims_samples ─────────────────────────────────────────────────────────
  await queryInterface.createTable("lims_samples", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    // Always server-generated (spec: "ID Numeric (Auto Increment)").
    sample_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    id_numeric: { type: DataTypes.BIGINT, allowNull: true },
    id_text: { type: DataTypes.STRING(255), allowNull: true },
    sample_name: { type: DataTypes.STRING(200), allowNull: true },
    lot_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_lots", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_projects", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    sample_type_id: phraseEntryRef,
    specification_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_specifications", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    test_group_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_test_groups", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    location_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_locations", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    stock_batch_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_stock_batches", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    lot_number: { type: DataTypes.STRING(150), allowNull: true },
    serial_number: { type: DataTypes.STRING(150), allowNull: true },
    login_date: { type: DataTypes.DATE, allowNull: true },
    login_by: { type: DataTypes.STRING(200), allowNull: true },
    sample_start_date: { type: DataTypes.DATE, allowNull: true },
    sample_start_by: { type: DataTypes.STRING(200), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    comments: { type: DataTypes.TEXT, allowNull: true },
    status: statusColumn,
    cancelled_at: { type: DataTypes.DATE, allowNull: true },
    cancelled_by: { type: DataTypes.STRING(100), allowNull: true },
    group_id: requiredGroupRef,
    ...softDeleteFields
  });
  await queryInterface.addIndex("lims_samples", ["lot_id"]);
  await queryInterface.addIndex("lims_samples", ["project_id"]);
  await queryInterface.addIndex("lims_samples", ["group_id"]);
  await queryInterface.addIndex("lims_samples", ["status"]);
  // 10k samples/day: the default list is newest-first over live rows.
  await queryInterface.sequelize.query(
    `CREATE INDEX lims_samples_live_created_idx
       ON lims_samples (created_at DESC)
       WHERE is_deleted = false`
  );

  // ─── lims_tests ───────────────────────────────────────────────────────────
  await queryInterface.createTable("lims_tests", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    test_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    test_name: { type: DataTypes.STRING(200), allowNull: true },
    sample_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_samples", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    analysis_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_analyses", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    instrument_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_instruments", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    replicate_count: { type: DataTypes.INTEGER, allowNull: true },
    login_date: { type: DataTypes.DATE, allowNull: true },
    login_by: { type: DataTypes.STRING(200), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: statusColumn,
    cancelled_at: { type: DataTypes.DATE, allowNull: true },
    cancelled_by: { type: DataTypes.STRING(100), allowNull: true },
    group_id: requiredGroupRef,
    ...softDeleteFields
  });
  await queryInterface.addIndex("lims_tests", ["sample_id"]);
  await queryInterface.addIndex("lims_tests", ["analysis_id"]);
  await queryInterface.addIndex("lims_tests", ["group_id"]);
  await queryInterface.addIndex("lims_tests", ["status"]);
  // 100k tests/day.
  await queryInterface.sequelize.query(
    `CREATE INDEX lims_tests_live_created_idx
       ON lims_tests (created_at DESC)
       WHERE is_deleted = false`
  );

  // ─── lims_results ─────────────────────────────────────────────────────────
  // The 1M-rows-a-day table. Insert-only: see the header note.
  await queryInterface.createTable("lims_results", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    result_id: { type: DataTypes.STRING(100), allowNull: false },
    test_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_tests", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    component_id: { type: DataTypes.STRING(100), allowNull: true },
    component_name: { type: DataTypes.STRING(200), allowNull: true },
    value: { type: DataTypes.TEXT, allowNull: true },
    unit: { type: DataTypes.STRING(50), allowNull: true },
    out_of_range: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    instrument_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_instruments", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    stock_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_stocks", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    entered_on: { type: DataTypes.DATE, allowNull: true },
    entered_by: { type: DataTypes.STRING(200), allowNull: true },

    // Versioning. `version` counts from 1; exactly one row per (test,
    // component) carries is_latest = true.
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    is_latest: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    /** The row this one supersedes — the chain back to the original entry. */
    supersedes_id: { type: DataTypes.UUID, allowNull: true },

    status: statusColumn,
    cancelled_at: { type: DataTypes.DATE, allowNull: true },
    cancelled_by: { type: DataTypes.STRING(100), allowNull: true },
    group_id: requiredGroupRef,
    ...softDeleteFields
  });

  await queryInterface.addIndex("lims_results", ["test_id"]);
  await queryInterface.addIndex("lims_results", ["group_id"]);

  // The default list predicate, with its ordering column. Partial, so the
  // index holds only live current rows rather than every historic version.
  await queryInterface.sequelize.query(
    `CREATE INDEX lims_results_live_created_idx
       ON lims_results (created_at DESC, id)
       WHERE is_deleted = false AND is_latest = true`
  );

  // "The current value of this component on this test" — the hot lookup when
  // entering results, and what enforces one current row per component.
  await queryInterface.sequelize.query(
    `CREATE UNIQUE INDEX lims_results_one_current_per_component_idx
       ON lims_results (test_id, component_id)
       WHERE is_latest = true AND is_deleted = false`
  );

  // Version history for one component, oldest → newest.
  await queryInterface.addIndex("lims_results", ["test_id", "component_id", "version"], {
    name: "lims_results_version_chain_idx"
  });

  // ─── lims_schedulers ──────────────────────────────────────────────────────
  await queryInterface.createTable("lims_schedulers", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    scheduler_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    // Sample | Test | Result — what this scheduler raises.
    scope: { type: DataTypes.STRING(50), allowNull: true },
    project_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_projects", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    analysis_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_analyses", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    test_group_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_test_groups", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    specification_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_specifications", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    sample_type_id: phraseEntryRef,
    owner_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    plan: { type: DataTypes.STRING(50), allowNull: true },
    plan_time: { type: DataTypes.STRING(20), allowNull: true },
    lead_time_value: { type: DataTypes.INTEGER, allowNull: true },
    lead_time_unit: { type: DataTypes.STRING(20), allowNull: true },
    last_run_date: { type: DataTypes.DATE, allowNull: true },
    next_run_date: { type: DataTypes.DATE, allowNull: true },
    generated_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    description: { type: DataTypes.TEXT, allowNull: true },
    auto_login: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    group_id: requiredGroupRef,
    ...softDeleteFields
  });
  await queryInterface.addIndex("lims_schedulers", ["group_id"]);
  // The runner's sweep: active schedulers that have come due.
  await queryInterface.sequelize.query(
    `CREATE INDEX lims_schedulers_due_idx
       ON lims_schedulers (next_run_date)
       WHERE is_active = true AND is_deleted = false`
  );

  // ─── lims_test_windows ────────────────────────────────────────────────────
  // The result-entry grid on a sample — its own table, not nested, for the same volume reason as Results.
  await queryInterface.createTable("lims_test_windows", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    sample_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_samples", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    test_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_tests", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    analysis_name: { type: DataTypes.STRING(200), allowNull: true },
    component_id: { type: DataTypes.STRING(100), allowNull: true },
    component_name: { type: DataTypes.STRING(200), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    value: { type: DataTypes.TEXT, allowNull: true },
    unit: { type: DataTypes.STRING(50), allowNull: true },
    out_of_range: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    entered_on: { type: DataTypes.DATE, allowNull: true },
    entered_by: { type: DataTypes.STRING(200), allowNull: true },
    instrument_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_instruments", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    stock_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_stocks", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  await queryInterface.addIndex("lims_test_windows", ["sample_id"]);
  await queryInterface.addIndex("lims_test_windows", ["test_id"]);
};
