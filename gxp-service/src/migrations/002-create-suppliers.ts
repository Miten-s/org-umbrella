import { QueryInterface, DataTypes } from "sequelize";

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable("suppliers", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false
    },
    supplier_name: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    type_of_supplier: {
      type: DataTypes.STRING,
      allowNull: true
    },
    product: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "enabled"
    },
    created_on: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: true
    },
    modified_on: {
      type: DataTypes.DATE,
      allowNull: true
    },
    modified_by: {
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

  await queryInterface.addIndex("suppliers", ["supplier_name"], {
    unique: true,
    name: "suppliers_name_idx"
  });
};
