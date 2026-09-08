import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable("workflows", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false
    },
    workflow_name: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    number_of_levels: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    levels: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    created_on: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: false
    },
    modified_on: {
      type: DataTypes.DATE,
      allowNull: true
    },
    modified_by: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "enabled"
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

  await queryInterface.addIndex("workflows", ["workflow_name"], {
    unique: true,
    name: "workflows_name_idx"
  });
};
