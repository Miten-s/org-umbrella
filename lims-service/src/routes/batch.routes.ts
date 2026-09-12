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
      required: false,
      // Same shape as Lot's own `samples` relation one level down — capped
      // there after one lot with 100k+ samples took ~9s to join. `separate`
      // runs this as its own per-batch query instead of a join.
      separate: true,
      limit: 20
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
      detachOnly: true,
      // Capped to 20 for display (see the `lots` relation above) — a normal
      // save must never diff this against the real count, only the dedicated
      // .../children/lots attach/detach routes may change it.
      manageOnly: true
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
  hasAttachments: true,
  children: batchConfig.children
});

export default attachCancelRoutes(router, {
  model: Batch,
  permissionEntity: "BATCH",
  entityName: "Batch"
});
