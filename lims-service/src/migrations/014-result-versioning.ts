import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.addColumn("lims_results", "version", {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  });

  await queryInterface.addColumn("lims_results", "is_latest", {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  });

  await queryInterface.addColumn("lims_results", "parent_result_id", {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: "lims_results",
      key: "id"
    }
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.removeColumn("lims_results", "parent_result_id");
  await queryInterface.removeColumn("lims_results", "is_latest");
  await queryInterface.removeColumn("lims_results", "version");
};
