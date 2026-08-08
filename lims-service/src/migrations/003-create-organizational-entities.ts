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

  // Customers
  await queryInterface.createTable("lims_customers", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(200), allowNull: false },
    contact_email: { type: DataTypes.STRING(255), allowNull: true },
    contact_phone: { type: DataTypes.STRING(50), allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    ...baseFields
  });

  // Suppliers
  await queryInterface.createTable("lims_suppliers", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(200), allowNull: false },
    contact_email: { type: DataTypes.STRING(255), allowNull: true },
    contact_phone: { type: DataTypes.STRING(50), allowNull: true },
    rating_phrase_id: { type: DataTypes.UUID, allowNull: true }, // Links to PhraseEntry (Rating)
    notes: { type: DataTypes.TEXT, allowNull: true },
    ...baseFields
  });

  // Projects
  await queryInterface.createTable("lims_projects", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_customers", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    supervisor_id: { type: DataTypes.UUID, allowNull: true }, // Links to User from AuthDB
    start_date: { type: DataTypes.DATE, allowNull: true },
    end_date: { type: DataTypes.DATE, allowNull: true },
    status_phrase_id: { type: DataTypes.UUID, allowNull: true },
    ...baseFields
  });

  // Studies
  await queryInterface.createTable("lims_studies", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_projects", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    supervisor_id: { type: DataTypes.UUID, allowNull: true }, // Links to User from AuthDB
    status_phrase_id: { type: DataTypes.UUID, allowNull: true },
    ...baseFields
  });

  // Indexes
  await queryInterface.addIndex("lims_projects", ["customer_id"]);
  await queryInterface.addIndex("lims_studies", ["project_id"]);
};
