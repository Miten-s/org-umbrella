import Group from "../models/group.model";
import { buildCrudRouter, buildCrudService, CrudConfig } from "../utils/crud-factory";
import { CreateGroupDto, UpdateGroupDto } from "../dtos/master-data.dto";
import { invalidateAllUserContexts } from "../services/user-context.service";

/**
 * Lab Groups — the access partition itself.
 *
 * Note the entity is NOT group-filtered by its own rule (a group row has no
 * `groupId` column), so the factory's filter is a no-op here. Visibility of
 * the group list is governed by VIEW:GROUP alone.
 */
export const groupConfig: CrudConfig<Group> = {
  model: Group,
  entityName: "Lab Group",
  permissionEntity: "GROUP",
  uniqueField: "groupId",
  searchFields: ["groupId", "name", "description"],
  defaultSortBy: "name",
  relations: [{ model: Group, as: "parentGroup", attributes: ["id", "name"], required: false }],
  relationFields: { parentGroup: "parentGroupId" },

  /**
   * `ownedBy` is a person in the auth database, so it cannot be a join. The id
   * and display name are stored side by side and re-nested here into the
   * `{ id, name }` shape the client expects from every relation.
   */
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
