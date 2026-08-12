import { QueryInterface, DataTypes } from "sequelize";

/**
 * The access-control layer: the permission catalogue, groups, roles and the
 * lims_users records that tie a platform user to both.
 *
 * These tables come before the 26 entities because every one of them is
 * filtered by `group_id` and guarded by `authorize()`, so nothing else can be
 * built until they exist.
 *
 * Design notes:
 *  - `entry` on role entries is STRING, not ENUM. An ENUM needs an ALTER TYPE
 *    migration for every new entity; a string validated against the catalogue
 *    lets the vocabulary grow (including the spec's future user-defined tables)
 *    with no schema change.
 *  - Roles are GLOBAL. `lims_roles.group_id` is an ownership tag recording who
 *    may edit the role — it is NOT an access scope. Access comes from the
 *    user's access groups.
 */

/** Soft-delete + provenance columns carried by every mutable LIMS table. */
const softDeleteFields = {
  is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  deleted_at: { type: DataTypes.DATE, allowNull: true },
  deleted_by: { type: DataTypes.STRING(100), allowNull: true },
  modified_by: { type: DataTypes.STRING(100), allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
};

export const up = async (queryInterface: QueryInterface) => {
  // ─── lims_permissions — the catalogue ──────────────────────────────────────
  // Seeded from src/utils/permissions.ts on boot. Read-only to users; it exists
  // so the Role form's Entry dropdown is served by the API rather than typed.
  await queryInterface.createTable("lims_permissions", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    code: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    entity: { type: DataTypes.STRING(50), allowNull: true },
    action: { type: DataTypes.STRING(20), allowNull: true },
    label: { type: DataTypes.STRING(200), allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  await queryInterface.addIndex("lims_permissions", ["entity"]);

  // ─── lims_groups ───────────────────────────────────────────────────────────
  // Self-referencing hierarchy: access to a parent group cascades to every
  // descendant (see expandGroupIds()).
  await queryInterface.createTable("lims_groups", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    group_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    owned_by: { type: DataTypes.STRING(100), allowNull: true },
    parent_group_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_groups", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    ...softDeleteFields
  });
  await queryInterface.addIndex("lims_groups", ["parent_group_id"]);

  // ─── lims_roles ────────────────────────────────────────────────────────────
  await queryInterface.createTable("lims_roles", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    role_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    // Ownership tag only — who may edit this role. NOT an access scope.
    group_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_groups", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    // Grants OPERATE:ALL — bypasses group filtering. Kept as an explicit column
    // rather than a magic catalogue row so it is greppable and auditable.
    operate_all: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    ...softDeleteFields
  });

  // ─── lims_role_entries — the grants (nested sub-form on Role) ─────────────
  await queryInterface.createTable("lims_role_entries", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_roles", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    entry: { type: DataTypes.STRING(50), allowNull: false },
    can_view: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    can_create: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    can_edit: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    can_remove: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  await queryInterface.addIndex("lims_role_entries", ["role_id", "entry"], { unique: true });

  // ─── lims_users ────────────────────────────────────────────────────────────
  // LIMS never creates users. This row grants an existing platform user access
  // to LIMS and carries their home group, access groups and roles. No row means
  // no LIMS access at all.
  await queryInterface.createTable("lims_users", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    // The platform (auth-service) user id. Lives in a different database, so
    // this is deliberately not a foreign key.
    user_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    user_name: { type: DataTypes.STRING(200), allowNull: true },
    // Home group: the default stamped on records this user creates.
    group_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_groups", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    // FK added in the locations migration, once lims_locations exists.
    location_id: { type: DataTypes.UUID, allowNull: true },
    signature: { type: DataTypes.STRING(200), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    training_completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    ...softDeleteFields
  });
  await queryInterface.addIndex("lims_users", ["group_id"]);

  // ─── lims_user_access_groups — what this user may reach ───────────────────
  await queryInterface.createTable("lims_user_access_groups", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    lims_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    group_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_groups", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  await queryInterface.addIndex("lims_user_access_groups", ["lims_user_id", "group_id"], {
    unique: true
  });

  // ─── lims_user_roles ──────────────────────────────────────────────────────
  await queryInterface.createTable("lims_user_roles", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    lims_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_roles", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  await queryInterface.addIndex("lims_user_roles", ["lims_user_id", "role_id"], { unique: true });

  // ─── lims_access_bypass_logs — the SEPARATE audit stream ──────────────────
  // Every request served under OPERATE:ALL lands here, never in
  // lims_audit_logs. Keeping it separate means "show me every time somebody
  // used admin override" is one unfiltered table scan, not a needle hunt
  // through millions of ordinary CRUD rows.
  await queryInterface.createTable("lims_access_bypass_logs", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    performed_by: { type: DataTypes.STRING(100), allowNull: false },
    performed_by_name: { type: DataTypes.STRING(200), allowNull: true },
    entity: { type: DataTypes.STRING(50), allowNull: false },
    action: { type: DataTypes.STRING(20), allowNull: false },
    method: { type: DataTypes.STRING(10), allowNull: false },
    path: { type: DataTypes.TEXT, allowNull: false },
    request_id: { type: DataTypes.STRING(100), allowNull: true },
    performed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  await queryInterface.addIndex("lims_access_bypass_logs", ["performed_by"]);
  await queryInterface.addIndex("lims_access_bypass_logs", ["performed_at"]);
};
