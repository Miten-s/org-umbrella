import { Op, Transaction } from "sequelize";
import AnalysisComponent from "../models/analysis-component.model";
import AuditLog from "../models/audit-log.model";
import Sample from "../models/sample.model";
import SpecLimit from "../models/spec-limit.model";
import Test from "../models/test.model";
import TestWindow from "../models/test-window.model";
import { ResultLimit, hasLimit, statusOf } from "../utils/result-check";

export interface RangeChange {
  testId: string;
  componentId: string;
  from: boolean;
  to: boolean;
}

type TestState = "Pass" | "Fail" | "Pending" | null;

const limitKey = (specId: string, analysisId: string, componentId: string) =>
  `${specId}|${analysisId}|${componentId}`;

/** Limits of these specifications by spec + template + component ID. A limit stores the
 * component's row id and a result its business ID, so the template's component links them. */
const loadLimits = async (specIds: string[], transaction?: Transaction) => {
  const limits = await SpecLimit.findAll({
    where: {
      specificationId: { [Op.in]: specIds },
      componentId: { [Op.ne]: null }
    },
    transaction
  });
  const components = await AnalysisComponent.findAll({
    where: { id: { [Op.in]: limits.map((limit) => limit.componentId!) } },
    attributes: ["id", "analysisId", "componentId"],
    transaction
  });
  const componentById = new Map(components.map((c) => [c.id, c]));
  const byKey = new Map<string, ResultLimit>();
  for (const limit of limits) {
    const component = componentById.get(limit.componentId!);
    if (component)
      byKey.set(
        limitKey(
          limit.specificationId,
          String(component.analysisId),
          String(component.componentId)
        ),
        limit.toJSON()
      );
  }
  return byKey;
};

/** Sets every result's status (and `outOfRange`), then Pass/Fail on its test and sample. A test
 * not in the sample's Specification is reported, not judged, however it was added. */
export const evaluateSamples = async (
  sampleIds: string[],
  transaction: Transaction
): Promise<RangeChange[]> => {
  const ids = [...new Set(sampleIds)];
  if (!ids.length) return [];
  const samples = await Sample.findAll({
    where: { id: { [Op.in]: ids } },
    attributes: ["id", "specificationId", "result"],
    transaction
  });
  const tests = await Test.findAll({
    where: {
      sampleId: { [Op.in]: ids },
      isDeleted: false,
      status: { [Op.ne]: "Cancelled" }
    },
    attributes: ["id", "sampleId", "analysisId", "result"],
    transaction
  });
  const rows = await TestWindow.findAll({
    where: { testId: { [Op.in]: tests.map((test) => test.id) } },
    attributes: [
      "id",
      "testId",
      "componentId",
      "componentType",
      "value",
      "outOfRange",
      "resultStatus"
    ],
    transaction
  });
  const rowsByTest = new Map<string, TestWindow[]>();
  rows.forEach((row) =>
    rowsByTest.set(row.testId!, [...(rowsByTest.get(row.testId!) ?? []), row])
  );
  const specIds = [
    ...new Set(samples.flatMap((s) => s.specificationId ?? []))
  ] as string[];
  const limits = specIds.length
    ? await loadLimits(specIds, transaction)
    : new Map<string, ResultLimit>();
  const specOf = new Map(samples.map((s) => [s.id, s.specificationId]));

  const changes: RangeChange[] = [];
  const statesBySample = new Map<string, TestState[]>();
  for (const test of tests) {
    const specId = specOf.get(test.sampleId!);
    let state: TestState = null;
    for (const row of rowsByTest.get(test.id) ?? []) {
      const limit = specId
        ? limits.get(
            limitKey(specId, String(test.analysisId), String(row.componentId))
          )
        : undefined;
      const status = statusOf(row.componentType, limit, row.value);
      const failed = status === "Fail";
      if (limit && hasLimit(row.componentType, limit)) {
        if (failed || state === "Fail") state = "Fail";
        else if (status === "Unentered" || state === "Pending")
          state = "Pending";
        else state = "Pass";
      }
      if (row.resultStatus !== status)
        await TestWindow.update(
          { resultStatus: status },
          { where: { id: row.id }, transaction }
        );
      if (Boolean(row.outOfRange) !== failed) {
        await TestWindow.update(
          { outOfRange: failed },
          { where: { id: row.id }, transaction }
        );
        changes.push({
          testId: test.id,
          componentId: String(row.componentId),
          from: Boolean(row.outOfRange),
          to: failed
        });
      }
    }
    const result = state === "Pass" || state === "Fail" ? state : null;
    if ((test.result ?? null) !== result)
      await Test.update({ result }, { where: { id: test.id }, transaction });
    const states = statesBySample.get(test.sampleId!) ?? [];
    states.push(state);
    statesBySample.set(test.sampleId!, states);
  }

  for (const sample of samples) {
    const states = statesBySample.get(sample.id) ?? [];
    // One failed component fails the sample. May become configurable per module later.
    const result = states.includes("Fail")
      ? "Fail"
      : !states.includes("Pending") && states.includes("Pass")
        ? "Pass"
        : null;
    if ((sample.result ?? null) !== result)
      await Sample.update(
        { result },
        { where: { id: sample.id }, transaction }
      );
  }
  return changes;
};

/** Evaluates after a save that goes through the CRUD layer, auditing what the check changed. */
export const evaluateAndAudit = async ({
  sampleId,
  actor,
  changeReason,
  transaction
}: {
  sampleId: string;
  actor: { id?: string; fullName?: string | null };
  changeReason?: string;
  transaction: Transaction;
}) => {
  const changes = await evaluateSamples([sampleId], transaction);
  const byTest = new Map<string, RangeChange[]>();
  changes.forEach((change) =>
    byTest.set(change.testId, [...(byTest.get(change.testId) ?? []), change])
  );
  if (!byTest.size) return;
  await AuditLog.bulkCreate(
    [...byTest].map(([testId, list]) => ({
      entityName: "Test",
      entityId: testId,
      action: "UPDATE",
      oldValue: null,
      newValue: null,
      childChanges: {
        components: {
          added: [],
          removed: [],
          changed: list.map((change) => ({
            key: change.componentId,
            from: { outOfRange: change.from },
            to: { outOfRange: change.to }
          }))
        }
      },
      changeReason: changeReason ?? "Checked against Specification limits",
      performedBy: actor.id,
      performedByName: actor.fullName ?? null
    })) as any[],
    { transaction }
  );
};
