import { QueryInterface, DataTypes } from "sequelize";

/** Analyses, Test Groups, Specifications — the definitions a lab tests against (vs. the
 * executions in 009). Component/limit rows keep `min`/`max`/etc. as loose strings, since type decides which matter. */

const softDeleteFields = {
  is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  deleted_at: { type: DataTypes.DATE, allowNull: true },
  deleted_by: { type: DataTypes.STRING(100), allowNull: true },
  modified_by: { type: DataTypes.STRING(100), allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
};

const groupRef = {
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

export const up = async (queryInterface: QueryInterface) => {
  // ─── lims_analyses ────────────────────────────────────────────────────────
  await queryInterface.createTable("lims_analyses", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    analysis_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    analysis_type_id: phraseEntryRef,
    approval_status_id: phraseEntryRef,
    inspection_plan_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_inspection_plans", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    sop_reference: { type: DataTypes.STRING(200), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    details: { type: DataTypes.TEXT, allowNull: true },
    group_id: groupRef,
    ...softDeleteFields
  });
  await queryInterface.addIndex("lims_analyses", ["group_id"]);

  await queryInterface.createTable("lims_analysis_components", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    analysis_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_analyses", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    component_id: { type: DataTypes.STRING(100), allowNull: true },
    name: { type: DataTypes.STRING(200), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    // Numeric | Text | Option | Boolean | Character | Date | Interval |
    // Formula | File | Entity — decides which of the columns below apply.
    type: { type: DataTypes.STRING(50), allowNull: true },
    unit: { type: DataTypes.STRING(50), allowNull: true },
    calculation: { type: DataTypes.TEXT, allowNull: true },
    formula: { type: DataTypes.TEXT, allowNull: true },
    option: { type: DataTypes.STRING(255), allowNull: true },
    list: { type: DataTypes.TEXT, allowNull: true },
    entity: { type: DataTypes.STRING(150), allowNull: true },
    entity_criteria: { type: DataTypes.TEXT, allowNull: true },
    min: { type: DataTypes.STRING(100), allowNull: true },
    max: { type: DataTypes.STRING(100), allowNull: true },
    sort_order: { type: DataTypes.INTEGER, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  await queryInterface.addIndex("lims_analysis_components", ["analysis_id"]);

  // ─── lims_test_groups ─────────────────────────────────────────────────────
  await queryInterface.createTable("lims_test_groups", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    test_group_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    group_id: groupRef,
    ...softDeleteFields
  });
  await queryInterface.addIndex("lims_test_groups", ["group_id"]);

  await queryInterface.createTable("lims_test_group_items", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    test_group_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_test_groups", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    test_name: { type: DataTypes.STRING(200), allowNull: true },
    instrument_category: { type: DataTypes.STRING(150), allowNull: true },
    instrument_type: { type: DataTypes.STRING(150), allowNull: true },
    instrument_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_instruments", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    replicate_count: { type: DataTypes.INTEGER, allowNull: true },
    sort_order: { type: DataTypes.INTEGER, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  await queryInterface.addIndex("lims_test_group_items", ["test_group_id"]);

  // ─── lims_specifications ──────────────────────────────────────────────────
  await queryInterface.createTable("lims_specifications", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    spec_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    group_id: groupRef,
    ...softDeleteFields
  });
  await queryInterface.addIndex("lims_specifications", ["group_id"]);

  await queryInterface.createTable("lims_spec_limits", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    specification_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_specifications", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    // Held as names, not FKs — a spec must stay readable if the analysis/component is later renamed.
    analysis_name: { type: DataTypes.STRING(200), allowNull: true },
    component_name: { type: DataTypes.STRING(200), allowNull: true },
    min: { type: DataTypes.STRING(100), allowNull: true },
    max: { type: DataTypes.STRING(100), allowNull: true },
    text: { type: DataTypes.STRING(255), allowNull: true },
    phrase: { type: DataTypes.STRING(255), allowNull: true },
    boolean: { type: DataTypes.STRING(20), allowNull: true },
    calculation: { type: DataTypes.TEXT, allowNull: true },
    sort_order: { type: DataTypes.INTEGER, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  await queryInterface.addIndex("lims_spec_limits", ["specification_id"]);
};
