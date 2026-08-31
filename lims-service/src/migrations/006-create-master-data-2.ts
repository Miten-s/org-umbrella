import { QueryInterface, DataTypes } from "sequelize";

/** Commercial/inventory master data. `address` is JSONB (edited as one object, no field-level
 * queries); sub-form grids are real child tables, not JSON, so they can be audited row-by-row. */

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

const userRef = {
  type: DataTypes.UUID,
  allowNull: true,
  references: { model: "lims_users", key: "id" },
  onUpdate: "CASCADE" as const,
  onDelete: "SET NULL" as const
};

export const up = async (queryInterface: QueryInterface) => {
  // ─── lims_customers ───────────────────────────────────────────────────────
  await queryInterface.createTable("lims_customers", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    customer_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    customer_name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    rating_id: phraseEntryRef,
    website: { type: DataTypes.STRING(255), allowNull: true },
    contact_name: { type: DataTypes.STRING(200), allowNull: true },
    contact_phone: { type: DataTypes.STRING(50), allowNull: true },
    email: { type: DataTypes.STRING(200), allowNull: true },
    address: { type: DataTypes.JSONB, allowNull: true },
    other_information: { type: DataTypes.TEXT, allowNull: true },
    group_id: groupRef,
    ...softDeleteFields
  });
  await queryInterface.addIndex("lims_customers", ["group_id"]);

  // ─── lims_suppliers ───────────────────────────────────────────────────────
  await queryInterface.createTable("lims_suppliers", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    supplier_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    supplier_name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    rating_id: phraseEntryRef,
    website: { type: DataTypes.STRING(255), allowNull: true },
    contact_name: { type: DataTypes.STRING(200), allowNull: true },
    contact_phone: { type: DataTypes.STRING(50), allowNull: true },
    email: { type: DataTypes.STRING(200), allowNull: true },
    address: { type: DataTypes.JSONB, allowNull: true },
    group_id: groupRef,
    ...softDeleteFields
  });
  await queryInterface.addIndex("lims_suppliers", ["group_id"]);

  // ─── lims_projects ────────────────────────────────────────────────────────
  await queryInterface.createTable("lims_projects", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    project_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    code: { type: DataTypes.STRING(100), allowNull: true },
    details: { type: DataTypes.TEXT, allowNull: true },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_customers", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    customer_contact: { type: DataTypes.STRING(200), allowNull: true },
    supervisor_id: userRef,
    group_id: groupRef,
    ...softDeleteFields
  });
  await queryInterface.addIndex("lims_projects", ["customer_id"]);
  await queryInterface.addIndex("lims_projects", ["group_id"]);

  // ─── lims_studies ─────────────────────────────────────────────────────────
  await queryInterface.createTable("lims_studies", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    study_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    study_code: { type: DataTypes.STRING(100), allowNull: true },
    details: { type: DataTypes.TEXT, allowNull: true },
    project_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_projects", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    // Snapshot at selection time (spec §B.2.i), copied not joined, so it survives a later project edit.
    project_details: { type: DataTypes.TEXT, allowNull: true },
    supervisor_id: userRef,
    group_id: groupRef,
    ...softDeleteFields
  });
  await queryInterface.addIndex("lims_studies", ["project_id"]);
  await queryInterface.addIndex("lims_studies", ["group_id"]);

  // ─── lims_parameters ──────────────────────────────────────────────────────
  await queryInterface.createTable("lims_parameters", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    parameter_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    parameter_name: { type: DataTypes.STRING(200), allowNull: false },
    parameter_type_id: phraseEntryRef,
    default_value: { type: DataTypes.STRING(255), allowNull: true },
    unit: { type: DataTypes.STRING(50), allowNull: true },
    group_id: groupRef,
    ...softDeleteFields
  });
  await queryInterface.addIndex("lims_parameters", ["group_id"]);

  // ─── lims_stocks ──────────────────────────────────────────────────────────
  await queryInterface.createTable("lims_stocks", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    stock_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    stock_name: { type: DataTypes.STRING(200), allowNull: false },
    stock_type_id: phraseEntryRef,
    operator_id: userRef,
    default_location_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_locations", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    preferred_supplier_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_suppliers", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    unit: { type: DataTypes.STRING(50), allowNull: true },
    target_amount: { type: DataTypes.DECIMAL(18, 6), allowNull: true },
    low_amount: { type: DataTypes.DECIMAL(18, 6), allowNull: true },
    low_percentage: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    details: { type: DataTypes.TEXT, allowNull: true },
    group_id: groupRef,
    ...softDeleteFields
  });
  await queryInterface.addIndex("lims_stocks", ["group_id"]);

  // Stock ↔ Supplier, the "Suppliers (multiple can be added)" field. Separate
  // from preferred_supplier_id, which is the single default.
  await queryInterface.createTable("lims_stock_suppliers", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    stock_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_stocks", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    supplier_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_suppliers", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  await queryInterface.addIndex("lims_stock_suppliers", ["stock_id", "supplier_id"], {
    unique: true,
    name: "lims_stock_suppliers_pair_idx"
  });

  // Sub-form: Parameters (Identity / Value / Unit) on a Stock.
  await queryInterface.createTable("lims_stock_parameter_values", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    stock_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_stocks", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    identity: { type: DataTypes.STRING(200), allowNull: true },
    value: { type: DataTypes.STRING(255), allowNull: true },
    unit: { type: DataTypes.STRING(50), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  await queryInterface.addIndex("lims_stock_parameter_values", ["stock_id"]);

  // ─── lims_stock_batches ───────────────────────────────────────────────────
  await queryInterface.createTable("lims_stock_batches", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    // "Stock ID/Batch Number", derived on create — never typed.
    stock_batch_id: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    // Increments per stock, not globally (spec §B.8.b).
    batch_number: { type: DataTypes.INTEGER, allowNull: false },
    stock_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_stocks", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT"
    },
    status_id: phraseEntryRef,
    project_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_projects", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    supplier_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_suppliers", key: "id" },
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
    manufacturing_date: { type: DataTypes.DATEONLY, allowNull: true },
    expiry_date: { type: DataTypes.DATEONLY, allowNull: true },
    supplier_batch_number: { type: DataTypes.STRING(150), allowNull: true },
    // External references (spec §B.8.o/p) — kept as their own fields rather
    // than overloading the internal id.
    sap_batch_id: { type: DataTypes.STRING(150), allowNull: true },
    internal_batch_id: { type: DataTypes.STRING(150), allowNull: true },
    initial_amount: { type: DataTypes.DECIMAL(18, 6), allowNull: true },
    current_amount: { type: DataTypes.DECIMAL(18, 6), allowNull: true },
    unit: { type: DataTypes.STRING(50), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    group_id: groupRef,
    ...softDeleteFields
  });
  await queryInterface.addIndex("lims_stock_batches", ["stock_id"]);
  await queryInterface.addIndex("lims_stock_batches", ["group_id"]);
  await queryInterface.addIndex("lims_stock_batches", ["stock_id", "batch_number"], {
    unique: true,
    name: "lims_stock_batches_number_per_stock_idx"
  });

  // Sub-form: "Current Status (List to Consumption records)".
  await queryInterface.createTable("lims_stock_batch_consumptions", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    stock_batch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_stock_batches", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    consumed_on: { type: DataTypes.DATE, allowNull: true },
    consumed_by: { type: DataTypes.STRING(200), allowNull: true },
    amount: { type: DataTypes.DECIMAL(18, 6), allowNull: true },
    unit: { type: DataTypes.STRING(50), allowNull: true },
    remarks: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  await queryInterface.addIndex("lims_stock_batch_consumptions", ["stock_batch_id"]);

  // Sub-form: Parameters on a Stock Batch.
  await queryInterface.createTable("lims_stock_batch_parameter_values", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    stock_batch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_stock_batches", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    identity: { type: DataTypes.STRING(200), allowNull: true },
    value: { type: DataTypes.STRING(255), allowNull: true },
    unit: { type: DataTypes.STRING(50), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  await queryInterface.addIndex("lims_stock_batch_parameter_values", ["stock_batch_id"]);

  // ─── lims_aliquot_sets ────────────────────────────────────────────────────
  // The UI models an aliquot SET ("split into 12") — hence a set table plus a row table.
  await queryInterface.createTable("lims_aliquot_sets", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    aliquot_set_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    stock_batch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_stock_batches", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    aliquots_number: { type: DataTypes.INTEGER, allowNull: true },
    group_id: groupRef,
    ...softDeleteFields
  });
  await queryInterface.addIndex("lims_aliquot_sets", ["stock_batch_id"]);
  await queryInterface.addIndex("lims_aliquot_sets", ["group_id"]);

  await queryInterface.createTable("lims_aliquots", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    aliquot_set_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_aliquot_sets", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    aliquot_id: { type: DataTypes.STRING(100), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    quantity: { type: DataTypes.DECIMAL(18, 6), allowNull: true },
    unit: { type: DataTypes.STRING(50), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  await queryInterface.addIndex("lims_aliquots", ["aliquot_set_id"]);
};
