import { QueryInterface } from "sequelize";

/** Each result's status. Existing values start as Report (Fail where already out of range);
 * a sample's Pass/Fail is worked out on its next save, so old records aren't re-judged here. */
export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(`
    ALTER TABLE public.lims_test_windows
      ADD COLUMN IF NOT EXISTS result_status character varying(20)
        NOT NULL DEFAULT 'Unentered';

    UPDATE public.lims_test_windows
       SET result_status = CASE WHEN out_of_range THEN 'Fail' ELSE 'Report' END
     WHERE value IS NOT NULL AND btrim(value) <> '';
  `);
};
