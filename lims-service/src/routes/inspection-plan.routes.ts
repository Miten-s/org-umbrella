import InspectionPlan from "../models/inspection-plan.model";
import InspectionPersonnel from "../models/inspection-personnel.model";
import Group from "../models/group.model";
import LimsUser from "../models/lims-user.model";
import Role from "../models/role.model";
import { buildCrudRouter, buildCrudService, CrudConfig } from "../utils/crud-factory";
import { CreateInspectionPlanDto, UpdateInspectionPlanDto } from "../dtos/instrument.dto";

/**
 * Inspection Plans. Each personnel row names either a person or a role — the
 * client sends them as `person`/`role`, so they are widened to the child
 * table's FK columns here (the generic child sync does not map relations).
 */
export const inspectionPlanConfig: CrudConfig<InspectionPlan> = {
  model: InspectionPlan,
  entityName: "Inspection Plan",
  permissionEntity: "INSPECTION_PLAN",
  uniqueField: "inspectionId",
  businessId: { field: "inspectionId", prefix: "INSP" },
  searchFields: ["inspectionId", "name", "description"],
  defaultSortBy: "name",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    {
      model: InspectionPersonnel,
      as: "personnel",
      required: false,
      include: [
        { model: LimsUser, as: "person", attributes: ["id", "userName"], required: false },
        { model: Role, as: "role", attributes: ["id", "roleId", "name"], required: false }
      ]
    }
  ],
  relationFields: { group: "groupId" },
  normalizePayload: (payload) => {
    if (!Array.isArray(payload.personnel)) return payload;
    return {
      ...payload,
      personnel: payload.personnel.map((row: Record<string, any>) => ({
        inspectionType: row.inspectionType,
        personId: row.personId ?? row.person ?? null,
        roleId: row.roleId ?? row.role ?? null
      }))
    };
  },
  children: [
    {
      field: "personnel",
      model: InspectionPersonnel,
      foreignKey: "inspectionPlanId",
      fields: ["inspectionType", "personId", "roleId"]
    }
  ]
};

const service = buildCrudService(inspectionPlanConfig);

export default buildCrudRouter({
  service,
  entityName: inspectionPlanConfig.entityName,
  permissionEntity: inspectionPlanConfig.permissionEntity,
  createDto: CreateInspectionPlanDto,
  updateDto: UpdateInspectionPlanDto,
  model: InspectionPlan,
  businessId: inspectionPlanConfig.businessId
});
