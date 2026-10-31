import { Op, Transaction } from "sequelize";
import Analysis from "../models/analysis.model";
import AnalysisComponent from "../models/analysis-component.model";
import PhraseEntry from "../models/phrase-entry.model";
import Test from "../models/test.model";
import TestWindow from "../models/test-window.model";
import { nextBusinessIds } from "../utils/business-id";
import AuditLog from "../models/audit-log.model";
import { APPROVED_ENTRY_KEY } from "../utils/approval-status";
import { TEST_BUSINESS_ID } from "../configs/business-ids";
import type { CrudContext } from "../utils/crud-factory";
import { computeCalculations } from "../utils/formula";
import { typeProblem } from "../utils/result-check";

/** Keeps each multi-row INSERT well under Postgres' 65,535 bind-parameter limit. */
const CHUNK = 1000;
const chunks = <T>(items: T[]): T[][] =>
  Array.from({ length: Math.ceil(items.length / CHUNK) }, (_, i) =>
    items.slice(i * CHUNK, (i + 1) * CHUNK)
  );

const textOrNull = (value: unknown) =>
  value === undefined || value === null || String(value).trim() === ""
    ? null
    : String(value);

const reject = (message: string) =>
  Object.assign(new Error(message), { statusCode: 400 });

/**
 * Creates one Test per (Test Template, repeat number) in `payload.testTemplates`, each with a
 * pending result row per component — a snapshot at login, so later template edits don't touch
 * this sample. A run already on the sample (and not cancelled) is skipped, so re-sending the
 * list on edit is harmless. Runs in the sample's own transaction: all-or-nothing.
 */
export const assignSampleTests = async ({
  record,
  payload,
  ctx,
  transaction
}: {
  record: Record<string, any>;
  payload: Record<string, any>;
  ctx: CrudContext;
  transaction: Transaction;
}) => {
  // One slot per run; first occurrence wins, so a run picked through two groups keeps the first.
  const slotOf = (analysisId: string, repeat: unknown) =>
    `${analysisId}#${Number(repeat) > 1 ? Number(repeat) : 1}`;
  const requests = new Map<
    string,
    {
      analysisId: string;
      repeatNumber: number;
      sourceTestGroupId: string | null;
      values?: Record<string, unknown>;
    }
  >();
  for (const item of Array.isArray(payload.testTemplates)
    ? payload.testTemplates
    : []) {
    if (!item?.analysisId) continue;
    const slot = slotOf(item.analysisId, item.repeatNumber);
    if (requests.has(slot)) continue;
    requests.set(slot, {
      analysisId: item.analysisId,
      repeatNumber: Number(slot.split("#")[1]),
      sourceTestGroupId: item.sourceTestGroupId ?? null,
      values:
        item.values && typeof item.values === "object" ? item.values : undefined
    });
  }
  if (!requests.size) return;
  const requestedIds = [
    ...new Set([...requests.values()].map((r) => r.analysisId))
  ];

  const already = new Set(
    (
      await Test.findAll({
        where: {
          sampleId: record.id,
          analysisId: { [Op.in]: requestedIds },
          isDeleted: false,
          status: { [Op.ne]: "Cancelled" }
        },
        attributes: ["analysisId", "repeatNumber"],
        transaction
      })
    ).map((test) => slotOf(test.analysisId!, test.repeatNumber))
  );
  const toAdd = [...requests]
    .filter(([slot]) => !already.has(slot))
    .map(([, request]) => request);
  if (!toAdd.length) return;
  const toAddIds = [...new Set(toAdd.map((r) => r.analysisId))];

  const analyses = await Analysis.findAll({
    where: { id: { [Op.in]: toAddIds }, isDeleted: false },
    include: [
      {
        model: PhraseEntry,
        as: "approvalStatus",
        attributes: ["phraseEntryId"],
        required: false
      },
      { model: AnalysisComponent, as: "components", required: false }
    ],
    transaction
  });
  const byId = new Map(analyses.map((a) => [a.id, a]));

  for (const id of toAddIds) {
    const analysis = byId.get(id);
    if (!analysis) throw reject("A selected Test Template no longer exists.");
    if ((analysis as any).approvalStatus?.phraseEntryId !== APPROVED_ENTRY_KEY)
      throw reject(
        `"${analysis.name}" is not an Approved Test Template — only Approved templates can be assigned.`
      );
  }

  // Batched — a sample can get thousands of tests from hundreds of groups in one save.
  const testIds = await nextBusinessIds(
    Test,
    "TEST",
    TEST_BUSINESS_ID,
    toAdd.length,
    transaction
  );
  const tests = await Test.bulkCreate(
    toAdd.map((request, index) => ({
      testId: testIds[index],
      testName: byId.get(request.analysisId)!.name,
      sampleId: record.id,
      analysisId: request.analysisId,
      repeatNumber: request.repeatNumber,
      sourceTestGroupId: request.sourceTestGroupId,
      groupId: record.groupId ?? null,
      loginDate: record.loginDate ?? null,
      loginBy: record.loginBy ?? null,
      status: "Open"
    })) as any[],
    { transaction, returning: true }
  );

  const rowsByTest = new Map<string, TestWindow[]>();
  const pendingRows = tests.flatMap((test) => {
    const analysis = byId.get(test.analysisId!)!;
    return [...(((analysis as any).components ?? []) as AnalysisComponent[])]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((component) => ({
        sampleId: record.id,
        testId: test.id,
        analysisName: analysis.name,
        componentId: component.componentId,
        componentName: component.name,
        description: component.description,
        unit: component.unit,
        // Values typed on the bulk page before this test existed.
        value: textOrNull(
          requests.get(slotOf(analysis.id, test.repeatNumber))?.values?.[
            String(component.componentId)
          ]
        ),
        componentType: component.type,
        componentList: component.list,
        componentOption: component.option,
        componentFormula: component.formula
      }));
  });
  for (const row of pendingRows) {
    const problem = typeProblem(row.componentType, row.value);
    if (problem) throw reject(`${row.componentName}: ${problem}`);
  }
  // Values typed before the test existed can already feed its Calculations.
  const pendingByTest = new Map<string, typeof pendingRows>();
  pendingRows.forEach((row) =>
    pendingByTest.set(row.testId, [
      ...(pendingByTest.get(row.testId) ?? []),
      row
    ])
  );
  for (const testRows of pendingByTest.values()) {
    const computed = computeCalculations(testRows);
    for (const row of testRows)
      if (row.componentType === "CALCULATION")
        row.value = computed.get(String(row.componentId)) || null;
  }
  for (const chunk of chunks(pendingRows)) {
    for (const row of await TestWindow.bulkCreate(chunk as any[], {
      transaction,
      returning: true
    })) {
      const list = rowsByTest.get(row.testId!) ?? [];
      list.push(row);
      rowsByTest.set(row.testId!, list);
    }
  }

  const changeReason = `Assigned to sample ${record.sampleId ?? ""}`.trim();
  for (const chunk of chunks(tests)) {
    await AuditLog.bulkCreate(
      chunk.map((test) => ({
        entityName: "Test",
        entityId: test.id,
        action: "CREATE",
        oldValue: null,
        newValue: {
          ...test.toJSON(),
          components: (rowsByTest.get(test.id) ?? []).map((row) => row.toJSON())
        },
        childChanges: null,
        changeReason,
        performedBy: ctx.actor.id,
        performedByName: ctx.actor.fullName ?? null
      })) as any[],
      { transaction }
    );
  }
};
