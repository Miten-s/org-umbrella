import { QueryInterface } from "sequelize";

/** Adds nullable `analysis_id`/`component_id` alongside the existing NAME columns, so the
 * Limits grid's picker can link a row without touching the rename-safe display names. */
export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(
    `ALTER TABLE lims_spec_limits ADD COLUMN IF NOT EXISTS analysis_id UUID NULL`
  );
  await queryInterface.sequelize.query(
    `ALTER TABLE lims_spec_limits ADD COLUMN IF NOT EXISTS component_id UUID NULL`
  );
};
