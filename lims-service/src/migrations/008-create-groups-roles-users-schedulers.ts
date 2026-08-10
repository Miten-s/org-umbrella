import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const softDeleteFields = {
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    deleted_by: { type: DataTypes.UUID, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false }
  };

  // ─── lims_groups ──────────────────────────────────────────────────────────
  await queryInterface.createTable("lims_groups", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    group_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    owned_by: { type: DataTypes.UUID, allowNull: true },
    parent_group_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_groups", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    ...softDeleteFields
  });

  try { await queryInterface.addIndex("lims_groups", ["group_id"], { unique: true }); } catch(e) {}

  // ─── lims_roles ───────────────────────────────────────────────────────────
  await queryInterface.createTable("lims_roles", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    role_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    group_id: { type: DataTypes.UUID, allowNull: true },
    ...softDeleteFields
  });

  try { await queryInterface.addIndex("lims_roles", ["role_id"], { unique: true }); } catch(e) {}

  // ─── lims_role_entries ────────────────────────────────────────────────────
  await queryInterface.createTable("lims_role_entries", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_roles", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    entry: {
      type: DataTypes.ENUM(
        "USER", "ROLE", "GROUP", "PROJECT", "STUDY", "SUPPLIER", "CUSTOMER",
        "LOCATION", "STOCK", "PARAMETER", "STOCK_BATCH", "ALIQUOT",
        "INSTRUMENT", "INSTRUMENT_PART", "CALIBRATION", "INSPECTION_PLAN",
        "ANALYSIS", "TEST_GROUP", "SPECIFICATION", "BATCH",
        "LOT", "SAMPLE", "TEST", "RESULT", "SCHEDULER", "PHRASE"
      ),
      allowNull: false
    },
    can_view:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    can_create: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    can_edit:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    can_remove: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false }
  });

  try { await queryInterface.addIndex("lims_role_entries", ["role_id", "entry"], { unique: true }); } catch(e) {}

  // ─── lims_users ───────────────────────────────────────────────────────────
  await queryInterface.createTable("lims_users", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    user_id: { type: DataTypes.UUID, allowNull: false, unique: true },
    user_name: { type: DataTypes.STRING(200), allowNull: false },
    group_id: { type: DataTypes.UUID, allowNull: true },
    location_id: { type: DataTypes.UUID, allowNull: true },
    signature: { type: DataTypes.TEXT, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    training_completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    ...softDeleteFields
  });

  try { await queryInterface.addIndex("lims_users", ["user_id"], { unique: true }); } catch(e) {}

  // ─── lims_user_roles (join) ───────────────────────────────────────────────
  await queryInterface.createTable("lims_user_roles", {
    lims_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_roles", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    }
  });

  // ─── lims_user_access_groups (join) ──────────────────────────────────────
  await queryInterface.createTable("lims_user_access_groups", {
    lims_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    group_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_groups", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    }
  });

  // ─── lims_schedulers ─────────────────────────────────────────────────────
  await queryInterface.createTable("lims_schedulers", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    scheduler_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    scope: { type: DataTypes.STRING(100), allowNull: true },
    group_id: { type: DataTypes.UUID, allowNull: true },
    project_id: { type: DataTypes.UUID, allowNull: true },
    analysis_id: { type: DataTypes.UUID, allowNull: true },
    test_group_id: { type: DataTypes.UUID, allowNull: true },
    specification_id: { type: DataTypes.UUID, allowNull: true },
    sample_type_id: { type: DataTypes.UUID, allowNull: true },
    owner_id: { type: DataTypes.UUID, allowNull: true },
    plan: { type: DataTypes.STRING(100), allowNull: true },
    plan_time: { type: DataTypes.STRING(50), allowNull: true },
    lead_time_value: { type: DataTypes.FLOAT, allowNull: true },
    lead_time_unit: { type: DataTypes.STRING(50), allowNull: true },
    last_run_date: { type: DataTypes.DATE, allowNull: true },
    next_run_date: { type: DataTypes.DATE, allowNull: true },
    generated_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    description: { type: DataTypes.TEXT, allowNull: true },
    auto_login: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ...softDeleteFields
  });

  try { await queryInterface.addIndex("lims_schedulers", ["scheduler_id"], { unique: true }); } catch(e) {}
};
