import { Request, Response } from "express";
import { Op } from "sequelize";
import asyncHandler from "../middlewares/error.middleware";
import { sequelize } from "../configs/db.sequelize";
import AuditLog from "../models/audit-log.model";
import Instrument from "../models/instrument.model";
import Sample from "../models/sample.model";
import Test from "../models/test.model";
import TestWindow from "../models/test-window.model";
import { contextFromRequest, groupWhere } from "../utils/crud-factory";
import type {
  BulkComponentChangesDto,
  SampleComponentsQueryDto
} from "../dtos/execution.dto";

const EDITABLE = [
  "value",
  "unit",
  "outOfRange",
  "enteredOn",
  "enteredBy",
  "instrumentId"
] as const;

/** Keeps each multi-row statement well under Postgres' 65,535 bind-parameter limit. */
const CHUNK = 1000;
const chunks = <T>(items: T[]): T[][] =>
  Array.from({ length: Math.ceil(items.length / CHUNK) }, (_, i) =>
    items.slice(i * CHUNK, (i + 1) * CHUNK)
  );

/** Every test component row of the given samples — the bulk page's components grid. */
export const listSampleComponents = asyncHandler(
  async (req: Request, res: Response) => {
    const { sampleIds } = req.body as SampleComponentsQueryDto;
    const { scope } = contextFromRequest(req);
    const samples = await Sample.findAll({
      where: {
        id: { [Op.in]: sampleIds },
        isDeleted: false,
        ...groupWhere(Sample, scope)
      } as any,
      attributes: ["id", "sampleId", "sampleName"]
    });
    const visible = samples.map((sample) => sample.id);

    const rows = visible.length
      ? await TestWindow.findAll({
          where: { sampleId: { [Op.in]: visible }, testId: { [Op.ne]: null } },
          attributes: [
            "id",
            "sampleId",
            "testId",
            "analysisName",
            "componentId",
            "componentName",
            "value",
            "unit",
            "componentType",
            "componentList",
            "componentOption",
            "outOfRange",
            "enteredOn",
            "enteredBy",
            "instrumentId"
          ],
          include: [
            {
              model: Test,
              as: "test",
              attributes: ["testId", "status", "analysisId"],
              where: { isDeleted: false },
              required: true
            },
            {
              model: Instrument,
              as: "instrument",
              attributes: ["name"],
              required: false
            }
          ],
          order: [
            ["sampleId", "ASC"],
            ["testId", "ASC"],
            ["componentId", "ASC"]
          ]
        })
      : [];

    res.status(200).json({
      samples: samples.map((sample) => ({
        id: sample.id,
        sampleId: sample.sampleId,
        sampleName: sample.sampleName
      })),
      data: rows.map((row) => {
        const plain = row.toJSON() as Record<string, any>;
        return {
          id: plain.id,
          sampleId: plain.sampleId,
          testUuid: plain.testId,
          testId: plain.test?.testId,
          testStatus: plain.test?.status,
          analysisId: plain.test?.analysisId,
          analysisName: plain.analysisName,
          componentId: plain.componentId,
          componentName: plain.componentName,
          value: plain.value,
          unit: plain.unit,
          componentType: plain.componentType,
          componentList: plain.componentList,
          componentOption: plain.componentOption,
          outOfRange: plain.outOfRange,
          enteredOn: plain.enteredOn,
          enteredBy: plain.enteredBy,
          instrumentId: plain.instrumentId,
          instrumentName: plain.instrument?.name ?? null
        };
      })
    });
  }
);

const reject = (res: Response, status: number, message: string) =>
  res.status(status).json({ message });

/** Saves edited component cells across many tests in one transaction, with one audit entry
 * per affected test — the same record a single test's component edit leaves. */
export const saveComponentChanges = asyncHandler(
  async (req: Request, res: Response) => {
    const { changes, changeReason } = req.body as BulkComponentChangesDto;
    const { scope, actor } = contextFromRequest(req);
    if (!changes.length) return res.status(200).json({ count: 0 });

    const ids = [...new Set(changes.map((change) => change.id))];
    const rows = (
      await Promise.all(
        chunks(ids).map((part) =>
          TestWindow.findAll({
            where: { id: { [Op.in]: part }, testId: { [Op.ne]: null } }
          })
        )
      )
    ).flat();
    if (rows.length !== ids.length)
      return reject(
        res,
        400,
        "Some components no longer exist — reload the page."
      );

    const testIds = [...new Set(rows.map((row) => row.testId!))];
    const tests = await Test.findAll({
      where: {
        id: { [Op.in]: testIds },
        isDeleted: false,
        ...groupWhere(Test, scope)
      } as any,
      attributes: ["id", "testId", "status"]
    });
    const testById = new Map(tests.map((test) => [test.id, test]));
    if (testById.size !== testIds.length)
      return reject(
        res,
        403,
        "Some components belong to tests outside your groups."
      );
    const cancelled = tests.find((test) => test.status === "Cancelled");
    if (cancelled)
      return reject(
        res,
        400,
        `${cancelled.testId} is cancelled — its components can't be changed.`
      );

    const rowById = new Map(rows.map((row) => [row.id, row]));
    const deltas = new Map<string, Record<string, any>[]>();
    let updated = 0;

    await sequelize.transaction(async (transaction) => {
      for (const change of changes) {
        const row = rowById.get(change.id)!;
        const patch: Record<string, unknown> = {};
        const from: Record<string, unknown> = {};
        for (const key of EDITABLE) {
          if (!(key in change)) continue;
          const next = (change as any)[key] ?? null;
          const before = row.get(key) ?? null;
          const same =
            key === "enteredOn"
              ? String(
                  before
                    ? new Date(before as any).toISOString().slice(0, 10)
                    : ""
                ) === String(next ? String(next).slice(0, 10) : "")
              : before === next;
          if (same) continue;
          patch[key] = key === "outOfRange" ? Boolean(next) : next;
          from[key] = before;
        }
        if (!Object.keys(patch).length) continue;
        await TestWindow.update(patch as any, {
          where: { id: row.id },
          transaction
        });
        updated += 1;
        const list = deltas.get(row.testId!) ?? [];
        list.push({ key: row.componentId, from, to: patch });
        deltas.set(row.testId!, list);
      }

      const entries = [...deltas].map(([testId, changed]) => ({
        entityName: "Test",
        entityId: testId,
        action: "UPDATE",
        oldValue: null,
        newValue: null,
        childChanges: { components: { added: [], removed: [], changed } },
        changeReason,
        performedBy: actor.id,
        performedByName: actor.fullName ?? null
      }));
      for (const part of chunks(entries))
        await AuditLog.bulkCreate(part as any[], { transaction });
    });

    res.status(200).json({
      message: `${updated} components updated across ${deltas.size} tests.`,
      count: updated,
      tests: deltas.size
    });
  }
);
