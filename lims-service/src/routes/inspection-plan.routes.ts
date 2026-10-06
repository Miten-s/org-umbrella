import InspectionPlan from "../models/inspection-plan.model";
import InspectionPersonnel from "../models/inspection-personnel.model";
import Group from "../models/group.model";
import LimsUser from "../models/lims-user.model";
import { labRoleRefs } from "../services/lab-role.service";
import {
  buildCrudRouter,
  buildCrudService,
  CrudConfig
} from "../utils/crud-factory";
import {
  CreateInspectionPlanDto,
  UpdateInspectionPlanDto
} from "../dtos/instrument.dto";

/** Inspection Plans. Each personnel row names a person or role as `person`/`role`, widened
 * to the child table's FK columns here (the generic child sync doesn't map relations). */
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
        }
      ]
    }
  ],
  relationFields: { group: "groupId" },

  // A row names a person OR a role, never both — the entry type decides which one is kept.
  normalizePayload: (payload) => {
    if (!Array.isArray(payload.personnel)) return payload;
    return {
      ...payload,
      personnel: payload.personnel.map((row: Record<string, any>) => {
        if (row?.inspectionType === "User") return { ...row, role: null };
        if (row?.inspectionType === "Role") return { ...row, person: null };
        return row;
      })
    };
  },

  // The list column only shows a count (`personnel?.length`) — no sub-relation is read.
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

const base = buildCrudService(inspectionPlanConfig);

/** A personnel row's Lab Role lives in backend, so its name is looked up there. */
const withRoles = async <T>(plan: T): Promise<T> => {
  const personnel = (plan as any)?.personnel as
    Record<string, any>[] | undefined;
  if (!personnel?.length) return plan;
  const refs = await labRoleRefs(personnel.map((row) => row.roleId));
  for (const row of personnel) {
    row.role = row.roleId ? (refs.get(row.roleId) ?? null) : null;
  }
  return plan;
};

const service: typeof base = {
  ...base,
  getById: async (...args) => withRoles(await base.getById(...args)),
  create: async (...args) => withRoles(await base.create(...args)),
  update: async (...args) => withRoles(await base.update(...args)),
  restore: async (...args) => withRoles(await base.restore(...args))
};

export default buildCrudRouter({
  service,
  entityName: inspectionPlanConfig.entityName,
  permissionEntity: inspectionPlanConfig.permissionEntity,
  createDto: CreateInspectionPlanDto,
  updateDto: UpdateInspectionPlanDto,
  model: InspectionPlan,
  businessId: inspectionPlanConfig.businessId
});
