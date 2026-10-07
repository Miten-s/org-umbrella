import { QueryInterface } from "sequelize";

/** Which Test Group a Specification limit was added through — a snapshot label, not a live link. */
export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(`
    ALTER TABLE public.lims_spec_limits ADD COLUMN IF NOT EXISTS source_test_group_id uuid;
  `);
};
