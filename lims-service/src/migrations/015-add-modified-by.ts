import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  
  for (const table of tables) {
    if (table.startsWith("lims_") && table !== "lims_audit_logs") {
      try {
        const desc = await queryInterface.describeTable(table);
        if (!desc.modified_by) {
          await queryInterface.addColumn(table, "modified_by", {
            type: DataTypes.UUID,
            allowNull: true
          });
        }
      } catch (e) {
        console.error(`Failed to add modified_by to ${table}:`, e);
      }
    }
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  const tables = await queryInterface.showAllTables();
  
  for (const table of tables) {
    if (table.startsWith("lims_") && table !== "lims_audit_logs") {
      try {
        const desc = await queryInterface.describeTable(table);
        if (desc.modified_by) {
          await queryInterface.removeColumn(table, "modified_by");
        }
      } catch (e) {
        console.error(`Failed to remove modified_by from ${table}:`, e);
      }
    }
  }
};
