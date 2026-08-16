import Scheduler from "../models/scheduler.model";
import Group from "../models/group.model";
import Project from "../models/project.model";
import Analysis from "../models/analysis.model";
import TestGroup from "../models/test-group.model";
import Specification from "../models/specification.model";
import PhraseEntry from "../models/phrase-entry.model";
import LimsUser from "../models/lims-user.model";
import { buildCrudRouter, buildCrudService, CrudConfig } from "../utils/crud-factory";
import { CreateSchedulerDto, UpdateSchedulerDto } from "../dtos/execution.dto";

/**
 * Schedulers. The runner that sweeps `nextRunDate` is not built yet (deferred
 * with Kafka); the definitions and their index are, so turning it on later is
 * a worker, not a schema change.
 */
export const schedulerConfig: CrudConfig<Scheduler> = {
  model: Scheduler,
  entityName: "Scheduler",
  permissionEntity: "SCHEDULER",
  uniqueField: "schedulerId",
  businessId: { field: "schedulerId", prefix: "SCH" },
  searchFields: ["schedulerId", "name", "description"],
  defaultSortBy: "name",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    { model: Project, as: "project", attributes: ["id", "projectId", "name"], required: false },
    { model: Analysis, as: "analysis", attributes: ["id", "analysisId", "name"], required: false },
    { model: TestGroup, as: "testGroup", attributes: ["id", "testGroupId", "name"], required: false },
    { model: Specification, as: "specification", attributes: ["id", "specId", "name"], required: false },
    { model: PhraseEntry, as: "sampleType", attributes: ["id", "phraseEntryId", "name"], required: false },
    { model: LimsUser, as: "owner", attributes: ["id", "userName", ["user_name", "name"]], required: false }
  ],
  relationFields: {
    group: "groupId",
    project: "projectId",
    analysis: "analysisId",
    testGroup: "testGroupId",
    specification: "specificationId",
    sampleType: "sampleTypeId",
    owner: "ownerId"
  }
};

const service = buildCrudService(schedulerConfig);

export default buildCrudRouter({
  service,
  entityName: schedulerConfig.entityName,
  permissionEntity: schedulerConfig.permissionEntity,
  createDto: CreateSchedulerDto,
  updateDto: UpdateSchedulerDto,
  model: Scheduler,
  businessId: schedulerConfig.businessId
});
