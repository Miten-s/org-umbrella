import AliquotSet from "../models/aliquot-set.model";
import Aliquot from "../models/aliquot.model";
import Group from "../models/group.model";
import StockBatch from "../models/stock-batch.model";
import {
  buildCrudRouter,
  buildCrudService,
  CrudConfig
} from "../utils/crud-factory";
import {
  CreateAliquotSetDto,
  UpdateAliquotSetDto
} from "../dtos/commercial.dto";

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
      attributes: [
        "id",
        "stockBatchId",
        "batchNumber",
        ["stock_batch_id", "name"]
      ],
      required: false
    },
    { model: Aliquot, as: "aliquots", required: false }
  ],
  relationFields: { group: "groupId", stockBatch: "stockBatchId" },

  // The list table shows the "Number of aliquots" summary column only — the
  // itemized row grid is Edit/View-only, so no list row needs it.
  listExcludeRelations: ["aliquots"],

  // "Number of aliquots" is a typed summary field, independent of the itemized
  // "List of aliquots" rows — nothing cross-checked them, so a record could be
  // saved claiming 5 aliquots with only 1 actual row. Reject the mismatch
  // whenever the client sends both in the same save; a partial update that
  // omits `aliquots` entirely is left alone.
  normalizePayload: (payload) => {
    const rows = Array.isArray(payload.aliquots) ? payload.aliquots : undefined;
    const declared = payload.aliquotsNumber;
    if (
      rows &&
      declared !== undefined &&
      declared !== null &&
      Number(declared) !== rows.length
    ) {
      throw Object.assign(
        new Error(
          `"Number of aliquots" (${declared}) does not match the ${rows.length} row(s) in the aliquot list.`
        ),
        { statusCode: 400 }
      );
    }
    return payload;
  },

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
