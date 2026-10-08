import { QueryInterface } from "sequelize";

/** Which Test Group a Test was assigned through — a snapshot label, not a live link. */
export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(`
    ALTER TABLE public.lims_tests ADD COLUMN IF NOT EXISTS source_test_group_id uuid;
    CREATE INDEX IF NOT EXISTS lims_tests_source_test_group_id
      ON public.lims_tests (source_test_group_id);
  `);
};
