import StockBatch from "../models/stock-batch.model";
import Stock from "../models/stock.model";
import Group from "../models/group.model";
import PhraseEntry from "../models/phrase-entry.model";
import Project from "../models/project.model";
import Supplier from "../models/supplier.model";
import Location from "../models/location.model";
import StockBatchConsumption from "../models/stock-batch-consumption.model";
import StockBatchParameterValue from "../models/stock-batch-parameter-value.model";
import {
  buildCrudRouter,
  buildCrudService,
  CrudConfig
} from "../utils/crud-factory";
import { claimNextValue } from "../utils/business-id";
import {
  CreateStockBatchDto,
  UpdateStockBatchDto
} from "../dtos/commercial.dto";

/** Same retry budget as business-id.ts's own collision loop. */
const MAX_BATCH_NUMBER_RETRIES = 50;

/**
 * Stock Batches — actual physical material.
 *
 * The identifier is the one place the spec is explicit that nothing is typed:
 * `batchNumber` increments **per stock** (§B.8.b) and `stockBatchId` is
 * "<stock's business id>/<batch number>" (§B.8.c). Both are derived in
 * `beforeCreate`, so there is no business-ID config on this entity.
 */
export const stockBatchConfig: CrudConfig<StockBatch> = {
  model: StockBatch,
  entityName: "Stock Batch",
  permissionEntity: "STOCK_BATCH",
  uniqueField: "stockBatchId",
  searchFields: [
    "stockBatchId",
    "supplierBatchNumber",
    "sapBatchId",
    "internalBatchId"
  ],
  defaultSortBy: "stockBatchId",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    {
      model: Stock,
      as: "stock",
      attributes: ["id", "stockId", "stockName", ["stock_name", "name"]],
      required: false
    },
    {
      model: PhraseEntry,
      as: "status",
      attributes: ["id", "phraseEntryId", "name"],
      required: false
    },
    {
      model: Project,
      as: "project",
      attributes: ["id", "projectId", "name"],
      required: false
    },
    {
      model: Supplier,
      as: "supplier",
      attributes: [
        "id",
        "supplierId",
        "supplierName",
        ["supplier_name", "name"]
      ],
      required: false
    },
    {
      model: Location,
      as: "location",
      attributes: [
        "id",
        "locationId",
        "locationName",
        ["location_name", "name"]
      ],
      required: false
    },
    { model: StockBatchConsumption, as: "consumptions", required: false },
    { model: StockBatchParameterValue, as: "parameters", required: false }
  ],
  relationFields: {
    group: "groupId",
    stock: "stockId",
    status: "statusId",
    project: "projectId",
    supplier: "supplierId",
    location: "locationId"
  },

  // The list table doesn't render anything from the Consumption records or
  // Parameters grids — Edit/View-only.
  listExcludeRelations: ["consumptions", "parameters"],

  /**
   * Derive the batch number and composite id.
   *
   * `batchNumber` is claimed through the same atomic `lims_id_sequences`
   * counter every business id uses (business-id.ts's `claimNextValue`), keyed
   * per stock (`STOCK_BATCH:<stockId>`) rather than the entity-wide key a
   * formatted business id would use. The previous version read
   * `StockBatch.max("batchNumber", ...)` outside any lock, so two concurrent
   * creates on the same stock could compute the same next number; the atomic
   * `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` this now goes through is
   * serialised by Postgres row-locking the same way every other entity's
   * business id already is.
   *
   * The retry-past-collisions loop exists for the same reason
   * `nextBusinessId` has one: this counter starts fresh at 1 per stock, so
   * any stock that already had batches before this counter existed would
   * otherwise collide with its own real batch 1 on the very next create.
   * Retrying past an already-taken number self-heals that with no manual
   * data migration, the same way a hand-typed business id ahead of its
   * counter is handled everywhere else.
   */
  beforeCreate: async (payload, transaction) => {
    const parent = await Stock.findByPk(payload.stockId as string, {
      transaction
    });

    if (!parent) {
      throw Object.assign(new Error("The selected stock does not exist."), {
        statusCode: 400
      });
    }

    let batchNumber: number | undefined;
    for (let attempt = 0; attempt < MAX_BATCH_NUMBER_RETRIES; attempt += 1) {
      const candidate = await claimNextValue(
        `STOCK_BATCH:${parent.id}`,
        "SB",
        transaction
      );
      const taken = await StockBatch.count({
        where: { stockId: parent.id, batchNumber: candidate } as any,
        transaction,
        paranoid: false
      });
      if (!taken) {
        batchNumber = candidate;
        break;
      }
    }
    if (batchNumber === undefined) {
      throw Object.assign(
        new Error(
          "Could not allocate a free batch number for this stock — try again."
        ),
        { statusCode: 409 }
      );
    }

    return {
      ...payload,
      batchNumber,
      stockBatchId: `${parent.stockId}/${batchNumber}`
    };
  },
  children: [
    {
      field: "consumptions",
      model: StockBatchConsumption,
      foreignKey: "stockBatchId",
      fields: ["consumedOn", "consumedBy", "amount", "unit", "remarks"]
    },
    {
      field: "parameters",
      model: StockBatchParameterValue,
      foreignKey: "stockBatchId",
      fields: ["identity", "value", "unit"],
      matchKey: "identity"
    }
  ]
};

const service = buildCrudService(stockBatchConfig);

export default buildCrudRouter({
  service,
  entityName: stockBatchConfig.entityName,
  permissionEntity: stockBatchConfig.permissionEntity,
  createDto: CreateStockBatchDto,
  updateDto: UpdateStockBatchDto,
  hasAttachments: true
});
