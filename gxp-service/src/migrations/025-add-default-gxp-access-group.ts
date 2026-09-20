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
        description:
          "Default group created when group-based scoping was introduced — every application/service request and user that existed at the time landed here. Not a real access boundary; pending a compliance-reviewed segmentation.",
        parent_group_id: null,
        status: "enabled",
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  }

  // ─── applications.access_group_id ─────────────────────────────────────────
  const applicationsTable = await queryInterface.describeTable("applications");
  if (!applicationsTable.access_group_id) {
    await queryInterface.addColumn("applications", "access_group_id", {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "gxp_groups", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
    await sequelize.query(
      `UPDATE applications SET access_group_id = :id WHERE access_group_id IS NULL`,
      { replacements: { id: unassignedGroupId } }
    );
    // NOT NULL with a default going forward — a newly created application should land in
    // Unassigned automatically too, not slip through ungrouped.
    await queryInterface.changeColumn("applications", "access_group_id", {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: unassignedGroupId,
      references: { model: "gxp_groups", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
  }

  // ─── service_requests.access_group_id ─────────────────────────────────────
  const serviceRequestsTable =
    await queryInterface.describeTable("service_requests");
  if (!serviceRequestsTable.access_group_id) {
    await queryInterface.addColumn("service_requests", "access_group_id", {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "gxp_groups", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
    await sequelize.query(
      `UPDATE service_requests SET access_group_id = :id WHERE access_group_id IS NULL`,
      { replacements: { id: unassignedGroupId } }
    );
    await queryInterface.changeColumn("service_requests", "access_group_id", {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: unassignedGroupId,
      references: { model: "gxp_groups", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
  }

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
