import { QueryInterface, DataTypes } from "sequelize";

/** Append-only trail of every role and permission change. This is a GxP-regulated system
 * (21 CFR Part 11): lims-service already keeps per-mutation audit records, backend kept
 * none. Landed before LIMS roles move here, so no regulated change is ever unlogged.
 *
 * No FK on actor_user_id: a user may be deleted later and the trail must survive them. */
export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable("rbac_audit_log", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    actor_user_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    actor_email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false
    },
    target_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    target_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    target_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    before_state: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    after_state: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  await queryInterface.addIndex("rbac_audit_log", ["target_type", "target_id"], {
    name: "rbac_audit_log_target_idx"
  });

  await queryInterface.addIndex("rbac_audit_log", ["created_at"], {
    name: "rbac_audit_log_created_at_idx"
  });

  await queryInterface.addIndex("rbac_audit_log", ["actor_user_id"], {
    name: "rbac_audit_log_actor_idx"
  });
};
