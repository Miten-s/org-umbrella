import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable("lims_phrases", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_system: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    group_id: {
      type: DataTypes.UUID,
      allowNull: true // Null means global (e.g. system phrases)
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deleted_by: {
      type: DataTypes.UUID,
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

  await queryInterface.createTable("lims_phrase_entries", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    phrase_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "lims_phrases",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    entry_key: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    entry_value: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    is_system: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
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

  await queryInterface.addIndex("lims_phrase_entries", ["phrase_id"]);
  await queryInterface.addIndex("lims_phrase_entries", ["phrase_id", "entry_key"], {
    name: "lims_phrase_entry_unique_idx",
    unique: true,
    where: {
      is_deleted: false
    }
  });
};
