import { QueryInterface } from "sequelize";

/**
 * `lims_spec_limits` stored Analysis/Component by NAME only, so a limit row
 * could be typed freely with no link back to the real Analysis Component it
 * meant. Adding nullable `analysis_id`/`component_id` alongside the existing
 * name columns lets the Limits grid's picker (see LimsSpecificationForm)
 * populate min/max/etc. from a real Analysis and mark that row read-only —
 * without touching `analysis_name`/`component_name`, which stay the
 * source of truth for display so a spec is still readable if the Analysis or
 * Component is later renamed (a manually-typed row, with no picker
 * selection, simply leaves these two columns null).
 */
export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(
    `ALTER TABLE lims_spec_limits ADD COLUMN IF NOT EXISTS analysis_id UUID NULL`
  );
  await queryInterface.sequelize.query(
    `ALTER TABLE lims_spec_limits ADD COLUMN IF NOT EXISTS component_id UUID NULL`
  );
};
