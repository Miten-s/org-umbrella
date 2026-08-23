import Test from "../models/test.model";
import Sample from "../models/sample.model";
import Analysis from "../models/analysis.model";
import Instrument from "../models/instrument.model";
import Group from "../models/group.model";
import TestWindow from "../models/test-window.model";
import {
  buildCrudRouter,
  buildCrudService,
  CrudConfig
} from "../utils/crud-factory";
import { CreateTestDto, UpdateTestDto } from "../dtos/execution.dto";
import { attachCancelRoutes } from "../utils/cancel-routes";

/**
 * Tests — 100k a day. Not versioned: a test is an assignment plus a status and
 * carries no measured value, so the generic audit trail already captures every
 * change. Results, which do carry values, are versioned.
 *
 * `components` is the Test form's result-entry grid — the frontend has always
 * sent it, but nothing here declared or persisted it (silently stripped by
 * the DTO's whitelist), so it never saved. It reuses Sample's `TestWindow`
 * table rather than a new one: same row shape (`TestWindowRowDto`), and that
 * table already carries an (until now unused) `testId` column alongside its
 * required `sampleId` — this is clearly what it was for. Rows are matched to
 * *this* Test via `testId`; `sampleId` is stamped from the Test's own sample
 * on create, via `extraFields`, since the column is NOT NULL.
 */
export const testConfig: CrudConfig<Test> = {
  model: Test,
  entityName: "Test",
  permissionEntity: "TEST",
  uniqueField: "testId",
  businessId: { field: "testId", prefix: "TST", locked: true, pad: 10 },
  searchFields: ["testId", "testName", "description"],
  defaultSortBy: "createdAt",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    {
      model: Sample,
      as: "sample",
      attributes: ["id", "sampleId", "sampleName", ["sample_name", "name"]],
      required: false
    },
    {
      model: Analysis,
      as: "analysis",
      attributes: ["id", "analysisId", "name"],
      required: false
    },
    {
      model: Instrument,
      as: "instrument",
      attributes: ["id", "instrumentId", "name"],
      required: false
    },
    { model: TestWindow, as: "components", required: false }
  ],
  relationFields: {
    group: "groupId",
    sample: "sampleId",
    analysis: "analysisId",
    instrument: "instrumentId"
  },

  // The list table doesn't render anything from the Components grid —
  // Edit/View-only.
  listExcludeRelations: ["components"],

  children: [
    {
      field: "components",
      model: TestWindow,
      foreignKey: "testId",
      fields: [
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
      extraFields: (parent) => ({ sampleId: parent.sampleId })
    }
  ]
};

const service = buildCrudService(testConfig);

const router = buildCrudRouter({
  service,
  entityName: testConfig.entityName,
  permissionEntity: testConfig.permissionEntity,
  createDto: CreateTestDto,
  updateDto: UpdateTestDto,
  hasAttachments: true
});

export default attachCancelRoutes(router, {
  model: Test,
  permissionEntity: "TEST",
  entityName: "Test"
});
