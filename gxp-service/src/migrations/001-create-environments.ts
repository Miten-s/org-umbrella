import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable("environments", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false
    },
    environment_name: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.STRING(50),
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
      type: DataTypes.STRING(40),
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

  await queryInterface.addIndex("environments", ["environment_name"], {
    unique: true,
    name: "environments_name_idx"
  });
};
