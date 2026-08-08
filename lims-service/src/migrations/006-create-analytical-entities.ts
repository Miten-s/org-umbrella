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

  // Analyses
  await queryInterface.createTable("lims_analyses", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    approval_status_phrase_id: { type: DataTypes.UUID, allowNull: true }, // e.g. Draft, Approved, Retired
    sop_reference: { type: DataTypes.STRING(255), allowNull: true },
    inspection_plan_id: { 
      type: DataTypes.UUID, 
      allowNull: true,
      references: { model: "lims_inspection_plans", key: "id" }
    },
    ...baseFields
  });

  // Analysis Components
  await queryInterface.createTable("lims_analysis_components", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    analysis_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_analyses", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    name: { type: DataTypes.STRING(200), allowNull: false },
    component_type_phrase_id: { type: DataTypes.UUID, allowNull: false }, // Numeric, Text, Boolean, Date, etc.
    unit_phrase_id: { type: DataTypes.UUID, allowNull: true }, // For numeric types
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    is_required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ...baseFields
  });

  // Test Groups
  await queryInterface.createTable("lims_test_groups", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    ...baseFields
  });

  // Test Group Items (Link table)
  await queryInterface.createTable("lims_test_group_items", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    test_group_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_test_groups", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    analysis_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_analyses", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    ...baseFields
  });

  // Specifications
  await queryInterface.createTable("lims_specifications", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    status_phrase_id: { type: DataTypes.UUID, allowNull: true }, // Draft, Active, Retired
    ...baseFields
  });

  // Spec Limits
  await queryInterface.createTable("lims_spec_limits", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    specification_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_specifications", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    analysis_component_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_analysis_components", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    // The following fields support multiple component types. Only the relevant one(s) will be populated.
    min_value: { type: DataTypes.DECIMAL(18, 6), allowNull: true }, // For numeric
    max_value: { type: DataTypes.DECIMAL(18, 6), allowNull: true }, // For numeric
    target_text: { type: DataTypes.STRING(255), allowNull: true }, // For exact text match
    target_boolean: { type: DataTypes.BOOLEAN, allowNull: true }, // For boolean match
    ...baseFields
  });

  // Indexes
  await queryInterface.addIndex("lims_analysis_components", ["analysis_id"]);
  await queryInterface.addIndex("lims_test_group_items", ["test_group_id"]);
  await queryInterface.addIndex("lims_spec_limits", ["specification_id"]);
};
