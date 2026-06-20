import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable("assignment_groups", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false
    },
    group_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    manager_user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    manager_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    created_on: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_by: {
      type: DataTypes.STRING(40),
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

  await queryInterface.addIndex("assignment_groups", ["group_name"], {
    unique: true,
    name: "assignment_groups_name_idx"
  });
};
