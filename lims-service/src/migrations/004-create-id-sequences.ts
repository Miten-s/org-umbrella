import { QueryInterface, DataTypes } from "sequelize";

/**
 * Business-ID counters.
 *
 * Every entity carries a human-readable business ID (`LOC-000001`) alongside
 * its UUID primary key. One row per entity holds the last number issued; the
 * next one is taken with a single `UPDATE ... RETURNING`, which is atomic, so
 * two concurrent creates can never be handed the same number.
 *
 * A counter table rather than one Postgres sequence per entity: sequences
 * would need DDL to add an entity, and the dynamic-table feature in the spec
 * ("create any database table from the frontend") means entities will be added
 * at runtime, when DDL is exactly what we won't want to run.
 */
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
