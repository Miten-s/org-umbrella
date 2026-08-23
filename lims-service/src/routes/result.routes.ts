import { Router, Request, Response } from "express";
import { Op } from "sequelize";
import Result from "../models/result.model";
import Test from "../models/test.model";
import Sample from "../models/sample.model";
import Analysis from "../models/analysis.model";
import Instrument from "../models/instrument.model";
import Stock from "../models/stock.model";
import Group from "../models/group.model";
import AuditLog from "../models/audit-log.model";
import {
  buildCrudRouter,
  buildCrudService,
  CrudConfig,
  CrudContext
} from "../utils/crud-factory";
import { CreateResultDto, UpdateResultDto } from "../dtos/execution.dto";
import { attachCancelRoutes } from "../utils/cancel-routes";
import { sequelize } from "../configs/db.sequelize";
import { writeAudit } from "../utils/audit.util";
import { formatLimsEntity } from "../utils/format.util";
import { authorize } from "../middlewares/authorize.middleware";
import asyncHandler from "../middlewares/error.middleware";
import API_ROUTES from "../utils/routes";

/**
 * Results — the 1M-rows-a-day table, and the one entity that is INSERT-ONLY.
 *
 * A recorded measurement is never overwritten. Amending one inserts a new row
 * with `version + 1` and flips the previous row's `isLatest` to false, keeping
 * it forever. That is the 21 CFR Part 11 requirement: the value as originally
 * entered must always remain retrievable, alongside who changed it, when, and
 * why.
 *
 * Lists therefore filter `isLatest = true` — the partial index in migration
 * 009 matches that predicate exactly.
 */
export const resultConfig: CrudConfig<Result> = {
  model: Result,
  entityName: "Result",
  permissionEntity: "RESULT",
  uniqueField: "resultId",
  businessId: { field: "resultId", prefix: "RES", locked: true, pad: 10 },
  searchFields: ["resultId", "componentName", "value"],
  // Only the current version of each measurement is listed; the superseded
  // rows stay in the table and are reachable through /:id/versions.
  baseWhere: { isLatest: true },
  defaultSortBy: "createdAt",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    {
      model: Test,
      as: "test",
      attributes: ["id", "testId", "testName", ["test_name", "name"]],
      required: false,
      include: [
        {
          model: Sample,
          as: "sample",
          attributes: ["id", "sampleId", "sampleName", ["sample_name", "name"]],
          required: false
        },
        {
          model: Analysis,
          as: "analysis",
          attributes: ["id", "analysisId", "name"],
          required: false
        }
      ]
    },
    {
      model: Instrument,
      as: "instrument",
      attributes: ["id", "instrumentId", "name"],
      required: false
    },
    {
      model: Stock,
      as: "stock",
      attributes: ["id", "stockId", "stockName", ["stock_name", "name"]],
      required: false
    }
  ],
  relationFields: {
    group: "groupId",
    test: "testId",
    instrument: "instrumentId",
    stock: "stockId"
  },
  postFormat: (row) => ({
    ...row,
    sample: row.test?.sample ?? null,
    analysis: row.test?.analysis ?? null
  })
};

const base = buildCrudService(resultConfig);

/**
 * Replaces the generic in-place update.
 *
 * Returns `null` for "not found" so the controller's existing 404 handling
 * applies unchanged.
 */
