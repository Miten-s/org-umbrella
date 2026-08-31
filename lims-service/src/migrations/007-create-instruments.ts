import { QueryInterface, DataTypes } from "sequelize";

/** Instruments, Parts, Calibration schedules, Inspection Plans. Instrument/Part stay separate
 * tables (not one self-referencing table) — listed, permissioned and searched independently. */

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

const locationRef = {
  type: DataTypes.UUID,
  allowNull: true,
  references: { model: "lims_locations", key: "id" },
  onUpdate: "CASCADE" as const,
  onDelete: "SET NULL" as const
};

const supplierRef = {
  type: DataTypes.UUID,
  allowNull: true,
  references: { model: "lims_suppliers", key: "id" },
  onUpdate: "CASCADE" as const,
  onDelete: "SET NULL" as const
};

export const up = async (queryInterface: QueryInterface) => {
  // ─── lims_instruments ─────────────────────────────────────────────────────
  await queryInterface.createTable("lims_instruments", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    instrument_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    type_id: phraseEntryRef,
    measurement_type_id: phraseEntryRef,
    status_id: phraseEntryRef,
    location_id: locationRef,
    supplier_id: supplierRef,
    date_installed: { type: DataTypes.DATEONLY, allowNull: true },
    last_msa_date: { type: DataTypes.DATEONLY, allowNull: true },
    sop_reference: { type: DataTypes.STRING(200), allowNull: true },
    manufacturer: { type: DataTypes.STRING(200), allowNull: true },
    serial_number: { type: DataTypes.STRING(150), allowNull: true },
    model_number: { type: DataTypes.STRING(150), allowNull: true },
    measuring_information: { type: DataTypes.TEXT, allowNull: true },
    msa_information: { type: DataTypes.TEXT, allowNull: true },
    details: { type: DataTypes.TEXT, allowNull: true },
    group_id: groupRef,
    ...softDeleteFields
  });
  await queryInterface.addIndex("lims_instruments", ["group_id"]);

  // ─── lims_instrument_parts ────────────────────────────────────────────────
  await queryInterface.createTable("lims_instrument_parts", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    part_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    part_name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    instrument_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_instruments", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    status_id: phraseEntryRef,
    location_id: locationRef,
    supplier_id: supplierRef,
    date_installed: { type: DataTypes.DATEONLY, allowNull: true },
    sop_reference: { type: DataTypes.STRING(200), allowNull: true },
    manufacturer: { type: DataTypes.STRING(200), allowNull: true },
    serial_number: { type: DataTypes.STRING(150), allowNull: true },
    model_number: { type: DataTypes.STRING(150), allowNull: true },
    measuring_information: { type: DataTypes.TEXT, allowNull: true },
    details: { type: DataTypes.TEXT, allowNull: true },
    group_id: groupRef,
    ...softDeleteFields
  });
  await queryInterface.addIndex("lims_instrument_parts", ["instrument_id"]);
  await queryInterface.addIndex("lims_instrument_parts", ["group_id"]);

  // Sub-form: the Parameters grid on an Instrument.
  await queryInterface.createTable("lims_instrument_parameter_values", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    instrument_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_instruments", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    identity: { type: DataTypes.STRING(200), allowNull: true },
    value: { type: DataTypes.STRING(255), allowNull: true },
    unit: { type: DataTypes.STRING(50), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  await queryInterface.addIndex("lims_instrument_parameter_values", ["instrument_id"]);

  // Maintenance rows hang off an instrument or a part — two nullable FKs + a check
  // constraint, not a polymorphic pair, so the database still enforces referential integrity.
  await queryInterface.createTable("lims_maintenance_records", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    instrument_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_instruments", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    instrument_part_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_instrument_parts", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    maintenance_name: { type: DataTypes.STRING(200), allowNull: true },
    performed_on: { type: DataTypes.DATE, allowNull: true },
    performed_by: { type: DataTypes.STRING(200), allowNull: true },
    remarks: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  await queryInterface.addIndex("lims_maintenance_records", ["instrument_id"]);
  await queryInterface.addIndex("lims_maintenance_records", ["instrument_part_id"]);
  await queryInterface.sequelize.query(
    `ALTER TABLE lims_maintenance_records
       ADD CONSTRAINT lims_maintenance_one_owner
       CHECK (num_nonnulls(instrument_id, instrument_part_id) = 1)`
  );

  // ─── lims_calibrations ────────────────────────────────────────────────────
  // Calibration and its schedule are one record — the spec lists them as a single form.
  await queryInterface.createTable("lims_calibrations", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    calibration_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    calibration_name: { type: DataTypes.STRING(200), allowNull: false },
    instrument_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_instruments", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    calibration_type_id: phraseEntryRef,
    status_id: phraseEntryRef,
    // Scheduling: plan (Daily/Monthly/Yearly) + time of day, and a lead time
    // split into value + unit so "2 days before" is queryable.
    plan: { type: DataTypes.STRING(50), allowNull: true },
    plan_time: { type: DataTypes.STRING(20), allowNull: true },
    lead_time_value: { type: DataTypes.INTEGER, allowNull: true },
    lead_time_unit: { type: DataTypes.STRING(20), allowNull: true },
    owner_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    contractor: { type: DataTypes.STRING(200), allowNull: true },
    last_maintenance_date: { type: DataTypes.DATEONLY, allowNull: true },
    next_maintenance_date: { type: DataTypes.DATEONLY, allowNull: true },
    // "Auto Login (Check mark)" — whether the scheduler raises the calibration
    // sample automatically when it falls due.
    auto_login: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    group_id: groupRef,
    ...softDeleteFields
  });
  await queryInterface.addIndex("lims_calibrations", ["instrument_id"]);
  await queryInterface.addIndex("lims_calibrations", ["group_id"]);
  await queryInterface.addIndex("lims_calibrations", ["next_maintenance_date"]);

  // ─── lims_inspection_plans ────────────────────────────────────────────────
  await queryInterface.createTable("lims_inspection_plans", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    inspection_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    // "Round robin" | "Linear" — free text rather than a pick list because the
    // spec fixes the two values inline rather than sourcing them from Phrases.
    inspection_type: { type: DataTypes.STRING(50), allowNull: true },
    details: { type: DataTypes.TEXT, allowNull: true },
    group_id: groupRef,
    ...softDeleteFields
  });
  await queryInterface.addIndex("lims_inspection_plans", ["group_id"]);

  // Sub-form: "we should be able to add any person or any role".
  await queryInterface.createTable("lims_inspection_personnel", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    inspection_plan_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_inspection_plans", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    // Which of the two columns is filled depends on inspection_type.
    inspection_type: { type: DataTypes.STRING(50), allowNull: true },
    person_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_roles", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  await queryInterface.addIndex("lims_inspection_personnel", ["inspection_plan_id"]);
};
