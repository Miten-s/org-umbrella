import { QueryInterface, DataTypes } from "sequelize";

/** The access-scoping layer for GXP, mirroring lims-service's lims_groups /
 * lims_user_access_groups. Deliberately NOT named plain "group" anywhere in this schema —
 * `applications.group` already exists and holds a location id (an unrelated, pre-existing
 * field); reusing the name here would be actively misleading. Uses gxp's own status enum
 * convention ("enabled"/"disabled"), not lims's is_deleted/deleted_at soft-delete columns —
 * this mirrors the CONCEPT (hierarchical group + user-access join), not lims's literal
 * schema, since gxp already has its own conventions for the rest of its tables. */
export const up = async (queryInterface: QueryInterface) => {
  // ─── gxp_groups ────────────────────────────────────────────────────────────
  // Self-referencing: access to a parent group is meant to cascade to its descendants,
  // same as lims_groups (see lims-service's expandGroupIds()).
  await queryInterface.createTable("gxp_groups", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.STRING(200), allowNull: true },
    parent_group_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "gxp_groups", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "enabled"
    },
    created_by: { type: DataTypes.STRING, allowNull: true },
    modified_by: { type: DataTypes.STRING, allowNull: true },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });
  await queryInterface.addIndex("gxp_groups", ["parent_group_id"]);

  // ─── gxp_user_access_groups — which groups a gxp user may reach ───────────
  await queryInterface.createTable("gxp_user_access_groups", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    gxp_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "gxp_users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    group_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "gxp_groups", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });
  await queryInterface.addIndex(
    "gxp_user_access_groups",
    ["gxp_user_id", "group_id"],
    { unique: true }
  );

  // ─── gxp_users.group_id — home group ──────────────────────────────────────
  // The group implicitly stamped on records this user creates. Nullable: every existing
  // gxp_users row has none until an admin assigns one — this migration only adds the
  // column, it does not scope any domain entity yet (applications/service_requests still
  // have no group_id of their own, so this alone changes no runtime behavior).
  await queryInterface.addColumn("gxp_users", "group_id", {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: "gxp_groups", key: "id" },
    onUpdate: "CASCADE",
    onDelete: "SET NULL"
  });
};
