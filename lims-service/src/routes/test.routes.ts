import Test from "../models/test.model";
import Sample from "../models/sample.model";
import Analysis from "../models/analysis.model";
import Instrument from "../models/instrument.model";
import Group from "../models/group.model";
import { buildCrudRouter, buildCrudService, CrudConfig } from "../utils/crud-factory";
import { CreateTestDto, UpdateTestDto } from "../dtos/execution.dto";
import { attachCancelRoutes } from "../utils/cancel-routes";

/**
 * Tests — 100k a day. Not versioned: a test is an assignment plus a status and
 * carries no measured value, so the generic audit trail already captures every
 * change. Results, which do carry values, are versioned.
 */
export const testConfig: CrudConfig<Test> = {
  model: Test,
  entityName: "Test",
  permissionEntity: "TEST",
  uniqueField: "testId",
  businessId: { field: "testId", prefix: "TST", locked: true },
  searchFields: ["testId", "testName", "description"],
  defaultSortBy: "createdAt",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    { model: Sample, as: "sample", attributes: ["id", "sampleId", "sampleName"], required: false },
    { model: Analysis, as: "analysis", attributes: ["id", "analysisId", "name"], required: false },
    { model: Instrument, as: "instrument", attributes: ["id", "instrumentId", "name"], required: false }
  ],
  relationFields: {
    group: "groupId",
    sample: "sampleId",
    analysis: "analysisId",
    instrument: "instrumentId"
  }
};

const service = buildCrudService(testConfig);

const router = buildCrudRouter({
  service,
  entityName: testConfig.entityName,
  permissionEntity: testConfig.permissionEntity,
  createDto: CreateTestDto,
  updateDto: UpdateTestDto
});

export default attachCancelRoutes(router, { model: Test, permissionEntity: "TEST", entityName: "Test" });
