import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable("designations", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false
    },
    designation_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
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
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    modified_on: {
      type: DataTypes.DATE,
      allowNull: true
    },
    modified_by: {
      type: DataTypes.UUID,
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

  await queryInterface.addIndex("designations", ["designation_name"], {
    unique: true,
    name: "designations_name_idx"
  });
};
