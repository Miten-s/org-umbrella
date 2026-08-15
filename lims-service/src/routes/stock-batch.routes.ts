import StockBatch from "../models/stock-batch.model";
import Stock from "../models/stock.model";
import Group from "../models/group.model";
import PhraseEntry from "../models/phrase-entry.model";
import Project from "../models/project.model";
import Supplier from "../models/supplier.model";
import Location from "../models/location.model";
import StockBatchConsumption from "../models/stock-batch-consumption.model";
import StockBatchParameterValue from "../models/stock-batch-parameter-value.model";
import { buildCrudRouter, buildCrudService, CrudConfig } from "../utils/crud-factory";
import { CreateStockBatchDto, UpdateStockBatchDto } from "../dtos/commercial.dto";

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
  searchFields: ["stockBatchId", "supplierBatchNumber", "sapBatchId", "internalBatchId"],
  defaultSortBy: "stockBatchId",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    { model: Stock, as: "stock", attributes: ["id", "stockId", "stockName"], required: false },
    { model: PhraseEntry, as: "status", attributes: ["id", "phraseEntryId", "name"], required: false },
    { model: Project, as: "project", attributes: ["id", "projectId", "name"], required: false },
    { model: Supplier, as: "supplier", attributes: ["id", "supplierId", "supplierName"], required: false },
    { model: Location, as: "location", attributes: ["id", "locationId", "locationName"], required: false },
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
  /**
   * Derive the batch number and composite id.
   *
   * The read of the current max is not inside the create transaction, so two
   * simultaneous batches on the same stock could compute the same number. The
   * unique index on (stock_id, batch_number) is what actually guarantees
   * correctness — the loser gets a 400 and retries, which is the right trade
   * against serialising every batch creation on one stock.
   */
  beforeCreate: async (payload) => {
    const parent = await Stock.findByPk(payload.stockId as string);

    if (!parent) {
      throw Object.assign(new Error("The selected stock does not exist."), { statusCode: 400 });
    }

    const highest = (await StockBatch.max("batchNumber", {
      where: { stockId: payload.stockId as string }
    })) as number | null;

    const batchNumber = Number(highest ?? 0) + 1;

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
  updateDto: UpdateStockBatchDto
});
