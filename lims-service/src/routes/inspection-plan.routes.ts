import InspectionPlan from "../models/inspection-plan.model";
import InspectionPersonnel from "../models/inspection-personnel.model";
import Group from "../models/group.model";
import LimsUser from "../models/lims-user.model";
import Role from "../models/role.model";
import {
  buildCrudRouter,
  buildCrudService,
  CrudConfig
} from "../utils/crud-factory";
import {
  CreateInspectionPlanDto,
  UpdateInspectionPlanDto
} from "../dtos/instrument.dto";

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
        {
          model: LimsUser,
          as: "person",
          attributes: ["id", "userName", ["user_name", "name"]],
          required: false
        },
        {
          model: Role,
          as: "role",
          attributes: ["id", "roleId", "name"],
          required: false
        }
      ]
    }
  ],
  relationFields: { group: "groupId" },

  // The list column only shows a count (LimsInspectionPlan.columns.tsx:
  // `personnel?.length`) — neither the person/role sub-relations nor any
  // other column is read for the list.
  listRelationAttributes: { personnel: ["id"] },

  children: [
    {
      field: "personnel",
      model: InspectionPersonnel,
      foreignKey: "inspectionPlanId",
      fields: ["inspectionType", "personId", "roleId"],
      // The grid names them after the thing; the columns are `<name>Id`.
      relationFields: { person: "personId", role: "roleId" }
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
