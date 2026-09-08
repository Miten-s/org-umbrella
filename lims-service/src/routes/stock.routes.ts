import Stock from "../models/stock.model";
import Group from "../models/group.model";
import PhraseEntry from "../models/phrase-entry.model";
import LimsUser from "../models/lims-user.model";
import Location from "../models/location.model";
import Supplier from "../models/supplier.model";
import StockSupplier from "../models/stock-supplier.model";
import StockParameterValue from "../models/stock-parameter-value.model";
import {
  buildCrudRouter,
  buildCrudService,
  CrudConfig
} from "../utils/crud-factory";
import { CreateStockDto, UpdateStockDto } from "../dtos/commercial.dto";

/** Stock items — the definition of a consumable; physical material lives in Stock Batches.
 * `suppliers` arrives as bare ids from the multi-select; `normalizePayload` widens them to child rows. */
export const stockConfig: CrudConfig<Stock> = {
  model: Stock,
  entityName: "Stock Item",
  permissionEntity: "STOCK",
  uniqueField: "stockId",
  businessId: { field: "stockId", prefix: "STK" },
  searchFields: ["stockId", "stockName", "description"],
  defaultSortBy: "stockName",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    {
      model: PhraseEntry,
      as: "stockType",
      attributes: ["id", "phraseEntryId", "name"],
      required: false
    },
    {
      model: LimsUser,
      as: "operator",
      attributes: ["id", "userName", ["user_name", "name"]],
      required: false
    },
    {
      model: Location,
      as: "defaultLocation",
      attributes: [
        "id",
        "locationId",
        "locationName",
        ["location_name", "name"]
      ],
      required: false
    },
    {
      model: Supplier,
      as: "preferredSupplier",
      attributes: [
        "id",
        "supplierId",
        "supplierName",
        ["supplier_name", "name"]
      ],
      required: false
    },
    {
      model: Supplier,
      as: "suppliers",
      attributes: [
        "id",
        "supplierId",
        "supplierName",
        ["supplier_name", "name"]
      ],
      through: { attributes: [] },
      required: false
    },
    { model: StockParameterValue, as: "parameters", required: false }
  ],
  relationFields: {
    group: "groupId",
    stockType: "stockTypeId",
    operator: "operatorId",
    defaultLocation: "defaultLocationId",
    preferredSupplier: "preferredSupplierId"
  },

  // The list renders nothing from Suppliers/Parameters (Edit/View-only); `preferredSupplier` is untouched.
  listExcludeRelations: ["suppliers", "parameters"],

  normalizePayload: (payload) => {
    if (!Array.isArray(payload.suppliers)) return payload;
    return {
      ...payload,
      suppliers: payload.suppliers.map((value: unknown) =>
        typeof value === "string" ? { supplierId: value } : value
      )
    };
  },
  children: [
    {
      field: "suppliers",
      model: StockSupplier,
      foreignKey: "stockId",
      fields: ["supplierId"],
      matchKey: "supplierId"
    },
    {
      field: "parameters",
      model: StockParameterValue,
      foreignKey: "stockId",
      fields: ["identity", "value", "unit"],
      matchKey: "identity"
    }
  ]
};

const service = buildCrudService(stockConfig);

export default buildCrudRouter({
  service,
  entityName: stockConfig.entityName,
  permissionEntity: stockConfig.permissionEntity,
  createDto: CreateStockDto,
  updateDto: UpdateStockDto,
  model: Stock,
  businessId: stockConfig.businessId,
  hasAttachments: true
});
