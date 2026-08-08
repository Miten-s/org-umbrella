import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const baseFields = {
    group_id: { type: DataTypes.UUID, allowNull: true },
    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    deleted_by: { type: DataTypes.UUID, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false }
  };

  // Instruments
  await queryInterface.createTable("lims_instruments", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    location_id: { type: DataTypes.UUID, allowNull: true, references: { model: "lims_locations", key: "id" } },
    supplier_id: { type: DataTypes.UUID, allowNull: true, references: { model: "lims_suppliers", key: "id" } },
    serial_number: { type: DataTypes.STRING(100), allowNull: true },
    status_phrase_id: { type: DataTypes.UUID, allowNull: true }, // e.g. Active, Maintenance, Out of Service
    ...baseFields
  });

  // Instrument Parts
  await queryInterface.createTable("lims_instrument_parts", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    instrument_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_instruments", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    part_name: { type: DataTypes.STRING(200), allowNull: false },
    part_number: { type: DataTypes.STRING(100), allowNull: true },
    installation_date: { type: DataTypes.DATE, allowNull: true },
    expected_lifetime_days: { type: DataTypes.INTEGER, allowNull: true },
    ...baseFields
  });

  // Calibration Schedules
  await queryInterface.createTable("lims_calibration_schedules", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    instrument_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_instruments", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    title: { type: DataTypes.STRING(200), allowNull: false },
    frequency_days: { type: DataTypes.INTEGER, allowNull: false },
    next_due_date: { type: DataTypes.DATE, allowNull: false },
    ...baseFields
  });

  // Calibrations (Logs)
  await queryInterface.createTable("lims_calibrations", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    schedule_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_calibration_schedules", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    instrument_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_instruments", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    performed_by: { type: DataTypes.UUID, allowNull: true }, // User ID from AuthDB
    performed_at: { type: DataTypes.DATE, allowNull: false },
    result_phrase_id: { type: DataTypes.UUID, allowNull: false }, // Pass, Fail, Adjustments Made
    notes: { type: DataTypes.TEXT, allowNull: true },
    ...baseFields
  });

  // Inspection Plans
  await queryInterface.createTable("lims_inspection_plans", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    ...baseFields
  });

  // Inspection Personnel (Routing steps/permissions)
  await queryInterface.createTable("lims_inspection_personnel", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    plan_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_inspection_plans", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    step_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    role_id: { type: DataTypes.UUID, allowNull: true }, // Role ID from AuthDB
    user_id: { type: DataTypes.UUID, allowNull: true }, // User ID from AuthDB (if specific person)
    step_description: { type: DataTypes.STRING(255), allowNull: true },
    ...baseFields
  });

  // Indexes
  await queryInterface.addIndex("lims_instrument_parts", ["instrument_id"]);
  await queryInterface.addIndex("lims_calibrations", ["instrument_id"]);
  await queryInterface.addIndex("lims_inspection_personnel", ["plan_id"]);
};
