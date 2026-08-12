import { QueryInterface, DataTypes } from "sequelize";

/**
 * Pick Lists (Phrases) and Storage Locations — the first master-data tables,
 * and the two everything else references.
 *
 * Column names deliberately match the frontend's `<Entity>.types.ts` payload
 * field names (`locationName`, not `name`). The previous service picked its own
 * names and the client had to carry a 261-line translation map; matching here
 * costs nothing and deletes that whole layer.
 */

const softDeleteFields = {
  is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  deleted_at: { type: DataTypes.DATE, allowNull: true },
  deleted_by: { type: DataTypes.STRING(100), allowNull: true },
  modified_by: { type: DataTypes.STRING(100), allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
};

export const up = async (queryInterface: QueryInterface) => {
  // Nested sub-form deltas (spec §6) — the readable summary of which child row
  // changed, alongside the full before/after arrays in old_value/new_value.
  await queryInterface.addColumn("lims_audit_logs", "child_changes", {
    type: DataTypes.JSONB,
    allowNull: true
  });

  // `ownedBy` is a person from the auth database, returned to the client as
  // {id, name}. The name is denormalised because it lives in another database
  // and cannot be joined.
  await queryInterface.addColumn("lims_groups", "owned_by_name", {
    type: DataTypes.STRING(200),
    allowNull: true
  });

  // ─── lims_phrases — pick lists ────────────────────────────────────────────
  // group_id is nullable here: phrases are global reference data, visible to
  // every group (the only category the access rules allow a NULL group on).
  await queryInterface.createTable("lims_phrases", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    phrase: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    group_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_groups", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    // Seeded lists the application depends on: values may be added, but the
    // list itself cannot be renamed or removed.
    is_system: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    ...softDeleteFields
  });

  await queryInterface.createTable("lims_phrase_entries", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    phrase_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "lims_phrases", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    phrase_entry_id: { type: DataTypes.STRING(100), allowNull: false },
    name: { type: DataTypes.STRING(200), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  await queryInterface.addIndex("lims_phrase_entries", ["phrase_id", "phrase_entry_id"], {
    unique: true
  });

  // ─── lims_locations ───────────────────────────────────────────────────────
  await queryInterface.createTable("lims_locations", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    location_id: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    location_name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    other_information: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "enabled" },
    location_type_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_phrase_entries", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    parent_location_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_locations", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    group_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_groups", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    ...softDeleteFields
  });
  await queryInterface.addIndex("lims_locations", ["parent_location_id"]);
  await queryInterface.addIndex("lims_locations", ["group_id"]);

  // lims_users.location_id could not be a foreign key until now.
  await queryInterface.addConstraint("lims_users", {
    fields: ["location_id"],
    type: "foreign key",
    name: "lims_users_location_id_fkey",
    references: { table: "lims_locations", field: "id" },
    onUpdate: "CASCADE",
    onDelete: "SET NULL"
  });
};
