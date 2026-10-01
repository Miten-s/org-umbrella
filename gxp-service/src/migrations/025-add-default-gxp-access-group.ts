import { QueryInterface, DataTypes, QueryTypes } from "sequelize";
import { randomUUID } from "crypto";

const UNASSIGNED_GROUP_NAME = "Unassigned";

/** Turns on group-based scoping for applications/service_requests as a no-op for current
 * behavior: everything that exists today — every row, every user — lands in one default
 * group, so nothing anyone can currently see becomes invisible the moment this ships. Real
 * segmentation (multiple groups reflecting actual access boundaries) is a deliberately
 * separate, later phase, once compliance has confirmed what those boundaries should be.
 *
 * Column is named `access_group_id`, not `group_id` — `applications.group` already exists
 * and holds an unrelated location id; reusing "group" here would collide with it. */
export const up = async (queryInterface: QueryInterface) => {
  const sequelize = queryInterface.sequelize;

  // ─── The one default group ─────────────────────────────────────────────────
  const existingGroup = await sequelize.query<{ id: string }>(
    `SELECT id FROM gxp_groups WHERE name = :name LIMIT 1`,
    { replacements: { name: UNASSIGNED_GROUP_NAME }, type: QueryTypes.SELECT }
  );

  const unassignedGroupId = existingGroup[0]?.id ?? randomUUID();

  if (!existingGroup[0]) {
    await queryInterface.bulkInsert("gxp_groups", [
      {
        id: unassignedGroupId,
        name: UNASSIGNED_GROUP_NAME,
        // gxp_groups.description is STRING(200) — keep this within it.
        description:
          "Default group from when group scoping was introduced: every application, service request and user that existed then landed here. Not a real access boundary.",
        parent_group_id: null,
        status: "enabled",
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  }

  // ─── applications / service_requests .access_group_id ─────────────────────
  // Every step is safe to repeat: this runner does not wrap a migration in a transaction,
  // so a failure part-way must be recoverable by simply running it again.
  const scopeTable = async (table: "applications" | "service_requests") => {
    const columns = await queryInterface.describeTable(table);
    if (!columns.access_group_id) {
      // RESTRICT, not SET NULL: the column ends up NOT NULL, so a group that still has
      // records cannot be deleted either way — this just says so honestly.
      await queryInterface.addColumn(table, "access_group_id", {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "gxp_groups", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      });
    }

    await sequelize.query(
      `UPDATE ${table} SET access_group_id = :id WHERE access_group_id IS NULL`,
      { replacements: { id: unassignedGroupId } }
    );

    // NOT NULL with a default going forward — a newly created record should land in
    // Unassigned automatically too, not slip through ungrouped. Plain SQL rather than
    // changeColumn: with a default and `references` together, Sequelize emits invalid
    // SQL on Postgres ('syntax error at or near "REFERENCES"').
    await sequelize.query(
      `ALTER TABLE ${table} ALTER COLUMN access_group_id SET DEFAULT :id`,
      { replacements: { id: unassignedGroupId } }
    );
    await sequelize.query(
      `ALTER TABLE ${table} ALTER COLUMN access_group_id SET NOT NULL`
    );
  };

  await scopeTable("applications");
  await scopeTable("service_requests");

  // ─── every existing gxp user: home group + explicit access grant ──────────
  await sequelize.query(
    `UPDATE gxp_users SET group_id = :id WHERE group_id IS NULL`,
    { replacements: { id: unassignedGroupId } }
  );

  const gxpUsers = await sequelize.query<{ id: string }>(
    `SELECT id FROM gxp_users`,
    { type: QueryTypes.SELECT }
  );

  if (gxpUsers.length > 0) {
    const now = new Date();
    const values = gxpUsers
      .map((_, i) => `(:memberId${i}, :gxpUserId${i}, :groupId, :now, :now)`)
      .join(", ");
    const replacements: Record<string, unknown> = {
      groupId: unassignedGroupId,
      now
    };
    gxpUsers.forEach((user, i) => {
      replacements[`memberId${i}`] = randomUUID();
      replacements[`gxpUserId${i}`] = user.id;
    });

    // ON CONFLICT DO NOTHING relies on the unique (gxp_user_id, group_id) index created in
    // migration 024 — safe to re-run against a user who's already explicitly in this group.
    await sequelize.query(
      `INSERT INTO gxp_user_access_groups (id, gxp_user_id, group_id, created_at, updated_at)
       VALUES ${values}
       ON CONFLICT (gxp_user_id, group_id) DO NOTHING`,
      { replacements }
    );
  }
};
