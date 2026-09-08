import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable("assignment_group_members", {
    group_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "assignment_groups",
        key: "id"
      },
      onDelete: "CASCADE",
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true
    },
    user_name: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });
};