const updateAsNewVersion = async (
  id: string,
  payload: Record<string, any>,
  ctx: CrudContext
) => {
  return sequelize.transaction(async (transaction) => {
    const current = await Result.findOne({
      where: { id, isDeleted: false } as any,
      transaction
    });

    if (!current) return null;

    // Group scoping, same rule as every other read.
    if (
      !ctx.scope.operateAll &&
      current.groupId &&
      !ctx.scope.accessGroupIds.includes(current.groupId)
    ) {
      return null;
    }

    if (!current.isLatest) {
      throw Object.assign(
        new Error(
          "This is a superseded version of a result and cannot be amended. " +
            "Amend the current version instead."
        ),
        { statusCode: 409 }
      );
    }

    const previous = current.toJSON();

    // Retire the current row first: the unique partial index allows only one
    // isLatest row per (test, component), so this must happen before insert.
    await Result.update({ isLatest: false, modifiedBy: ctx.actor.id } as any, {
      where: { id: current.id } as any,
      transaction
    });

    const created = await Result.create(
      {
        // Everything not being amended is carried forward verbatim.
        resultId: current.resultId,
        testId: current.testId,
        // Editable on amend, same as componentName — see UpdateResultDto's
        // comment. Both were hardcoded to the OLD value here, so an edited
        // Component ID/Name never actually saved.
        componentId: payload.componentId ?? current.componentId,
        componentName: payload.componentName ?? current.componentName,
        unit: payload.unit ?? current.unit,
        value: payload.value ?? current.value,
        outOfRange: payload.outOfRange ?? current.outOfRange,
        instrumentId: payload.instrumentId ?? current.instrumentId,
        stockId: payload.stockId ?? current.stockId,
        enteredBy: payload.enteredBy ?? ctx.actor.fullName ?? ctx.actor.id,
        // Was hardcoded to "now" unconditionally, so amending any OTHER
        // field (e.g. just Value) silently rewrote this to the save's
        // server time — audit-trail noise that looked like an intentional
        // change to a field the user never touched.
        enteredOn: payload.enteredOn ?? current.enteredOn,
        status: current.status,
        groupId: current.groupId,
        version: current.version + 1,
        isLatest: true,
        supersedesId: current.id
      } as any,
      { transaction }
    );

    await writeAudit({
      entityName: resultConfig.entityName,
      entityId: created.id,
      action: "UPDATE",
      oldValue: previous,
      newValue: created.toJSON(),
      changeReason: payload.changeReason,
      actor: ctx.actor,
      transaction
    });

    return formatLimsEntity(created);
  });
};

/**
 * Every amendment inserts a new physical row (`updateAsNewVersion` above), so
 * the generic `getAuditLogs(entityId)` — which filters strictly by that one
 * row's id — only ever finds the UPDATE entry written for the current
 * version. The original CREATE lives under the *previous* version's row id
 * and was invisible from the UI: a QA reviewer could see the latest edit but
 * never who created the Result or its original value.
 *
 * Walk the `supersedesId` chain back to the original row and pull every
 * version's audit entries together, so the trail reads as one continuous
 * history the way a single mutable record's would.
 */
const getResultAuditLogs = async (
  entityId: string,
  page: number,
  limit: number,
  ctx: CrudContext
) => {
  const current = await Result.findOne({ where: { id: entityId } as any });
  if (!current) return null;

  if (
    !ctx.scope.operateAll &&
    current.groupId &&
    !ctx.scope.accessGroupIds.includes(current.groupId)
  ) {
    return null;
  }

  const chainIds = [current.id];
  let cursor = current.supersedesId;
  while (cursor && !chainIds.includes(cursor)) {
    chainIds.push(cursor);
    const ancestor = await Result.findOne({ where: { id: cursor } as any });
    cursor = ancestor?.supersedesId ?? null;
  }

  const { count, rows } = await AuditLog.findAndCountAll({
    where: {
      entityName: resultConfig.entityName,
      entityId: { [Op.in]: chainIds }
    },
    order: [["performedAt", "DESC"]],
    offset: (page - 1) * limit,
    limit
  });

  const logs = (formatLimsEntity(rows) as Record<string, any>[]).map((row) => ({
    ...row,
    uniqueId: row.id,
    who: row.performedByName ?? null,
    when: row.performedAt ?? null
  }));

  return { logs, total: count };
};

const service = {
  ...base,
  update: updateAsNewVersion,
  getAuditLogs: getResultAuditLogs
} as typeof base;

const router = buildCrudRouter({
  service,
  entityName: resultConfig.entityName,
  permissionEntity: resultConfig.permissionEntity,
  createDto: CreateResultDto,
  updateDto: UpdateResultDto
});

/**
 * The full version chain for a result, oldest first — "show me what this value
 * used to be", which is the question an auditor actually asks.
 */
router.get(
  API_ROUTES.PARAMS + "/versions",
  authorize("RESULT", "VIEW"),
  asyncHandler(async (req: Request, res: Response) => {
    const record = await Result.findByPk(req.params["id"] as string);
    if (!record) return res.status(404).json({ message: "Result not found." });

    const scope = req.access!;
    if (
      !scope.operateAll &&
      record.groupId &&
      !scope.accessGroupIds.includes(record.groupId)
    ) {
      return res
        .status(403)
        .json({ message: "Result is outside your groups." });
    }

    const versions = await Result.findAll({
      where: { testId: record.testId, componentId: record.componentId } as any,
      order: [["version", "ASC"]]
    });

    res.status(200).json({ data: formatLimsEntity(versions) });
  })
);

export default attachCancelRoutes(router, {
  model: Result,
  permissionEntity: "RESULT",
  entityName: "Result"
});
