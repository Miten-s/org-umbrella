import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable("roles", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Custom"
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

  await queryInterface.addIndex("roles", ["name"], {
    unique: true,
    name: "roles_name_idx"
  });
};
