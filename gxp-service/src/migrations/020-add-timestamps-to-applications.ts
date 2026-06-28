import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface) => {
  const tableDefinition = await queryInterface.describeTable("applications");
  if (!tableDefinition.created_at) {
    await queryInterface.addColumn("applications", "created_at", {
      type: DataTypes.DATE,
      allowNull: true
    });
    await queryInterface.sequelize.query(
      `UPDATE applications SET created_at = COALESCE(created_on, NOW()) WHERE created_at IS NULL`
    );
    await queryInterface.changeColumn("applications", "created_at", {
      type: DataTypes.DATE,
      allowNull: false
    });
  }
  if (!tableDefinition.updated_at) {
    await queryInterface.addColumn("applications", "updated_at", {
      type: DataTypes.DATE,
      allowNull: true
    });
    await queryInterface.sequelize.query(
      `UPDATE applications SET updated_at = COALESCE(modified_on, NOW()) WHERE updated_at IS NULL`
    );
    await queryInterface.changeColumn("applications", "updated_at", {
      type: DataTypes.DATE,
      allowNull: false
    });
  }
};
