import { QueryInterface, QueryTypes } from "sequelize";

const UNASSIGNED_GROUP_NAME = "Unassigned";

/** Migration 025 put every existing GXP user in "Unassigned", but users created after it
 * were left with no home group. This fills those in and makes "Unassigned" the column's
 * default, so every way of creating a user is covered. Safe to re-run. */
export const up = async (queryInterface: QueryInterface) => {
  const sequelize = queryInterface.sequelize;

  const [group] = await sequelize.query<{ id: string }>(
    `SELECT id FROM gxp_groups WHERE name = :name LIMIT 1`,
    { replacements: { name: UNASSIGNED_GROUP_NAME }, type: QueryTypes.SELECT }
  );
  if (!group) {
    throw new Error(
      `Group "${UNASSIGNED_GROUP_NAME}" not found — migration 025 must run first.`
    );
  }

  await sequelize.query(
    `UPDATE gxp_users SET group_id = :id WHERE group_id IS NULL`,
    { replacements: { id: group.id } }
  );
  await sequelize.query(
    `ALTER TABLE gxp_users ALTER COLUMN group_id SET DEFAULT :id`,
    { replacements: { id: group.id } }
  );
};
