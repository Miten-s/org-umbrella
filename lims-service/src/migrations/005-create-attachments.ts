import { QueryInterface, DataTypes } from "sequelize";

/** One polymorphic attachments table for every entity that takes files (`entity_name` +
 * `entity_id`), instead of ~12 identical join tables. No real FK — every entity is soft-deleted, so attachments stay reachable. */
export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable("lims_attachments", {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },

    // Catalogue entity code ("SAMPLE") + that row's UUID.
    entity_name: { type: DataTypes.STRING(50), allowNull: false },
    entity_id: { type: DataTypes.UUID, allowNull: false },

    /** Original name as uploaded — shown to the user. */
    file_name: { type: DataTypes.STRING(255), allowNull: false },
    /** Randomised name on disk; never derived from user input. */
    stored_name: { type: DataTypes.STRING(255), allowNull: false },
    mime_type: { type: DataTypes.STRING(150), allowNull: true },
    size_bytes: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },

    /** The "with comments" half of the spec's attachment field. */
    comment: { type: DataTypes.TEXT, allowNull: true },

    uploaded_by: { type: DataTypes.STRING(100), allowNull: true },
    uploaded_by_name: { type: DataTypes.STRING(200), allowNull: true },

    // Denormalised from the parent so attachment lists can be group-filtered
    // without a polymorphic join back to a table only known at runtime.
    group_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "lims_groups", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },

    is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    deleted_by: { type: DataTypes.STRING(100), allowNull: true },
    modified_by: { type: DataTypes.STRING(100), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });

  // The only lookup that matters: "every attachment on this record".
  await queryInterface.addIndex("lims_attachments", ["entity_name", "entity_id"], {
    name: "lims_attachments_owner_idx"
  });
  await queryInterface.addIndex("lims_attachments", ["group_id"]);
};
