import { QueryInterface } from "sequelize";

/** Pass/Fail against the sample's Specification, set by the server when results are saved. */
export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(`
    ALTER TABLE public.lims_tests
      ADD COLUMN IF NOT EXISTS result character varying(10);
    ALTER TABLE public.lims_samples
      ADD COLUMN IF NOT EXISTS result character varying(10);
  `);
};
