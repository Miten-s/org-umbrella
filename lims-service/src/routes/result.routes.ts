import { Router, Request, Response } from "express";
import Result from "../models/result.model";
import Test from "../models/test.model";
import Instrument from "../models/instrument.model";
import Stock from "../models/stock.model";
import Group from "../models/group.model";
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
  businessId: { field: "resultId", prefix: "RES", locked: true },
  searchFields: ["resultId", "componentName", "value"],
  // Only the current version of each measurement is listed; the superseded
  // rows stay in the table and are reachable through /:id/versions.
  baseWhere: { isLatest: true },
  defaultSortBy: "createdAt",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    { model: Test, as: "test", attributes: ["id", "testId", "testName"], required: false },
    { model: Instrument, as: "instrument", attributes: ["id", "instrumentId", "name"], required: false },
    { model: Stock, as: "stock", attributes: ["id", "stockId", "stockName"], required: false }
  ],
  relationFields: {
    group: "groupId",
    test: "testId",
    instrument: "instrumentId",
    stock: "stockId"
  }
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
    await Result.update(
      { isLatest: false, modifiedBy: ctx.actor.id } as any,
      { where: { id: current.id } as any, transaction }
    );

    const created = await Result.create(
      {
        // Everything not being amended is carried forward verbatim.
        resultId: current.resultId,
        testId: current.testId,
        componentId: current.componentId,
        componentName: current.componentName,
        unit: payload.unit ?? current.unit,
        value: payload.value ?? current.value,
        outOfRange: payload.outOfRange ?? current.outOfRange,
        instrumentId: payload.instrumentId ?? current.instrumentId,
        stockId: payload.stockId ?? current.stockId,
        enteredBy: payload.enteredBy ?? ctx.actor.fullName ?? ctx.actor.id,
        enteredOn: new Date(),
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

const service = { ...base, update: updateAsNewVersion } as typeof base;

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
    if (!scope.operateAll && record.groupId && !scope.accessGroupIds.includes(record.groupId)) {
      return res.status(403).json({ message: "Result is outside your groups." });
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
