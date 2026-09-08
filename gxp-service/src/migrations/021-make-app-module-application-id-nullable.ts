import { QueryInterface } from "sequelize";

/**
 * A3: allow app_modules.application_id to be NULL so a module can be created
 * manually (from the Software Module screen) without an application. The FK to
 * applications stays (a nullable FK is fine); the application is set only via the
 * gxp-applications create flow.
 */
export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(
    `ALTER TABLE "app_modules" ALTER COLUMN "application_id" DROP NOT NULL;`
  );
};
