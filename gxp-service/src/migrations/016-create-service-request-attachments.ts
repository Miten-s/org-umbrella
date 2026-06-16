import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable("service_request_attachments", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false
    },
    service_request_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: "service_requests",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    attachment: {
      type: DataTypes.STRING,
      allowNull: false
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false
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

  await queryInterface.addIndex("service_request_attachments", ["service_request_id", "attachment"], {
    unique: true,
    name: "service_req_attachments_req_file_idx"
  });
};
