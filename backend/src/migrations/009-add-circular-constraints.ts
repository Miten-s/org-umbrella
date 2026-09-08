import { QueryInterface } from "sequelize";

export const up = async (queryInterface: QueryInterface) => {
  // Add department manager foreign key constraint
  await queryInterface.addConstraint("departments", {
    fields: ["department_manager_id"],
    type: "foreign key",
    name: "fk_departments_manager",
    references: {
      table: "users",
      field: "id"
    },
    onDelete: "SET NULL",
    onUpdate: "CASCADE"
  });

  // Add location modified_by foreign key constraint
  await queryInterface.addConstraint("locations", {
    fields: ["modified_by"],
    type: "foreign key",
    name: "fk_locations_modifier",
    references: {
      table: "users",
      field: "id"
    },
    onDelete: "SET NULL",
    onUpdate: "CASCADE"
  });

  // Add designation modified_by foreign key constraint
  await queryInterface.addConstraint("designations", {
    fields: ["modified_by"],
    type: "foreign key",
    name: "fk_designations_modifier",
    references: {
      table: "users",
      field: "id"
    },
    onDelete: "SET NULL",
    onUpdate: "CASCADE"
  });
};
