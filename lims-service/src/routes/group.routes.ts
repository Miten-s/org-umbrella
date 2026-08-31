import Group from "../models/group.model";
import LimsUser from "../models/lims-user.model";
import { buildCrudRouter, buildCrudService, CrudConfig } from "../utils/crud-factory";
import { CreateGroupDto, UpdateGroupDto } from "../dtos/master-data.dto";
import { invalidateAllUserContexts } from "../services/user-context.service";

/** Lab Groups — the access partition itself. NOT group-filtered by its own rule (no
 * `groupId` column); visibility is governed by VIEW:GROUP alone. */

/** Keeps `ownedByName` in step with `ownedBy`. Absent means "not being changed" on a
 * PATCH; an empty value clears both. */
const resolveOwnerName = async (payload: Record<string, any>) => {
  if (!("ownedBy" in payload)) return payload;
  if (!payload.ownedBy) return { ...payload, ownedByName: null };

  const owner = await LimsUser.findByPk(payload.ownedBy as string);
  return { ...payload, ownedByName: owner?.userName ?? null };
};

export const groupConfig: CrudConfig<Group> = {
  model: Group,
  entityName: "Lab Group",
  permissionEntity: "GROUP",
  uniqueField: "groupId",
  searchFields: ["groupId", "name", "description"],
  defaultSortBy: "name",
  relations: [{ model: Group, as: "parentGroup", attributes: ["id", "name"], required: false }],
  relationFields: { parentGroup: "parentGroupId" },

  // The owner's name is denormalised alongside the id (cross-database, can't join) — without
  // this, `postFormat` below always produced `{ id, name: "" }`, showing the raw uuid.
  beforeCreate: (payload) => resolveOwnerName(payload),
  beforeUpdate: (payload) => resolveOwnerName(payload),

  // `ownedBy` can't be a join (cross-database) — the id/name pair is re-nested here into
  // the `{ id, name }` shape the client expects from every relation.
  postFormat: (row) => ({
    ...row,
    ownedBy: row.ownedBy ? { id: row.ownedBy, name: row.ownedByName ?? "" } : null
  }),

  // The group tree feeds every access decision, so a change here has to drop
  // cached permission contexts immediately.
  afterWrite: invalidateAllUserContexts
};

const service = buildCrudService(groupConfig);

export default buildCrudRouter({
  service,
  entityName: groupConfig.entityName,
  permissionEntity: groupConfig.permissionEntity,
  createDto: CreateGroupDto,
  updateDto: UpdateGroupDto
});
