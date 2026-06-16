import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable("app_modules", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false
    },
    module_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    application_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "applications",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    module_id_string: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "enabled"
    },
    created_by: {
      type: DataTypes.STRING,
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

  await queryInterface.addIndex("app_modules", ["application_id", "module_name"], {
    unique: true,
    name: "app_modules_app_name_idx"
  });
};
