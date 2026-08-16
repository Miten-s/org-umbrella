import Project from "../models/project.model";
import Group from "../models/group.model";
import Customer from "../models/customer.model";
import LimsUser from "../models/lims-user.model";
import { buildCrudRouter, buildCrudService, CrudConfig } from "../utils/crud-factory";
import { CreateProjectDto, UpdateProjectDto } from "../dtos/commercial.dto";

/** Projects. Parent of Studies; referenced by Stock Batches and Samples. */
export const projectConfig: CrudConfig<Project> = {
  model: Project,
  entityName: "Project",
  permissionEntity: "PROJECT",
  uniqueField: "projectId",
  businessId: { field: "projectId", prefix: "PROJ" },
  searchFields: ["projectId", "name", "code", "details"],
  defaultSortBy: "name",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    { model: Customer, as: "customer", attributes: ["id", "customerId", "customerName", ["customer_name", "name"]], required: false },
    { model: LimsUser, as: "supervisor", attributes: ["id", "userName", ["user_name", "name"]], required: false }
  ],
  relationFields: { group: "groupId", customer: "customerId", supervisor: "supervisorId" }
};

const service = buildCrudService(projectConfig);

export default buildCrudRouter({
  service,
  entityName: projectConfig.entityName,
  permissionEntity: projectConfig.permissionEntity,
  createDto: CreateProjectDto,
  updateDto: UpdateProjectDto,
  model: Project,
  businessId: projectConfig.businessId
});
