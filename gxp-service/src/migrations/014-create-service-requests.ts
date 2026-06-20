import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable("service_requests", {
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      allowNull: false
    },
    priority: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    application_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "applications",
        key: "id"
      },
      onDelete: "RESTRICT"
    },
    assignment_group_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "assignment_groups",
        key: "id"
      },
      onDelete: "SET NULL"
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    environment_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "environments",
        key: "id"
      },
      onDelete: "SET NULL"
    },
    workflow_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "workflows",
        key: "id"
      },
      onDelete: "SET NULL"
    },
    esign_check: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "No"
    },
    training_done: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    short_description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    closed_on: {
      type: DataTypes.DATE,
      allowNull: true
    },
    closed_by: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    created_by: {
      type: DataTypes.STRING(40),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "New"
    },
    request_types_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "app_services",
        key: "id"
      },
      onDelete: "SET NULL"
    },
    service_request_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    notes: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: []
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

  await queryInterface.addIndex("service_requests", ["service_request_id"], {
    unique: true,
    name: "service_requests_id_idx"
  });
};
