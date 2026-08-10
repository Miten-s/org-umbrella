import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable("role_permissions", {
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "roles",
        key: "id"
      },
      onDelete: "CASCADE",
      primaryKey: true
    },
    permission_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "permissions",
        key: "id"
      },
      onDelete: "CASCADE",
      primaryKey: true
    }
  });
};
