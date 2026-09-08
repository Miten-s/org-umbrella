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

/** Stock Batches — physical material. `batchNumber` increments per stock (§B.8.b),
 * `stockBatchId` is "<stock id>/<batch number>" (§B.8.c) — both derived in `beforeCreate`. */
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

  /** Derives the batch number/composite id via the same atomic counter every business id uses,
   * keyed per stock — the retry loop self-heals a stock with pre-existing batches, same as `nextBusinessId`. */
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
