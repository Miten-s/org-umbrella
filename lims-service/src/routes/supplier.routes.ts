import Supplier from "../models/supplier.model";
import Group from "../models/group.model";
import PhraseEntry from "../models/phrase-entry.model";
import { buildCrudRouter, buildCrudService, CrudConfig } from "../utils/crud-factory";
import { CreateSupplierDto, UpdateSupplierDto } from "../dtos/commercial.dto";

/** Suppliers. Referenced by Stock (preferred + many) and Stock Batches. */
export const supplierConfig: CrudConfig<Supplier> = {
  model: Supplier,
  entityName: "Supplier",
  permissionEntity: "SUPPLIER",
  uniqueField: "supplierId",
  businessId: { field: "supplierId", prefix: "SUP" },
  searchFields: ["supplierId", "supplierName", "email", "contactName"],
  defaultSortBy: "supplierName",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    { model: PhraseEntry, as: "rating", attributes: ["id", "phraseEntryId", "name"], required: false }
  ],
  relationFields: { group: "groupId", rating: "ratingId" }
};

const service = buildCrudService(supplierConfig);

export default buildCrudRouter({
  service,
  entityName: supplierConfig.entityName,
  permissionEntity: supplierConfig.permissionEntity,
  createDto: CreateSupplierDto,
  updateDto: UpdateSupplierDto,
  model: Supplier,
  businessId: supplierConfig.businessId
});
