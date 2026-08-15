import Study from "../models/study.model";
import Group from "../models/group.model";
import Project from "../models/project.model";
import LimsUser from "../models/lims-user.model";
import { buildCrudRouter, buildCrudService, CrudConfig } from "../utils/crud-factory";
import { CreateStudyDto, UpdateStudyDto } from "../dtos/commercial.dto";

/**
 * Studies. `projectDetails` is a snapshot the client fills from the selected
 * project; it is stored as sent rather than re-derived, so the study keeps the
 * text as it read at setup even after the project is edited.
 */
export const studyConfig: CrudConfig<Study> = {
  model: Study,
  entityName: "Study",
  permissionEntity: "STUDY",
  uniqueField: "studyId",
  businessId: { field: "studyId", prefix: "STDY" },
  searchFields: ["studyId", "name", "studyCode", "details"],
  defaultSortBy: "name",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    { model: Project, as: "project", attributes: ["id", "projectId", "name"], required: false },
    { model: LimsUser, as: "supervisor", attributes: ["id", "userName"], required: false }
  ],
  relationFields: { group: "groupId", project: "projectId", supervisor: "supervisorId" }
};

const service = buildCrudService(studyConfig);

export default buildCrudRouter({
  service,
  entityName: studyConfig.entityName,
  permissionEntity: studyConfig.permissionEntity,
  createDto: CreateStudyDto,
  updateDto: UpdateStudyDto,
  model: Study,
  businessId: studyConfig.businessId
});
