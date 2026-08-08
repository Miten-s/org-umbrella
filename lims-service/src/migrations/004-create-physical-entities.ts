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

  // Locations (Hierarchical)
  await queryInterface.createTable("lims_locations", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(200), allowNull: false },
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_locations", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    location_type_phrase_id: { type: DataTypes.UUID, allowNull: true }, // Building, Room, Fridge, etc.
    description: { type: DataTypes.TEXT, allowNull: true },
    ...baseFields
  });

  // Stock Parameters
  await queryInterface.createTable("lims_stock_parameters", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(200), allowNull: false },
    unit_phrase_id: { type: DataTypes.UUID, allowNull: true }, // e.g. mg, ml, pH
    description: { type: DataTypes.TEXT, allowNull: true },
    ...baseFields
  });

  // Stock (Material Master)
  await queryInterface.createTable("lims_stock", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    stock_type_phrase_id: { type: DataTypes.UUID, allowNull: true }, // Reagent, Consumable
    min_threshold: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    unit_phrase_id: { type: DataTypes.UUID, allowNull: true }, // Primary tracking unit
    ...baseFields
  });

  // Stock Batches (Physical deliveries)
  await queryInterface.createTable("lims_stock_batches", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    stock_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_stock", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    batch_number: { type: DataTypes.STRING(100), allowNull: false },
    supplier_id: { type: DataTypes.UUID, allowNull: true },
    location_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_locations", key: "id" }
    },
    initial_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    current_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    expiry_date: { type: DataTypes.DATE, allowNull: true },
    received_date: { type: DataTypes.DATE, allowNull: true },
    ...baseFields
  });

  // Aliquots (Split portions)
  await queryInterface.createTable("lims_aliquots", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    batch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_stock_batches", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    aliquot_label: { type: DataTypes.STRING(100), allowNull: false },
    location_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_locations", key: "id" }
    },
    initial_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    current_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    expiry_date: { type: DataTypes.DATE, allowNull: true },
    ...baseFields
  });

  // Indexes
  await queryInterface.addIndex("lims_locations", ["parent_id"]);
  await queryInterface.addIndex("lims_stock_batches", ["stock_id"]);
  await queryInterface.addIndex("lims_aliquots", ["batch_id"]);
};
