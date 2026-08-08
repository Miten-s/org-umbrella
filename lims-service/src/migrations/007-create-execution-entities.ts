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

  // Batches
  await queryInterface.createTable("lims_batches", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    batch_number: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    status_phrase_id: { type: DataTypes.UUID, allowNull: true }, // e.g. Active, Completed, Cancelled
    ...baseFields
  });

  // Lots
  await queryInterface.createTable("lims_lots", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    batch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_batches", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    lot_number: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    status_phrase_id: { type: DataTypes.UUID, allowNull: true },
    ...baseFields
  });

  // Samples
  await queryInterface.createTable("lims_samples", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    lot_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_lots", key: "id" }
    },
    sample_number: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    status_phrase_id: { type: DataTypes.UUID, allowNull: true }, // Logged, In Progress, Complete, Cancelled
    logged_in_at: { type: DataTypes.DATE, allowNull: true },
    logged_in_by: { type: DataTypes.UUID, allowNull: true },
    priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 }, // 1=Normal, 2=High
    test_group_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_test_groups", key: "id" }
    },
    ...baseFields
  });

  // Tests
  await queryInterface.createTable("lims_tests", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    sample_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_samples", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    analysis_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_analyses", key: "id" }
    },
    status_phrase_id: { type: DataTypes.UUID, allowNull: true }, // Logged, In Progress, Complete
    instrument_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_instruments", key: "id" }
    },
    ...baseFields
  });

  // Test Windows (representing the expected data points)
  await queryInterface.createTable("lims_test_windows", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    test_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_tests", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    analysis_component_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_analysis_components", key: "id" }
    },
    status_phrase_id: { type: DataTypes.UUID, allowNull: true }, // Pending, Resulted, OOS
    ...baseFields
  });

  // Results
  await queryInterface.createTable("lims_results", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    test_window_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_test_windows", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    // Captured values matching component type
    numeric_value: { type: DataTypes.DECIMAL(18, 6), allowNull: true },
    text_value: { type: DataTypes.STRING(255), allowNull: true },
    boolean_value: { type: DataTypes.BOOLEAN, allowNull: true },
    date_value: { type: DataTypes.DATE, allowNull: true },
    is_oos: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }, // Out Of Spec flag
    entered_by: { type: DataTypes.UUID, allowNull: true },
    entered_at: { type: DataTypes.DATE, allowNull: true },
    ...baseFields
  });

  // Indexes
  await queryInterface.addIndex("lims_lots", ["batch_id"]);
  await queryInterface.addIndex("lims_samples", ["lot_id"]);
  await queryInterface.addIndex("lims_tests", ["sample_id"]);
  await queryInterface.addIndex("lims_test_windows", ["test_id"]);
  await queryInterface.addIndex("lims_results", ["test_window_id"]);
};
