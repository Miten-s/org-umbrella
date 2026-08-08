import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable("lims_audit_logs", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    entity_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    entity_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    action: {
      type: DataTypes.ENUM("CREATE", "UPDATE", "DELETE", "RESTORE"),
      allowNull: false
    },
    old_value: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    new_value: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    change_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    performed_by: {
      type: DataTypes.UUID,
      allowNull: false
    },
    performed_by_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    performed_at: {
      type: DataTypes.DATE,
      allowNull: false
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

  await queryInterface.addIndex("lims_audit_logs", ["entity_name", "entity_id"], {
    name: "lims_audit_entity_idx"
  });

  await queryInterface.addIndex("lims_audit_logs", ["performed_at"], {
    name: "lims_audit_performed_at_idx"
  });

  await queryInterface.addIndex("lims_audit_logs", ["performed_by"], {
    name: "lims_audit_performed_by_idx"
  });
};
