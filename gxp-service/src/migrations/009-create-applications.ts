import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable("applications", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false
    },
    application_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    application_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    application_type: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    application_environment_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "environments",
        key: "id"
      },
      onDelete: "SET NULL"
    },
    group: {
      type: DataTypes.STRING,
      allowNull: false
    },
    assignment_group_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "assignment_groups",
        key: "id"
      },
      onDelete: "SET NULL"
    },
    application_workflow_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "workflows",
        key: "id"
      },
      onDelete: "SET NULL"
    },
    application_system_owner_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    application_process_owner_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    supplier_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "suppliers",
        key: "id"
      },
      onDelete: "SET NULL"
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "enabled"
    },
    created_on: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: true
    },
    modified_on: {
      type: DataTypes.DATE,
      allowNull: true
    },
    modified_by: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });

  await queryInterface.addIndex("applications", ["application_name"], {
    unique: true,
    name: "applications_name_idx"
  });
};
