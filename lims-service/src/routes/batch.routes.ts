import Batch from "../models/batch.model";
import Lot from "../models/lot.model";
import Group from "../models/group.model";
import {
  buildCrudRouter,
  buildCrudService,
  CrudConfig
} from "../utils/crud-factory";
import { CreateBatchDto, UpdateBatchDto } from "../dtos/execution.dto";
import { attachCancelRoutes } from "../utils/cancel-routes";

/**
 * Batches. The client picks Lots when editing a batch, so `lots` is widened
 * into child rows — the FK actually lives on the lot.
 */
export const batchConfig: CrudConfig<Batch> = {
  model: Batch,
  entityName: "Batch",
  permissionEntity: "BATCH",
  uniqueField: "batchId",
  businessId: { field: "batchId", prefix: "BAT" },
  searchFields: ["batchId", "batchName", "description"],
  defaultSortBy: "createdAt",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    {
      model: Lot,
      as: "lots",
      attributes: ["id", "lotId", "lotName", ["lot_name", "name"]],
      required: false
    }
  ],
  relationFields: { group: "groupId" },
  normalizePayload: (payload) => {
    if (!Array.isArray(payload.lots)) return payload;
    return {
      ...payload,
      lots: payload.lots.map((v: unknown) =>
        typeof v === "string" ? { id: v } : v
      )
    };
  },
  children: [
    // Re-parents the chosen lots onto this batch; lots dropped from the list
    // are detached rather than deleted, since a lot outlives its batch.
    {
      field: "lots",
      model: Lot,
      foreignKey: "batchId",
      fields: ["id"],
      matchKey: "id",
      detachOnly: true
    }
  ]
};

const service = buildCrudService(batchConfig);

const router = buildCrudRouter({
  service,
  entityName: batchConfig.entityName,
  permissionEntity: batchConfig.permissionEntity,
  createDto: CreateBatchDto,
  updateDto: UpdateBatchDto,
  model: Batch,
  businessId: batchConfig.businessId,
  hasAttachments: true
});

export default attachCancelRoutes(router, {
  model: Batch,
  permissionEntity: "BATCH",
  entityName: "Batch"
});
