import { QueryInterface, QueryTypes } from "sequelize";
import { computeCalculations } from "../utils/formula";

/** Test rows snapshot their Calculation formula like 006 did for type/list/option, then every
 * existing test with a Calculation gets its results computed. */
export const up = async (queryInterface: QueryInterface) => {
  const db = queryInterface.sequelize;
  await db.query(`
    ALTER TABLE public.lims_test_windows
      ADD COLUMN IF NOT EXISTS component_formula text;

    UPDATE public.lims_test_windows w
       SET component_formula = c.formula
      FROM public.lims_tests t
      JOIN public.lims_analysis_components c ON c.analysis_id = t.analysis_id
     WHERE w.test_id = t.id
       AND c.component_id = w.component_id
       AND w.component_type = 'CALCULATION'
       AND w.component_formula IS NULL;
  `);

  const tests = await db.query<{ test_id: string }>(
    `SELECT DISTINCT test_id FROM lims_test_windows
      WHERE component_type = 'CALCULATION' AND test_id IS NOT NULL`,
    { type: QueryTypes.SELECT }
  );
  for (let i = 0; i < tests.length; i += 500) {
    const ids = tests.slice(i, i + 500).map((t) => t.test_id);
    const rows = await db.query<{
      id: string;
      test_id: string;
      component_id: string;
      component_type: string;
      component_formula: string | null;
      value: string | null;
    }>(
      `SELECT id, test_id, component_id, component_type, component_formula, value
         FROM lims_test_windows WHERE test_id IN (:ids)`,
      { replacements: { ids }, type: QueryTypes.SELECT }
    );
    const byTest = new Map<string, typeof rows>();
    rows.forEach((row) =>
      byTest.set(row.test_id, [...(byTest.get(row.test_id) ?? []), row])
    );
    for (const testRows of byTest.values()) {
      const computed = computeCalculations(
        testRows.map((row) => ({
          componentId: row.component_id,
          componentType: row.component_type,
          componentFormula: row.component_formula,
          value: row.value
        }))
      );
      for (const row of testRows) {
        if (row.component_type !== "CALCULATION") continue;
        const next = computed.get(row.component_id) || null;
        if ((row.value ?? null) === next) continue;
        await db.query(
          `UPDATE lims_test_windows SET value = :next WHERE id = :id`,
          { replacements: { next, id: row.id } }
        );
      }
    }
  }
};
