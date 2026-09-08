import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable("service_request_counters", {
    application_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      references: {
        model: "applications",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    seq: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  });
};
