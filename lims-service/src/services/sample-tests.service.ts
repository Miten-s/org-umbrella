import { Op, Transaction } from "sequelize";
import Analysis from "../models/analysis.model";
import AnalysisComponent from "../models/analysis-component.model";
import PhraseEntry from "../models/phrase-entry.model";
import Test from "../models/test.model";
import TestWindow from "../models/test-window.model";
import { applyBusinessId } from "../utils/business-id";
import { writeAudit } from "../utils/audit.util";
import { APPROVED_ENTRY_KEY } from "../utils/approval-status";
import { TEST_BUSINESS_ID } from "../configs/business-ids";
import type { CrudContext } from "../utils/crud-factory";

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
  const requested: string[] = Array.isArray(payload.testTemplates)
    ? [...new Set<string>(payload.testTemplates.filter(Boolean))]
    : [];
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

  for (const id of toAdd) {
    const analysis = byId.get(id)!;
    const data = await applyBusinessId(
      Test,
      "TEST",
      TEST_BUSINESS_ID,
      {
        testName: analysis.name,
        sampleId: record.id,
        analysisId: analysis.id,
        groupId: record.groupId ?? null,
        loginDate: record.loginDate ?? null,
        loginBy: record.loginBy ?? null,
        status: "Open"
      },
      transaction
    );
    const test = await Test.create(data as any, { transaction });

    const components = [
      ...(((analysis as any).components ?? []) as AnalysisComponent[])
    ].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const rows = await TestWindow.bulkCreate(
      components.map((component) => ({
        sampleId: record.id,
        testId: test.id,
        analysisName: analysis.name,
        componentId: component.componentId,
        componentName: component.name,
        description: component.description,
        unit: component.unit
      })) as any[],
      { transaction }
    );

    await writeAudit({
      entityName: "Test",
      entityId: test.id,
      action: "CREATE",
      newValue: {
        ...test.toJSON(),
        components: rows.map((row) => row.toJSON())
      },
      changeReason: `Assigned to sample ${record.sampleId ?? ""}`.trim(),
      actor: ctx.actor,
      transaction
    });
  }
};
