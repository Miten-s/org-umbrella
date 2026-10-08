import { QueryInterface } from "sequelize";

/** A test's result rows carry their component's type, list and option (a snapshot taken at
 * assignment), so the value editor knows what to offer without looking up the template. */
export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(`
    ALTER TABLE public.lims_test_windows
      ADD COLUMN IF NOT EXISTS component_type character varying(50),
      ADD COLUMN IF NOT EXISTS component_list character varying(255),
      ADD COLUMN IF NOT EXISTS component_option character varying(255);

    UPDATE public.lims_test_windows w
       SET component_type = c.type,
           component_list = c.list,
           component_option = c.option
      FROM public.lims_tests t
      JOIN public.lims_analysis_components c ON c.analysis_id = t.analysis_id
     WHERE w.test_id = t.id
       AND c.component_id = w.component_id
       AND w.component_type IS NULL;
  `);
};
