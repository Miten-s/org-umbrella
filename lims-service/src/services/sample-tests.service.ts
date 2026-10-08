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
 * Creates one Test per Test Template in `payload.testTemplates`, each with a pending result
 * row per component — a snapshot at login, so later template edits don't touch this sample.
 * A template already tested on the sample (and not cancelled) is skipped, so re-sending the
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
  // First occurrence wins, so a template picked through two groups keeps the first one.
  const sourceGroupOf = new Map<string, string | null>();
  const valuesOf = new Map<string, Record<string, unknown>>();
  for (const item of Array.isArray(payload.testTemplates)
    ? payload.testTemplates
    : []) {
    if (item?.analysisId && !sourceGroupOf.has(item.analysisId)) {
      sourceGroupOf.set(item.analysisId, item.sourceTestGroupId ?? null);
      if (item.values && typeof item.values === "object")
        valuesOf.set(item.analysisId, item.values);
    }
  }
  const requested = [...sourceGroupOf.keys()];
  if (!requested.length) return;

  const already = new Set(
    (
      await Test.findAll({
        where: {
          sampleId: record.id,
          analysisId: { [Op.in]: requested },
          isDeleted: false,
          status: { [Op.ne]: "Cancelled" }
        },
        attributes: ["analysisId"],
        transaction
      })
    ).map((test) => test.analysisId)
  );
  const toAdd = requested.filter((id) => !already.has(id));
  if (!toAdd.length) return;

  const analyses = await Analysis.findAll({
    where: { id: { [Op.in]: toAdd }, isDeleted: false },
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

  for (const id of toAdd) {
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
    toAdd.map((id, index) => ({
      testId: testIds[index],
      testName: byId.get(id)!.name,
      sampleId: record.id,
      analysisId: id,
      sourceTestGroupId: sourceGroupOf.get(id) ?? null,
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
          valuesOf.get(analysis.id)?.[String(component.componentId)]
        ),
        componentType: component.type,
        componentList: component.list,
        componentOption: component.option
      }));
  });
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
