import AliquotSet from "../models/aliquot-set.model";
import Aliquot from "../models/aliquot.model";
import Group from "../models/group.model";
import StockBatch from "../models/stock-batch.model";
import { buildCrudRouter, buildCrudService, CrudConfig } from "../utils/crud-factory";
import { CreateAliquotSetDto, UpdateAliquotSetDto } from "../dtos/commercial.dto";

/**
 * Aliquot sets — "split this stock batch into 12". The set is the record the
 * user creates; the individual aliquots are its sub-form rows.
 */
export const aliquotConfig: CrudConfig<AliquotSet> = {
  model: AliquotSet,
  entityName: "Aliquot Set",
  permissionEntity: "ALIQUOT",
  uniqueField: "aliquotSetId",
  businessId: { field: "aliquotSetId", prefix: "ALQ" },
  searchFields: ["aliquotSetId"],
  defaultSortBy: "aliquotSetId",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    {
      model: StockBatch,
      as: "stockBatch",
      attributes: ["id", "stockBatchId", "batchNumber"],
      required: false
    },
    { model: Aliquot, as: "aliquots", required: false }
  ],
  relationFields: { group: "groupId", stockBatch: "stockBatchId" },
  children: [
    {
      field: "aliquots",
      model: Aliquot,
      foreignKey: "aliquotSetId",
      fields: ["aliquotId", "description", "quantity", "unit"],
      matchKey: "aliquotId"
    }
  ]
};

const service = buildCrudService(aliquotConfig);

export default buildCrudRouter({
  service,
  entityName: aliquotConfig.entityName,
  permissionEntity: aliquotConfig.permissionEntity,
  createDto: CreateAliquotSetDto,
  updateDto: UpdateAliquotSetDto,
  model: AliquotSet,
  businessId: aliquotConfig.businessId
});
