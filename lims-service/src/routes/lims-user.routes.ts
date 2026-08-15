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

  normalizePayload: (payload) => {
    const next = { ...payload };

    // The picker sends the chosen platform user as `user: { id, name }` —
    // one object, because that is what an AsyncSelect yields. Split it into
    // the two columns. `userName` is denormalised here because the platform
    // user lives in the auth database and cannot be joined.
    if (next.user && typeof next.user === "object") {
      const { id, name } = next.user as { id?: string; name?: string };
      if (id) next.userId = id;
      if (name) next.userName = name;
      delete next.user;
    }

    // ["<uuid>", …] → [{ groupId: "<uuid>" }, …] so the child sync can diff them.
    if (Array.isArray(next.accessGroups)) {
      next.accessGroups = next.accessGroups.map((id: string) => ({ groupId: id }));
    }
    if (Array.isArray(next.roles)) {
      next.roles = next.roles.map((id: string) => ({ roleId: id }));
    }
    return next;
  },

  /**
   * `user` and `userId` are both optional on the DTO so either shape is
   * accepted, which means neither being present has to be caught here — the
   * column is NOT NULL and would otherwise surface as a raw database error.
   */
  beforeCreate: (payload) => {
    if (!payload.userId) {
      throw Object.assign(
        new Error("Select the platform user this lab user grants access to."),
        { statusCode: 400 }
      );
    }
    return payload;
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
