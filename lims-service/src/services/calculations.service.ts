import { Op, Transaction } from "sequelize";
import TestWindow from "../models/test-window.model";
import { computeCalculations } from "../utils/formula";
import { typeProblem } from "../utils/result-check";
import type { CrudContext } from "../utils/crud-factory";
import { entityPickLabel } from "./entity-records.service";

export interface ComputedChange {
  testId: string;
  componentId: string;
  from: string | null;
  to: string | null;
}

/** Recomputes every Calculation row of these tests from their saved inputs and writes the ones
 * that changed. Returns those changes so the caller can audit them with the edit that caused them. */
export const recomputeTests = async (
  testIds: string[],
  transaction: Transaction
): Promise<ComputedChange[]> => {
  if (!testIds.length) return [];
  const rows = await TestWindow.findAll({
    where: { testId: { [Op.in]: testIds } },
    attributes: [
      "id",
      "testId",
      "componentId",
      "componentType",
      "componentFormula",
      "value"
    ],
    transaction
  });
  const byTest = new Map<string, TestWindow[]>();
  rows.forEach((row) =>
    byTest.set(row.testId!, [...(byTest.get(row.testId!) ?? []), row])
  );

  const changes: ComputedChange[] = [];
  for (const [testId, testRows] of byTest) {
    if (!testRows.some((row) => row.componentType === "CALCULATION")) continue;
    const computed = computeCalculations(testRows.map((row) => row.toJSON()));
    for (const row of testRows) {
      if (row.componentType !== "CALCULATION") continue;
      const next = computed.get(String(row.componentId)) || null;
      const before = row.value ?? null;
      if (before === next) continue;
      await TestWindow.update(
        { value: next },
        { where: { id: row.id }, transaction }
      );
      changes.push({
        testId,
        componentId: String(row.componentId),
        from: before,
        to: next
      });
    }
  }
  return changes;
};

/** Test form saves: fills each Calculation row's value from the submitted inputs, using the
 * stored rows' type/formula snapshot (the form doesn't send those). */
export const withComputedCalculations = async (
  payload: Record<string, any>,
  transaction: Transaction,
  existing?: { get: (key: string) => unknown },
  ctx?: CrudContext
) => {
  if (!Array.isArray(payload.components) || !existing) return payload;
  const stored = ((existing.get("components") as TestWindow[]) ?? []).map(
    (row) => (row.toJSON ? row.toJSON() : row) as Record<string, any>
  );
  const snapshot = new Map(stored.map((row) => [String(row.componentId), row]));
  const rows: Record<string, any>[] = payload.components.map(
    (row: Record<string, any>) => {
      const saved = snapshot.get(String(row.componentId));
      return {
        ...row,
        componentType: saved?.componentType,
        componentFormula: saved?.componentFormula,
        componentEntityTemplateId: saved?.componentEntityTemplateId
      };
    }
  );
  for (const row of rows) {
    const problem = typeProblem(row.componentType, row.value);
    if (problem)
      throw Object.assign(new Error(`${row.componentName}: ${problem}`), {
        statusCode: 400
      });
  }
  const labels = new Map<string, string | null>();
  for (const row of rows) {
    if (row.componentType !== "ENTITY" || !ctx) continue;
    const saved = snapshot.get(String(row.componentId));
    labels.set(
      String(row.componentId),
      (row.value ?? null) === (saved?.value ?? null)
        ? (saved?.valueLabel ?? null)
        : await entityPickLabel(row, row.value, ctx.scope, transaction)
    );
  }
  const computed = computeCalculations(rows);
  return {
    ...payload,
    components: payload.components.map((row: Record<string, any>) => {
      const key = String(row.componentId);
      if (snapshot.get(key)?.componentType === "CALCULATION")
        return { ...row, value: computed.get(key) || null };
      return labels.has(key) ? { ...row, valueLabel: labels.get(key) } : row;
    })
  };
};
