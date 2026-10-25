import { QueryInterface } from "sequelize";

/** A template can run more than once on a sample (Avg Wt/1, /2, /3) — each run is its own Test. */
export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(`
    ALTER TABLE public.lims_tests
      ADD COLUMN IF NOT EXISTS repeat_number integer NOT NULL DEFAULT 1;
    CREATE INDEX IF NOT EXISTS lims_tests_sample_analysis_repeat_idx
      ON public.lims_tests USING btree (sample_id, analysis_id, repeat_number);
  `);
};
