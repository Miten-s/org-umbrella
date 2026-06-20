import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable("users", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    user_type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "User"
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "active"
    },
    current_language: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "en"
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    department_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "departments",
        key: "id"
      },
      onDelete: "SET NULL"
    },
    designation_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "designations",
        key: "id"
      },
      onDelete: "SET NULL"
    },
    location_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "locations",
        key: "id"
      },
      onDelete: "SET NULL"
    },
    manager_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id"
      },
      onDelete: "SET NULL"
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id"
      },
      onDelete: "SET NULL"
    },
    modified_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id"
      },
      onDelete: "SET NULL"
    },
    modifiable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    training_completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    password_expiry_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    signature: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    modified_on: {
      type: DataTypes.DATE,
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

  await queryInterface.addIndex("users", ["email"], {
    unique: true,
    name: "users_email_idx"
  });
};
