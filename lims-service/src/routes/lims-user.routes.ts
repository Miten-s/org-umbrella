import LimsUser from "../models/lims-user.model";
import UserAccessGroup from "../models/user-access-group.model";
import UserRole from "../models/user-role.model";
import Group from "../models/group.model";
import Role from "../models/role.model";
import Location from "../models/location.model";
import { buildCrudRouter, buildCrudService, CrudConfig } from "../utils/crud-factory";
import { CreateLimsUserDto, UpdateLimsUserDto } from "../dtos/master-data.dto";
import { invalidateAllUserContexts } from "../services/user-context.service";

/**
 * Lab Users. LIMS never creates a person — this record grants an existing
 * platform user access and assigns their home group, access groups and roles.
 *
 * `accessGroups` and `roles` arrive as arrays of ids. They are join tables, so
 * they are handled by the same nested-children machinery as any other
 * sub-form: the id arrays are expanded into child rows first, which gives them
 * replace-set semantics and puts membership changes in the audit diff for free.
 */
export const limsUserConfig: CrudConfig<LimsUser> = {
  model: LimsUser,
  entityName: "Lab User",
  permissionEntity: "USER",
  uniqueField: "userId",
  searchFields: ["userId", "userName", "description"],
  defaultSortBy: "userName",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    {
      model: Location,
      as: "location",
      attributes: ["id", "locationId", "locationName"],
      required: false
    },
    {
      model: Group,
      as: "accessGroups",
      attributes: ["id", "name"],
      through: { attributes: [] },
      required: false
    },
    {
      model: Role,
      as: "roles",
      attributes: ["id", "roleId", "name"],
      through: { attributes: [] },
      required: false
    }
  ],
  relationFields: { group: "groupId", location: "locationId" },

  // ["<uuid>", …] → [{ groupId: "<uuid>" }, …] so the child sync can diff them.
  normalizePayload: (payload) => {
    const next = { ...payload };
    if (Array.isArray(next.accessGroups)) {
      next.accessGroups = next.accessGroups.map((id: string) => ({ groupId: id }));
    }
    if (Array.isArray(next.roles)) {
      next.roles = next.roles.map((id: string) => ({ roleId: id }));
    }
    return next;
  },

  children: [
    {
      field: "accessGroups",
      model: UserAccessGroup,
      foreignKey: "limsUserId",
      fields: ["groupId"],
      matchKey: "groupId"
    },
    {
      field: "roles",
      model: UserRole,
      foreignKey: "limsUserId",
      fields: ["roleId"],
      matchKey: "roleId"
    }
  ],

  // Changing someone's groups or roles is exactly the case that must not wait
  // for a cache to expire.
  afterWrite: invalidateAllUserContexts
};

const service = buildCrudService(limsUserConfig);

export default buildCrudRouter({
  service,
  entityName: limsUserConfig.entityName,
  permissionEntity: limsUserConfig.permissionEntity,
  createDto: CreateLimsUserDto,
  updateDto: UpdateLimsUserDto
});
