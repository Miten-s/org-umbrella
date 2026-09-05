import { QueryInterface } from "sequelize";

/**
 * Service Requests had no enable/disable concept at all (unlike every other
 * gxp-service module) — `status` is the workflow status ("New"/"In Progress"/…),
 * not an active/inactive toggle, so a separate `record_status` column is added
 * to plug this module into the same bulk-restore shape as the rest.
 */
export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(
    `ALTER TABLE "service_requests" ADD COLUMN IF NOT EXISTS "record_status" VARCHAR(20) NOT NULL DEFAULT 'enabled';`
  );
};
