import Sample from "../models/sample.model";
import Lot from "../models/lot.model";
import Project from "../models/project.model";
import Specification from "../models/specification.model";
import TestGroup from "../models/test-group.model";
import Location from "../models/location.model";
import StockBatch from "../models/stock-batch.model";
import PhraseEntry from "../models/phrase-entry.model";
import Group from "../models/group.model";
import TestWindow from "../models/test-window.model";
import {
  buildCrudRouter,
  buildCrudService,
  CrudConfig
} from "../utils/crud-factory";
import { CreateSampleDto, UpdateSampleDto } from "../dtos/execution.dto";
import { attachCancelRoutes } from "../utils/cancel-routes";

/** Samples — 10k a day. `sampleId` is locked, always server-generated. Test Windows are NOT
 * nested — their own endpoint, since rewriting the whole grid on each save doesn't hold at volume. */
export const sampleConfig: CrudConfig<Sample> = {
  model: Sample,
  entityName: "Sample",
  permissionEntity: "SAMPLE",
  uniqueField: "sampleId",
  businessId: { field: "sampleId", prefix: "SMP", locked: true, pad: 9 },
  searchFields: [
    "sampleId",
    "idText",
    "sampleName",
    "lotNumber",
    "serialNumber"
  ],
  defaultSortBy: "createdAt",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    {
      model: Lot,
      as: "lot",
      attributes: ["id", "lotId", "lotName", ["lot_name", "name"]],
      required: false
    },
    {
      model: Project,
      as: "project",
      attributes: ["id", "projectId", "name"],
      required: false
    },
    {
      model: PhraseEntry,
      as: "sampleType",
      attributes: ["id", "phraseEntryId", "name"],
      required: false
    },
    {
      model: Specification,
      as: "specification",
      attributes: ["id", "specId", "name"],
      required: false
    },
    {
      model: TestGroup,
      as: "testGroup",
      attributes: ["id", "testGroupId", "name"],
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
    {
      model: StockBatch,
      as: "stockBatch",
      attributes: ["id", "stockBatchId", ["stock_batch_id", "name"]],
      required: false
    },
    {
      model: TestWindow,
      as: "testWindows",
      required: false,
      // Must mirror the children config's own `scopeWhere` below — a claimed test window is
      // that Test's own row, not the sample's unclaimed pool, or a save re-inserts and duplicates it.
      where: { testId: null }
    }
  ],
  children: [
    // Bounded per sample (tens of rows), so nesting is safe here — the volume
    // argument applies to Results across all samples, not to one sample's grid.
    {
      field: "testWindows",
      model: TestWindow,
      foreignKey: "sampleId",
      fields: [
        "testId",
        "analysisName",
        "componentId",
        "componentName",
        "description",
        "value",
        "unit",
        "outOfRange",
        "enteredOn",
        "enteredBy",
        "instrumentId",
        "stockId"
      ],
      relationFields: { instrument: "instrumentId", stock: "stockId" },
      matchKey: "componentId",
      // A Test's own `components` grid stamps rows into this same table with `testId` set —
      // without this scope, saving this grid would see those as orphans and delete them.
      scopeWhere: { testId: null }
    }
  ],
  relationFields: {
    group: "groupId",
    lot: "lotId",
    project: "projectId",
    sampleType: "sampleTypeId",
    specification: "specificationId",
    testGroup: "testGroupId",
    location: "locationId",
    stockBatch: "stockBatchId"
  },

  // The list table doesn't render anything from the Test windows grid —
  // Edit/View-only.
  listExcludeRelations: ["testWindows"]
};

const service = buildCrudService(sampleConfig);

const router = buildCrudRouter({
  service,
  entityName: sampleConfig.entityName,
  permissionEntity: sampleConfig.permissionEntity,
  createDto: CreateSampleDto,
  updateDto: UpdateSampleDto,
  hasAttachments: true
});

export default attachCancelRoutes(router, {
  model: Sample,
  permissionEntity: "SAMPLE",
  entityName: "Sample"
});
