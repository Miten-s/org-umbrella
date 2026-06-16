import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable("application_app_roles", {
    application_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "applications",
        key: "id"
      },
      onDelete: "CASCADE",
      primaryKey: true
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "app_roles",
        key: "id"
      },
      onDelete: "CASCADE",
      primaryKey: true
    }
  });

  await queryInterface.createTable("application_app_services", {
    application_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "applications",
        key: "id"
      },
      onDelete: "CASCADE",
      primaryKey: true
    },
    service_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "app_services",
        key: "id"
      },
      onDelete: "CASCADE",
      primaryKey: true
    }
  });

  await queryInterface.createTable("service_request_modules", {
    service_request_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: "service_requests",
        key: "id"
      },
      onDelete: "CASCADE",
      primaryKey: true
    },
    module_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "app_modules",
        key: "id"
      },
      onDelete: "CASCADE",
      primaryKey: true
    }
  });

  await queryInterface.createTable("service_request_roles", {
    service_request_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: "service_requests",
        key: "id"
      },
      onDelete: "CASCADE",
      primaryKey: true
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "app_roles",
        key: "id"
      },
      onDelete: "CASCADE",
      primaryKey: true
    }
  });
};
