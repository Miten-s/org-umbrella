import TestGroup from "../models/test-group.model";
import TestGroupItem from "../models/test-group-item.model";
import Group from "../models/group.model";
import Instrument from "../models/instrument.model";
import { buildCrudRouter, buildCrudService, CrudConfig } from "../utils/crud-factory";
import { CreateTestGroupDto, UpdateTestGroupDto } from "../dtos/analytical.dto";

/** Test Groups — the reusable test list applied when logging a sample. */
export const testGroupConfig: CrudConfig<TestGroup> = {
  model: TestGroup,
  entityName: "Test Group",
  permissionEntity: "TEST_GROUP",
  uniqueField: "testGroupId",
  businessId: { field: "testGroupId", prefix: "TG" },
  searchFields: ["testGroupId", "name", "description"],
  defaultSortBy: "name",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    {
      model: TestGroupItem,
      as: "tests",
      required: false,
      include: [{ model: Instrument, as: "instrument", attributes: ["id", "instrumentId", "name"], required: false }]
    }
  ],
  relationFields: { group: "groupId" },
  children: [
    {
      field: "tests",
      model: TestGroupItem,
      foreignKey: "testGroupId",
      fields: ["testName", "instrumentCategory", "instrumentType", "instrumentId", "replicateCount", "sortOrder"],
      // The grid sends the chosen instrument as `instrument`; the column is
      // `instrumentId`.
      relationFields: { instrument: "instrumentId" },
      matchKey: "testName"
    }
  ]
};

const service = buildCrudService(testGroupConfig);

export default buildCrudRouter({
  service,
  entityName: testGroupConfig.entityName,
  permissionEntity: testGroupConfig.permissionEntity,
  createDto: CreateTestGroupDto,
  updateDto: UpdateTestGroupDto,
  model: TestGroup,
  businessId: testGroupConfig.businessId
});
