import { QueryInterface } from "sequelize";

/** A Test Group row becomes just a link to a Test Template (Analysis). Existing rows are
 * linked by matching their free-text test name to an Analysis ID or name; rows that match
 * nothing can't be expressed in the new shape and are removed. The instrument/replicate
 * columns go too — those belong to the method and to execution, not to the group. */
export const up = async (queryInterface: QueryInterface) => {
  const db = queryInterface.sequelize;

  await db.query(`
    ALTER TABLE lims_test_group_items
      ADD COLUMN IF NOT EXISTS analysis_id UUID NULL
        REFERENCES lims_analyses(id) ON UPDATE CASCADE ON DELETE CASCADE
  `);

  // An exact Analysis ID match wins over a name match; ties go to the oldest analysis.
  await db.query(`
    UPDATE lims_test_group_items i
       SET analysis_id = (
         SELECT a.id FROM lims_analyses a
          WHERE a.is_deleted = false
            AND (lower(a.analysis_id) = lower(trim(i.test_name))
                 OR lower(a.name) = lower(trim(i.test_name)))
          ORDER BY (lower(a.analysis_id) = lower(trim(i.test_name))) DESC, a.created_at
          LIMIT 1)
     WHERE i.analysis_id IS NULL AND i.test_name IS NOT NULL
  `);

  await db.query(`DELETE FROM lims_test_group_items WHERE analysis_id IS NULL`);

  // Two rows that resolved to the same template in one group collapse to the first.
  await db.query(`
    DELETE FROM lims_test_group_items i
     USING lims_test_group_items keep
     WHERE i.test_group_id = keep.test_group_id
       AND i.analysis_id = keep.analysis_id
       AND (COALESCE(keep.sort_order, 0), keep.created_at, keep.id)
         < (COALESCE(i.sort_order, 0), i.created_at, i.id)
  `);

  await db.query(
    `ALTER TABLE lims_test_group_items ALTER COLUMN analysis_id SET NOT NULL`
  );
  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS lims_test_group_items_group_analysis_uq
      ON lims_test_group_items (test_group_id, analysis_id)
  `);

  await db.query(`
    ALTER TABLE lims_test_group_items
      DROP COLUMN IF EXISTS test_name,
      DROP COLUMN IF EXISTS instrument_category,
      DROP COLUMN IF EXISTS instrument_type,
      DROP COLUMN IF EXISTS instrument_id,
      DROP COLUMN IF EXISTS replicate_count
  `);
};
