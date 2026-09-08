import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable("user_roles", {
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id"
      },
      onDelete: "CASCADE",
      primaryKey: true
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "roles",
        key: "id"
      },
      onDelete: "CASCADE",
      primaryKey: true
    }
  });
};
