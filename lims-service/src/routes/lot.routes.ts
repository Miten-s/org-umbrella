import Lot from "../models/lot.model";
import Batch from "../models/batch.model";
import Sample from "../models/sample.model";
import Group from "../models/group.model";
import { buildCrudRouter, buildCrudService, CrudConfig } from "../utils/crud-factory";
import { CreateLotDto, UpdateLotDto } from "../dtos/execution.dto";
import { attachCancelRoutes } from "../utils/cancel-routes";

/** Lots. Same shape as Batch one level down: picks Samples, belongs to a Batch. */
export const lotConfig: CrudConfig<Lot> = {
  model: Lot,
  entityName: "Lot",
  permissionEntity: "LOT",
  uniqueField: "lotId",
  businessId: { field: "lotId", prefix: "LOT" },
  searchFields: ["lotId", "lotName", "description"],
  defaultSortBy: "createdAt",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    { model: Batch, as: "batch", attributes: ["id", "batchId", "batchName", ["batch_name", "name"]], required: false },
    { model: Sample, as: "samples", attributes: ["id", "sampleId", "sampleName", ["sample_name", "name"]], required: false }
  ],
  relationFields: { group: "groupId", batch: "batchId" },
  normalizePayload: (payload) => {
    if (!Array.isArray(payload.samples)) return payload;
    return {
      ...payload,
      samples: payload.samples.map((v: unknown) => (typeof v === "string" ? { id: v } : v))
    };
  },
  children: [
    { field: "samples", model: Sample, foreignKey: "lotId", fields: ["id"], matchKey: "id", detachOnly: true }
  ]
};

const service = buildCrudService(lotConfig);

const router = buildCrudRouter({
  service,
  entityName: lotConfig.entityName,
  permissionEntity: lotConfig.permissionEntity,
  createDto: CreateLotDto,
  updateDto: UpdateLotDto,
  model: Lot,
  businessId: lotConfig.businessId
});

export default attachCancelRoutes(router, { model: Lot, permissionEntity: "LOT", entityName: "Lot" });
