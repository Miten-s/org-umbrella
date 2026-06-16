import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable("departments", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false
    },
    department_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    department_manager_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    department_group_location_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "locations",
        key: "id"
      },
      onDelete: "RESTRICT"
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "active"
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
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  });

  await queryInterface.addIndex("departments", ["department_name"], {
    unique: true,
    name: "departments_name_idx"
  });
};
