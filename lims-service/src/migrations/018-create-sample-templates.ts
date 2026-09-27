import { QueryInterface, DataTypes } from "sequelize";

/** Sample Templates — saved defaults that pre-fill new Sample forms, plus the Test Templates
 * those samples get. A sample copies these values; it keeps no link back to its template. */

const ref = (table: string) => ({
  type: DataTypes.UUID,
  allowNull: true,
  references: { model: table, key: "id" },
  onUpdate: "CASCADE",
  onDelete: "SET NULL"
});

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable("lims_sample_templates", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    sample_template_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    name: { type: DataTypes.STRING(200), allowNull: false },
    sample_type_id: ref("lims_phrase_entries"),
    project_id: ref("lims_projects"),
    specification_id: ref("lims_specifications"),
    location_id: ref("lims_locations"),
    group_id: ref("lims_groups"),
    lot_number: { type: DataTypes.STRING(150), allowNull: true },
    serial_number: { type: DataTypes.STRING(150), allowNull: true },
    login_date: { type: DataTypes.DATE, allowNull: true },
    login_by: { type: DataTypes.STRING(200), allowNull: true },
    sample_start_date: { type: DataTypes.DATE, allowNull: true },
    sample_start_by: { type: DataTypes.STRING(200), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    comments: { type: DataTypes.TEXT, allowNull: true },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    deleted_by: { type: DataTypes.STRING(100), allowNull: true },
    modified_by: { type: DataTypes.STRING(100), allowNull: true },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });
  await queryInterface.addIndex("lims_sample_templates", ["group_id"]);
  await queryInterface.addIndex("lims_sample_templates", [
    "is_deleted",
    "name"
  ]);

  await queryInterface.createTable("lims_sample_template_tests", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    sample_template_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_sample_templates", key: "id" },
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
    sort_order: { type: DataTypes.INTEGER, allowNull: true },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });
  await queryInterface.addIndex(
    "lims_sample_template_tests",
    ["sample_template_id", "analysis_id"],
    { unique: true }
  );
};
