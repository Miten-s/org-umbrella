import { QueryInterface } from "sequelize";
import { randomUUID } from "crypto";
import { UNASSIGNED_GROUP_ID } from "./default-ids";

/** Reference data a fresh GXP database needs: the service request types and the default
 * "Unassigned" group (the initial schema's default group for new records). */

const REQUEST_TYPES = [
  "Provide Access",
  "Modify Access",
  "Remove Access",
  "Generate Report",
  "Add Master Data Request",
  "Edit Master Data Request",
  "Remove Master Data Request",
  "Other Request"
];

export const up = async (queryInterface: QueryInterface) => {
  const db = queryInterface.sequelize;

  for (const service of REQUEST_TYPES) {
    await db.query(
      `INSERT INTO app_services (id, service, active, created_at, updated_at)
       VALUES (:id, :service, true, now(), now())`,
      { replacements: { id: randomUUID(), service } }
    );
  }

  await db.query(
    `INSERT INTO gxp_groups (id, name, description, parent_group_id, status, created_at, updated_at)
     VALUES (:id, 'Unassigned', :description, NULL, 'enabled', now(), now())`,
    {
      replacements: {
        id: UNASSIGNED_GROUP_ID,
        description:
          "Default group for users and records not yet placed in a real group. Not an access boundary."
      }
    }
  );
};
