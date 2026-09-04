import { QueryInterface, DataTypes } from "sequelize";

/** Business-ID counters: one row per entity, atomic `UPDATE ... RETURNING` for the next
 * number. A counter table, not a Postgres sequence per entity — entities can be added at runtime. */
export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable("lims_id_sequences", {
    // The permission-catalogue entity code, e.g. "LOCATION".
    entity: { type: DataTypes.STRING(50), primaryKey: true },
    prefix: { type: DataTypes.STRING(10), allowNull: false },
    last_value: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
};
